"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const utils_1 = require("@electron-toolkit/utils");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Set up Electron security and development environment
if (!electron_1.app.requestSingleInstanceLock()) {
    electron_1.app.quit();
    process.exit(0);
}
let mainWindow = null;
function createWindow() {
    // Create the browser window
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        show: false,
        autoHideMenuBar: true,
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#181a1b',
        webPreferences: {
            preload: (0, path_1.join)(__dirname, '../preload/index.js'),
            sandbox: false,
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true
        }
    });
    // Show window when ready to prevent visual flash
    mainWindow.on('ready-to-show', () => {
        if (mainWindow) {
            mainWindow.show();
            // Focus on window creation
            if (utils_1.is.dev) {
                mainWindow.webContents.openDevTools();
            }
        }
    });
    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Make all links open with the browser, not with the application
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    // Load the remote URL for development or the local html file for production
    if (utils_1.is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    }
    else {
        mainWindow.loadFile((0, path_1.join)(__dirname, '../dist/index.html'));
    }
}
// This method will be called when Electron has finished initialization
electron_1.app.whenReady().then(() => {
    // Set app user model id for windows
    utils_1.electronApp.setAppUserModelId('com.shootcleaner.premium');
    // Default open or close DevTools by F12 in development
    electron_1.app.on('browser-window-created', (_, window) => {
        utils_1.optimizer.watchWindowShortcuts(window);
    });
    // Create main window
    createWindow();
    // macOS specific behavior
    electron_1.app.on('activate', function () {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
// Quit when all windows are closed
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Security: Prevent navigation to external URLs
electron_1.app.on('web-contents-created', (_, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
            event.preventDefault();
        }
    });
});
// IPC handlers for ShootCleaner functionality
electron_1.ipcMain.handle('app:getVersion', () => {
    return electron_1.app.getVersion();
});
electron_1.ipcMain.handle('app:getName', () => {
    return electron_1.app.getName();
});
// Test ImageMagick availability
electron_1.ipcMain.handle('imagemagick:checkAvailability', async () => {
    try {
        const { stdout } = await execAsync('magick -version');
        return {
            available: true,
            version: stdout.split('\n')[0],
            message: 'ImageMagick is available'
        };
    }
    catch (error) {
        console.log('ImageMagick not found, trying convert command...');
        try {
            const { stdout } = await execAsync('convert -version');
            if (stdout.includes('ImageMagick')) {
                return {
                    available: true,
                    version: stdout.split('\n')[0],
                    message: 'ImageMagick is available (using convert command)'
                };
            }
        }
        catch (convertError) {
            // Ignore convert error as it might be Windows convert.exe
        }
        return {
            available: false,
            error: error instanceof Error ? error.message : 'ImageMagick not found',
            message: 'ImageMagick is not installed or not in PATH'
        };
    }
});
// ImageMagick processing handlers
electron_1.ipcMain.handle('imagemagick:processImage', async (_, { inputPath, outputPath, commands }) => {
    try {
        // Build ImageMagick command
        const magickCommand = buildImageMagickCommand(inputPath, outputPath, commands);
        console.log('Executing ImageMagick command:', magickCommand);
        // Execute the command
        const { stdout, stderr } = await execAsync(magickCommand);
        if (stderr) {
            console.warn('ImageMagick warning:', stderr);
        }
        // Check if output file was created
        const outputExists = fs.existsSync(outputPath);
        return {
            success: outputExists,
            outputPath: outputExists ? outputPath : undefined,
            error: outputExists ? undefined : 'Output file not created',
            processingTime: Date.now()
        };
    }
    catch (error) {
        console.error('ImageMagick processing error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Processing failed',
            outputPath: undefined
        };
    }
});
electron_1.ipcMain.handle('imagemagick:batchProcess', async (_, { images, settings }) => {
    const results = [];
    for (const imageData of images) {
        try {
            // Create temporary input file
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const inputPath = path.join(tempDir, `input_${Date.now()}_${imageData.name}`);
            const outputPath = path.join(tempDir, `output_${Date.now()}_${imageData.name}`);
            // Write buffer to temp file
            fs.writeFileSync(inputPath, Buffer.from(imageData.buffer));
            // Generate commands from settings
            const commands = generateCommandsFromSettings(settings);
            // Process the image
            const result = await new Promise((resolve) => {
                const magickCommand = buildImageMagickCommand(inputPath, outputPath, commands);
                console.log('Processing:', imageData.name, 'with command:', magickCommand);
                (0, child_process_1.exec)(magickCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error('ImageMagick error:', error);
                        resolve({
                            success: false,
                            error: error.message,
                            name: imageData.name
                        });
                        return;
                    }
                    if (stderr) {
                        console.warn('ImageMagick warning:', stderr);
                    }
                    const outputExists = fs.existsSync(outputPath);
                    resolve({
                        success: outputExists,
                        outputPath: outputExists ? outputPath : undefined,
                        error: outputExists ? undefined : 'Output file not created',
                        name: imageData.name,
                        processingTime: Date.now()
                    });
                });
            });
            results.push(result);
            // Clean up input file
            if (fs.existsSync(inputPath)) {
                fs.unlinkSync(inputPath);
            }
        }
        catch (error) {
            console.error('Batch processing error for', imageData.name, ':', error);
            results.push({
                success: false,
                error: error instanceof Error ? error.message : 'Processing failed',
                name: imageData.name
            });
        }
    }
    return results;
});
// Helper function to build ImageMagick command
function buildImageMagickCommand(inputPath, outputPath, commands) {
    let command = `magick "${inputPath}"`;
    for (const cmd of commands) {
        switch (cmd.operation) {
            case 'brightness-contrast':
                command += ` -brightness-contrast ${cmd.params[0]}`;
                break;
            case 'modulate':
                command += ` -modulate ${cmd.params[0]}`;
                break;
            case 'evaluate':
                command += ` -evaluate ${cmd.params[0]} ${cmd.params[1]}`;
                break;
            case 'shadows-highlights':
                command += ` -shadows-highlights ${cmd.params[0]}`;
                break;
            case 'color-matrix':
                command += ` -color-matrix "${cmd.params[0]}"`;
                break;
            case 'unsharp':
                command += ` -unsharp ${cmd.params[0]}`;
                break;
            case 'despeckle':
                command += ` -despeckle`;
                break;
            case 'resize':
                command += ` -resize ${cmd.params[0]}`;
                break;
            case 'format':
                command += ` -format ${cmd.params[0]}`;
                break;
            case 'quality':
                command += ` -quality ${cmd.params[0]}`;
                break;
            default:
                console.warn('Unknown ImageMagick operation:', cmd.operation);
        }
    }
    command += ` "${outputPath}"`;
    return command;
}
// Helper function to generate commands from enhancement settings
function generateCommandsFromSettings(settings) {
    const commands = [];
    // Basic adjustments
    if (settings.brightness !== 0 || settings.contrast !== 0) {
        commands.push({
            operation: 'brightness-contrast',
            params: [`${settings.brightness}x${settings.contrast}`]
        });
    }
    if (settings.saturation !== 0) {
        commands.push({
            operation: 'modulate',
            params: [`100,${100 + settings.saturation},100`]
        });
    }
    // Exposure adjustment
    if (settings.exposure !== 0) {
        const exposureValue = Math.pow(2, settings.exposure);
        commands.push({
            operation: 'evaluate',
            params: ['multiply', exposureValue.toString()]
        });
    }
    // Sharpening
    if (settings.sharpening > 0) {
        const radius = settings.sharpening / 100 * 2;
        commands.push({
            operation: 'unsharp',
            params: [`${radius}x1+${settings.sharpening / 100}+0`]
        });
    }
    // Noise reduction
    if (settings.noiseReduction > 0) {
        commands.push({
            operation: 'despeckle'
        });
    }
    // Resize if requested
    if (settings.resize) {
        const geometry = settings.maintainAspectRatio
            ? `${settings.width}x${settings.height}>`
            : `${settings.width}x${settings.height}!`;
        commands.push({
            operation: 'resize',
            params: [geometry]
        });
    }
    // Output format and quality
    if (settings.format === 'jpeg') {
        commands.push({
            operation: 'quality',
            params: [settings.quality.toString()]
        });
    }
    return commands;
}
electron_1.ipcMain.handle('dialog:showOpenDialog', async (_, options) => {
    const { dialog } = require('electron');
    if (mainWindow) {
        const result = await dialog.showOpenDialog(mainWindow, options);
        return result;
    }
    return { canceled: true, filePaths: [] };
});
electron_1.ipcMain.handle('shell:showItemInFolder', (_, fullPath) => {
    electron_1.shell.showItemInFolder(fullPath);
});
electron_1.ipcMain.handle('shell:openExternal', (_, url) => {
    electron_1.shell.openExternal(url);
});
// Handle app protocol for deep linking
electron_1.app.setAsDefaultProtocolClient('shootcleaner');
// Handle protocol launches on Windows/Linux
electron_1.app.on('second-instance', (_, commandLine) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
        if (mainWindow.isMinimized())
            mainWindow.restore();
        mainWindow.focus();
    }
    // Handle protocol URL
    const url = commandLine.find(arg => arg.startsWith('shootcleaner://'));
    if (url) {
        // Handle deep link
        console.log('Deep link:', url);
    }
});
