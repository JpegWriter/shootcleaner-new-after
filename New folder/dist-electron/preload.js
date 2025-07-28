"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const preload_1 = require("@electron-toolkit/preload");
// Custom APIs for ShootCleaner Premium
const api = {
    // App information
    getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
    getName: () => electron_1.ipcRenderer.invoke('app:getName'),
    // File system operations
    showOpenDialog: (options) => electron_1.ipcRenderer.invoke('dialog:showOpenDialog', options),
    showItemInFolder: (path) => electron_1.ipcRenderer.invoke('shell:showItemInFolder', path),
    openExternal: (url) => electron_1.ipcRenderer.invoke('shell:openExternal', url),
    // Image processing APIs
    processImages: (images) => electron_1.ipcRenderer.invoke('image:process', images),
    analyzeWithOpenAI: (imageData) => electron_1.ipcRenderer.invoke('ai:analyze', imageData),
    // ImageMagick processing
    checkImageMagick: () => electron_1.ipcRenderer.invoke('imagemagick:checkAvailability'),
    processImageMagick: (params) => electron_1.ipcRenderer.invoke('imagemagick:processImage', params),
    batchProcessImages: (params) => electron_1.ipcRenderer.invoke('imagemagick:batchProcess', params),
    // File download helper
    downloadFile: (filePath, filename) => {
        // For now, just show the file in folder - implement actual download later
        return electron_1.ipcRenderer.invoke('shell:showItemInFolder', filePath);
    },
    // Settings and preferences
    getSettings: () => electron_1.ipcRenderer.invoke('settings:get'),
    setSettings: (settings) => electron_1.ipcRenderer.invoke('settings:set', settings),
    // License management
    validateLicense: (licenseKey) => electron_1.ipcRenderer.invoke('license:validate', licenseKey),
    getLicenseInfo: () => electron_1.ipcRenderer.invoke('license:info'),
};
// Use `contextBridge` APIs to expose Electron APIs to renderer only if context isolation is enabled
if (process.contextIsolated) {
    try {
        electron_1.contextBridge.exposeInMainWorld('electron', preload_1.electronAPI);
        electron_1.contextBridge.exposeInMainWorld('api', api);
    }
    catch (error) {
        console.error(error);
    }
}
else {
    // @ts-ignore (define in dts)
    window.electron = preload_1.electronAPI;
    // @ts-ignore (define in dts)
    window.api = api;
}
