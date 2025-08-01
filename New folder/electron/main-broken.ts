import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Set up Electron security and development environment
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#181a1b',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  })

  // Show window when ready to prevent visual flash
  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
      
      // Focus on window creation
      if (is.dev) {
        mainWindow.webContents.openDevTools()
      }
    }
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Make all links open with the browser, not with the application
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Load the remote URL for development or the local html file for production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.shootcleaner.premium')

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Create main window
  createWindow()

  // macOS specific behavior
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
      event.preventDefault()
    }
  })
})

// IPC handlers for ShootCleaner functionality
ipcMain.handle('app:getVersion', () => {
  return app.getVersion()
})

ipcMain.handle('app:getName', () => {
  return app.getName()
})

// Test ImageMagick availability
ipcMain.handle('imagemagick:checkAvailability', async () => {
  try {
    const { stdout } = await execAsync('magick -version')
    return {
      available: true,
      version: stdout.split('\n')[0],
      message: 'ImageMagick is available'
    }
  } catch (error) {
    console.log('ImageMagick not found, trying convert command...')
    try {
      const { stdout } = await execAsync('convert -version')
      if (stdout.includes('ImageMagick')) {
        return {
          available: true,
          version: stdout.split('\n')[0],
          message: 'ImageMagick is available (using convert command)'
        }
      }
    } catch (convertError) {
      // Ignore convert error as it might be Windows convert.exe
    }
    
    return {
      available: false,
      error: error instanceof Error ? error.message : 'ImageMagick not found',
      message: 'ImageMagick is not installed or not in PATH'
    }
  }
})

// ImageMagick processing handlers
ipcMain.handle('imagemagick:processImage', async (_, { inputPath, outputPath, commands }) => {
  try {
    // Build ImageMagick command
    const magickCommand = buildImageMagickCommand(inputPath, outputPath, commands)
    console.log('Executing ImageMagick command:', magickCommand)
    
    // Execute the command
    const { stdout, stderr } = await execAsync(magickCommand)
    
    if (stderr) {
      console.warn('ImageMagick warning:', stderr)
    }
    
    // Check if output file was created
    const outputExists = fs.existsSync(outputPath)
    
    return {
      success: outputExists,
      outputPath: outputExists ? outputPath : undefined,
      error: outputExists ? undefined : 'Output file not created',
      processingTime: Date.now()
    }
  } catch (error) {
    console.error('ImageMagick processing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed',
      outputPath: undefined
    }
  }
})

ipcMain.handle('imagemagick:batchProcess', async (_, { images, settings }) => {
  const results = []
  
  for (const imageData of images) {
    try {
      // Create temporary input file
      const tempDir = path.join(__dirname, '../temp')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      
      const inputPath = path.join(tempDir, `input_${Date.now()}_${imageData.name}`)
      const outputPath = path.join(tempDir, `output_${Date.now()}_${imageData.name}`)
      
      // Write buffer to temp file
      fs.writeFileSync(inputPath, Buffer.from(imageData.buffer))
      
      // Generate commands from settings
      const commands = generateCommandsFromSettings(settings)
      
      // Process the image
      const result = await new Promise((resolve) => {
        const magickCommand = buildImageMagickCommand(inputPath, outputPath, commands)
        console.log('Processing:', imageData.name, 'with command:', magickCommand)
        
        exec(magickCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('ImageMagick error:', error)
            resolve({
              success: false,
              error: error.message,
              name: imageData.name
            })
            return
          }
          
          if (stderr) {
            console.warn('ImageMagick warning:', stderr)
          }
          
          const outputExists = fs.existsSync(outputPath)
          resolve({
            success: outputExists,
            outputPath: outputExists ? outputPath : undefined,
            error: outputExists ? undefined : 'Output file not created',
            name: imageData.name,
            processingTime: Date.now()
          })
        })
      })
      
      results.push(result)
      
      // Clean up input file
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath)
      }
      
    } catch (error) {
      console.error('Batch processing error for', imageData.name, ':', error)
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
        name: imageData.name
      })
    }
  }
  
  return results
})

