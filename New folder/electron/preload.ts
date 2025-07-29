import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for ShootCleaner Premium
const api = {
  // Directory creation helper
  ensureDirectories: (dirs: string[]) => ipcRenderer.invoke('fs:ensureDirectories', dirs),
  // App information
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getName: () => ipcRenderer.invoke('app:getName'),
  
  // File system operations
  showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:showOpenDialog', options),
  showItemInFolder: (path: string) => ipcRenderer.invoke('shell:showItemInFolder', path),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  
  // Image processing APIs
  processImages: (images: any[]) => ipcRenderer.invoke('image:process', images),
  analyzeWithOpenAI: (imageData: any) => ipcRenderer.invoke('ai:analyze', imageData),
  
  // ImageMagick processing
  checkImageMagick: () => ipcRenderer.invoke('imagemagick:checkAvailability'),
  processImageMagick: (params: { inputPath: string, outputPath: string, commands: any[] }) => 
    ipcRenderer.invoke('imagemagick:processImage', params),
  batchProcessImages: (params: { images: any[], settings: any }) => 
    ipcRenderer.invoke('imagemagick:batchProcess', params),
  
  // File download helper
  downloadFile: (filePath: string, filename: string) => {
    // For now, just show the file in folder - implement actual download later
    return ipcRenderer.invoke('shell:showItemInFolder', filePath)
  },
  
  // Settings and preferences
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: any) => ipcRenderer.invoke('settings:set', settings),
  
  // License management
  validateLicense: (licenseKey: string) => ipcRenderer.invoke('license:validate', licenseKey),
  getLicenseInfo: () => ipcRenderer.invoke('license:info'),
}

// Use `contextBridge` APIs to expose Electron APIs to renderer only if context isolation is enabled
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
