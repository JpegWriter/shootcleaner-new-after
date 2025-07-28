import { useState, useRef, useCallback } from 'react'
import { 
  Upload, 
  FileImage, 
  Settings, 
  Trash2, 
  Camera,
  Calendar,
  HardDrive,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { imageProcessor, type ProcessedImage, type ImportProgress, type ImportSettings } from '../../services'

export default function RAWImport() {
  const [images, setImages] = useState<ProcessedImage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [settings, setSettings] = useState<ImportSettings>({
    previewMaxSize: 800,
    hdMaxSize: 2400,  
    jpegQuality: 90,
    previewQuality: 85
  })
  const [showSettings, setShowSettings] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Supported image formats
  const rawFormats = ['cr2', 'nef', 'arw', 'raf', 'dng', 'orf', 'rw2', 'pef', 'srw', '3fr', 'fff']
  const standardFormats = ['jpg', 'jpeg', 'png', 'tiff', 'tif', 'bmp']
  const allFormats = [...rawFormats, ...standardFormats]

  const isValidImageFormat = (filename: string): boolean => {
    const extension = filename.toLowerCase().split('.').pop()
    return extension ? allFormats.includes(extension) : false
  }

  const getFileExtension = (filename: string): string => {
    return filename.toLowerCase().split('.').pop() || ''
  }

  const isRawFormat = (filename: string): boolean => {
    const extension = getFileExtension(filename)
    return rawFormats.includes(extension)
  }

  const processSelectedFiles = async (filePaths: string[]) => {
    if (filePaths.length === 0) return

    setIsProcessing(true)
    setProgress({ overall: 0, current: 0, fileName: '', stage: 'Starting...' })

    try {
      const processedImages = await imageProcessor.importImages(
        filePaths, 
        settings,
        (progress) => setProgress(progress)
      )
      
      setImages(prev => [...prev, ...processedImages])
    } catch (error) {
      console.error('Import failed:', error)
    } finally {
      setIsProcessing(false)
      setProgress(null)
    }
  }

  const handleButtonImport = async () => {
    try {
      // In real Electron app, this would open file dialog
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.showOpenDialog({
          properties: ['openFile', 'multiSelections'],
          filters: [
            { name: 'Images', extensions: allFormats },
            { name: 'RAW Images', extensions: rawFormats },
            { name: 'Standard Images', extensions: standardFormats }
          ]
        })
        
        if (!result.canceled && result.filePaths) {
          await processSelectedFiles(result.filePaths)
        }
      } else {
        // Browser fallback - trigger file input
        fileInputRef.current?.click()
      }
    } catch (error) {
      console.error('File selection failed:', error)
    }
  }

  const handleFileSelect = (files: FileList) => {
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => isValidImageFormat(file.name))
    
    if (validFiles.length !== fileArray.length) {
      console.warn('Some files were skipped - only image files are supported')
    }
    
    // In browser mode, create mock file paths
    const filePaths = validFiles.map(file => URL.createObjectURL(file))
    processSelectedFiles(filePaths)
  }

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files)
    }
  }

  const clearImages = () => {
    setImages([])
  }

  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">RAW Import</h1>
          <p className="text-gray-400">Import and process RAW files for professional workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          {images.length > 0 && (
            <button
              onClick={clearImages}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Import Settings */}
      {showSettings && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-white font-semibold mb-4">Import Settings</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Preview Size (px)
              </label>
              <input
                type="number"
                value={settings.previewMaxSize}
                onChange={(e) => setSettings(prev => ({ ...prev, previewMaxSize: parseInt(e.target.value) }))}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                HD Size (px)
              </label>
              <input
                type="number"
                value={settings.hdMaxSize}
                onChange={(e) => setSettings(prev => ({ ...prev, hdMaxSize: parseInt(e.target.value) }))}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                JPEG Quality (%)
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={settings.jpegQuality}
                onChange={(e) => setSettings(prev => ({ ...prev, jpegQuality: parseInt(e.target.value) }))}
                className="w-full"
              />
              <span className="text-gray-400 text-sm">{settings.jpegQuality}%</span>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Preview Quality (%)
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={settings.previewQuality}
                onChange={(e) => setSettings(prev => ({ ...prev, previewQuality: parseInt(e.target.value) }))}
                className="w-full"
              />
              <span className="text-gray-400 text-sm">{settings.previewQuality}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-primary-500 bg-primary-500/10' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Import RAW & Image Files
          </h3>
          <p className="text-gray-400 mb-4">
            Drag and drop your RAW files here, or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Supports: {rawFormats.join(', ').toUpperCase()}, JPEG, PNG, TIFF
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allFormats.map(ext => `.${ext}`).join(',')}
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <button
            onClick={handleButtonImport}
            disabled={isProcessing}
            className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Select Files'}
          </button>
        </div>
      </div>

      {/* Processing Progress */}
      {isProcessing && progress && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin">
              <Zap className="h-6 w-6 text-primary-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">Processing Images</h3>
              <p className="text-gray-400 text-sm">
                {progress.stage} - {progress.fileName} ({progress.current} of {images.length + progress.current})
              </p>
            </div>
            <span className="text-primary-400 font-medium">{progress.overall}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress.overall}%` }}
            />
          </div>
        </div>
      )}

      {/* Imported Images */}
      {images.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg">
                Imported Images ({images.length})
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-accent-500 rounded-full" />
                  RAW Files: {images.filter(img => img.isRaw).length}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  Standard: {images.filter(img => !img.isRaw).length}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-start gap-4">
                    {/* Image Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gray-600 rounded-lg overflow-hidden">
                        {image.previewPath && (
                          <img
                            src={image.previewPath}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </div>

                    {/* Image Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-medium truncate">{image.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          image.isRaw 
                            ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {image.metadata.format}
                        </span>
                        <button
                          onClick={() => removeImage(image.id)}
                          className="text-gray-400 hover:text-red-400 ml-auto"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Camera className="h-3 w-3" />
                          <span>{image.metadata.camera}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <span>ISO {image.metadata.iso}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <span>{image.metadata.aperture}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <span>{image.metadata.shutter}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <HardDrive className="h-3 w-3" />
                          <span>{image.metadata.fileSize}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <span>{image.metadata.originalWidth}×{image.metadata.originalHeight}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(image.metadata.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          <span>Processed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Declare global interface for Electron APIs (if not already declared)
declare global {
  interface Window {
    electronAPI?: {
      showOpenDialog: (options: {
        properties: string[]
        filters: Array<{ name: string; extensions: string[] }>
      }) => Promise<{ canceled: boolean; filePaths?: string[] }>
    }
  }
}