// Helper function to build ImageMagick command
function buildImageMagickCommand(inputPath: string, outputPath: string, commands: any[]): string {
  let command = `magick "${inputPath}"`
  
  for (const cmd of commands) {
    switch (cmd.operation) {
      case 'brightness-contrast':
        command += ` -brightness-contrast ${cmd.params[0]}`
        break
      case 'modulate':
        command += ` -modulate ${cmd.params[0]}`
        break
      case 'evaluate':
        command += ` -evaluate ${cmd.params[0]} ${cmd.params[1]}`
        break
      case 'shadows-highlights':
        command += ` -shadows-highlights ${cmd.params[0]}`
        break
      case 'color-matrix':
        command += ` -color-matrix "${cmd.params[0]}"`
        break
      case 'unsharp':
        command += ` -unsharp ${cmd.params[0]}`
        break
      case 'despeckle':
        command += ` -despeckle`
        break
      case 'resize':
        command += ` -resize ${cmd.params[0]}`
        break
      case 'format':
        command += ` -format ${cmd.params[0]}`
        break
      case 'quality':
        command += ` -quality ${cmd.params[0]}`
        break
      default:
        console.warn('Unknown ImageMagick operation:', cmd.operation)
    }
  }
  
  command += ` "${outputPath}"`
  return command
}

// Helper function to generate commands from enhancement settings
function generateCommandsFromSettings(settings: any): any[] {
  const commands = []
  
  // Basic adjustments
  if (settings.brightness !== 0 || settings.contrast !== 0) {
    commands.push({
      operation: 'brightness-contrast',
      params: [`${settings.brightness}x${settings.contrast}`]
    })
  }
  
  if (settings.saturation !== 0) {
    commands.push({
      operation: 'modulate',
      params: [`100,${100 + settings.saturation},100`]
    })
  }
  
  // Exposure adjustment
  if (settings.exposure !== 0) {
    const exposureValue = Math.pow(2, settings.exposure)
    commands.push({
      operation: 'evaluate',
      params: ['multiply', exposureValue.toString()]
    })
  }
  
  // Sharpening
  if (settings.sharpening > 0) {
    const radius = settings.sharpening / 100 * 2
    commands.push({
      operation: 'unsharp',
      params: [`${radius}x1+${settings.sharpening / 100}+0`]
    })
  }
  
  // Noise reduction
  if (settings.noiseReduction > 0) {
    commands.push({
      operation: 'despeckle'
    })
  }
  
  // Resize if requested
  if (settings.resize) {
    const geometry = settings.maintainAspectRatio 
      ? `${settings.width}x${settings.height}>`
      : `${settings.width}x${settings.height}!`
    
    commands.push({
      operation: 'resize',
      params: [geometry]
    })
  }
  
  // Output format and quality
  if (settings.format === 'jpeg') {
    commands.push({
      operation: 'quality',
      params: [settings.quality.toString()]
    })
  }
  
  return commands
}

ipcMain.handle('dialog:showOpenDialog', async (_, options) => {
  const { dialog } = require('electron')
  if (mainWindow) {
    const result = await dialog.showOpenDialog(mainWindow, options)
    return result
  }
  return { canceled: true, filePaths: [] }
})

ipcMain.handle('shell:showItemInFolder', (_, fullPath: string) => {
  shell.showItemInFolder(fullPath)
})

ipcMain.handle('shell:openExternal', (_, url: string) => {
  shell.openExternal(url)
})

// Handle app protocol for deep linking
app.setAsDefaultProtocolClient('shootcleaner')

// Handle protocol launches on Windows/Linux
app.on('second-instance', (_, commandLine) => {
  // Someone tried to run a second instance, focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
  
  // Handle protocol URL
  const url = commandLine.find(arg => arg.startsWith('shootcleaner://'))
  if (url) {
    // Handle deep link
    console.log('Deep link:', url)
  }
})
