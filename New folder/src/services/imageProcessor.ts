// ImageMagick Processing Service for ShootCleaner Premium
// Handles image enhancement and batch processing

import type { 
  ImageAnalysisResult, 
  ImageMagickCommand, 
  ProcessedImage, 
  ImportSettings, 
  ImportProgress,
  EnhancementSettings,
  ProcessingResult
} from '../types'

export interface EnhancementResult {
  success: boolean
  outputPath?: string
  error?: string
  command?: string
  originalPath: string
  enhancementType: string
}

export interface ProcessedImage {
  id: string
  name: string
  originalPath: string
  previewPath: string
  hdPath: string
  isRaw: boolean
  metadata: {
    camera: string
    lens: string
    iso: number
    aperture: string
    shutter: string
    focal: string
    date: string
    originalWidth: number
    originalHeight: number
    fileSize: string
    format: string
    colorSpace: string
    whiteBalance: string
  }
}

export interface ImportProgress {
  overall: number
  current: number
  fileName: string
  stage: string
}

export interface ImportSettings {
  previewMaxSize: number
  hdMaxSize: number
  jpegQuality: number
  previewQuality: number
}

export class ImageProcessor {
  private static instance: ImageProcessor
  
  static getInstance(): ImageProcessor {
    if (!ImageProcessor.instance) {
      ImageProcessor.instance = new ImageProcessor()
    }
    return ImageProcessor.instance
  }

  /**
   * Execute an ImageMagick command through Electron IPC
   */
  async executeCommand(
    command: string, 
    inputPath: string, 
    outputPath: string
  ): Promise<EnhancementResult> {
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.executeImageMagick({
          command,
          inputPath,
          outputPath
        })
        
        return {
          success: result.success,
          outputPath: result.success ? outputPath : undefined,
          error: result.error,
          command,
          originalPath: inputPath,
          enhancementType: this.extractEnhancementType(command)
        }
      } else {
        // Browser fallback - return mock success
        console.warn('ImageMagick not available in browser mode')
        return {
          success: true,
          outputPath,
          originalPath: inputPath,
          enhancementType: this.extractEnhancementType(command),
          command
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Enhancement failed',
        originalPath: inputPath,
        enhancementType: this.extractEnhancementType(command),
        command
      }
    }
  }

  /**
   * Process a single image with enhancement commands from vision analysis
   */
  async enhanceImage(
    imagePath: string, 
    analysisResult: ImageAnalysisResult,
    outputDir: string
  ): Promise<EnhancementResult[]> {
    if (!analysisResult.commands || analysisResult.commands.length === 0) {
      return []
    }

    const results: EnhancementResult[] = []
    let currentInputPath = imagePath
    
    for (let i = 0; i < analysisResult.commands.length; i++) {
      const cmd = analysisResult.commands[i]
      const outputFileName = this.generateOutputFileName(
        analysisResult.filename, 
        cmd.operation, 
        i
      )
      const outputPath = `${outputDir}/${outputFileName}`
      
      const command = this.buildImageMagickCommand(cmd)
      const result = await this.executeCommand(command, currentInputPath, outputPath)
      
      results.push(result)
      
      // Use output of previous command as input for next command
      if (result.success && result.outputPath) {
        currentInputPath = result.outputPath
      }
    }

    return results
  }

  /**
   * Process multiple images in batch
   */
  async enhanceBatch(
    images: { path: string; analysis: ImageAnalysisResult }[],
    outputDir: string,
    onProgress?: (completed: number, total: number, current: string) => void
  ): Promise<{ [imagePath: string]: EnhancementResult[] }> {
    const results: { [imagePath: string]: EnhancementResult[] } = {}
    
    for (let i = 0; i < images.length; i++) {
      const item = images[i]
      
      if (onProgress) {
        onProgress(i, images.length, item.analysis.filename)
      }
      
      try {
        const enhancementResults = await this.enhanceImage(
          item.path, 
          item.analysis, 
          outputDir
        )
        results[item.path] = enhancementResults
      } catch (error) {
        console.error(`Failed to enhance ${item.path}:`, error)
        results[item.path] = [{
          success: false,
          error: error instanceof Error ? error.message : 'Enhancement failed',
          originalPath: item.path,
          enhancementType: 'batch_error'
        }]
      }
    }
    
    if (onProgress) {
      onProgress(images.length, images.length, 'Complete')
    }
    
    return results
  }

  /**
   * Apply a specific enhancement operation to an image
   */
  async applyEnhancement(
    imagePath: string,
    operation: string,
    parameters: Record<string, any> = {},
    outputPath: string
  ): Promise<EnhancementResult> {
    const command = this.buildSingleOperation(operation, parameters)
    return this.executeCommand(command, imagePath, outputPath)
  }

  /**
   * Get image information using ImageMagick identify
   */
  async getImageInfo(imagePath: string) {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        return await window.electronAPI.getImageInfo(imagePath)
      } else {
        // Browser fallback
        return {
          width: 1920,
          height: 1080,
          format: 'JPEG',
          colorSpace: 'sRGB',
          fileSize: '2.5MB'
        }
      }
    } catch (error) {
      console.error('Failed to get image info:', error)
      return null
    }
  }

  /**
   * Import and process RAW/JPEG files
   */
  async importImages(
    filePaths: string[],
    settings: ImportSettings,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ProcessedImage[]> {
    const processedImages: ProcessedImage[] = []
    
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i]
      const fileName = filePath.split(/[\\/]/).pop() || ''
      
      if (onProgress) {
        onProgress({
          overall: Math.round((i / filePaths.length) * 100),
          current: i + 1,
          fileName,
          stage: 'Processing...'
        })
      }
      
      try {
        // This would call Electron APIs to process the image
        const processed = await this.processImageFile(filePath, settings)
        processedImages.push(processed)
      } catch (error) {
        console.error(`Failed to process ${fileName}:`, error)
      }
    }
    
    return processedImages
  }

  /**
   * Process a single image file (RAW or standard format)
   */
  private async processImageFile(
    filePath: string, 
    settings: ImportSettings
  ): Promise<ProcessedImage> {
    const fileName = filePath.split(/[\\/]/).pop() || ''
    const isRaw = this.isRawFormat(fileName)
    
    // Mock processed image - in real app this would process via Electron
    return {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: fileName,
      originalPath: filePath,
      previewPath: `${filePath}_preview.jpg`,
      hdPath: `${filePath}_hd.jpg`,
      isRaw,
      metadata: {
        camera: 'Canon EOS R5',
        lens: 'RF 24-70mm f/2.8L IS USM',
        iso: 400,
        aperture: 'f/2.8',
        shutter: '1/250s',
        focal: '50mm',
        date: new Date().toISOString(),
        originalWidth: 8192,
        originalHeight: 5464,
        fileSize: '45.2MB',
        format: isRaw ? 'CR2' : 'JPEG',
        colorSpace: 'sRGB',
        whiteBalance: 'Auto'
      }
    }
  }

  /**
   * Check if file is RAW format
   */
  private isRawFormat(filename: string): boolean {
    const rawFormats = ['cr2', 'nef', 'arw', 'raf', 'dng', 'orf', 'rw2', 'pef', 'srw', '3fr', 'fff']
    const extension = filename.toLowerCase().split('.').pop()
    return extension ? rawFormats.includes(extension) : false
  }

  /**
   * Build ImageMagick command from enhancement command object
   */
  private buildImageMagickCommand(cmd: any): string {
    const { operation, parameters } = cmd
    return this.buildSingleOperation(operation, parameters)
  }

  /**
   * Build a single ImageMagick operation
   */
  private buildSingleOperation(operation: string, parameters: Record<string, any>): string {
    switch (operation) {
      case 'brighten':
        return `convert INPUT -brightness-contrast ${parameters.brightness || 10}x0 OUTPUT`
      case 'enhance':
        const brightness = parameters.brightness || 0
        const contrast = parameters.contrast || 0
        const sharpness = parameters.sharpness || 0
        return `convert INPUT -brightness-contrast ${brightness}x${contrast} -unsharp 0x${sharpness} OUTPUT`
      case 'sharpen':
        return `convert INPUT -unsharp 0x${parameters.amount || 1} OUTPUT`
      case 'denoise':
        return `convert INPUT -despeckle OUTPUT`
      case 'contrast':
        return `convert INPUT -brightness-contrast 0x${parameters.amount || 10} OUTPUT`
      case 'auto-level':
        return `convert INPUT -auto-level OUTPUT`
      case 'normalize':
        return `convert INPUT -normalize OUTPUT`
      default:
        return `convert INPUT OUTPUT` // Basic copy
    }
  }

  /**
   * Extract enhancement type from command string
   */
  private extractEnhancementType(command: string): string {
    if (command.includes('brightness-contrast')) return 'brightness_contrast'
    if (command.includes('unsharp')) return 'sharpness'
    if (command.includes('despeckle')) return 'denoise'
    if (command.includes('auto-level')) return 'auto_level'
    if (command.includes('normalize')) return 'normalize'
    return 'enhancement'
  }

  /**
   * Enhanced image processing with professional settings for batch enhancement
   */
  async enhanceImageBatch(file: File, settings: EnhancementSettings): Promise<ProcessingResult> {
    try {
      // Convert File to buffer for processing
      const buffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(buffer)

      // In Electron mode, process via ImageMagick API
      if (window.api?.batchProcessImages) {
        const result = await window.api.batchProcessImages({
          images: [{
            name: file.name,
            buffer: uint8Array
          }],
          settings
        })

        if (!result || !result[0] || !result[0].success) {
          throw new Error(result?.[0]?.error || 'Enhancement processing failed')
        }

        return {
          success: true,
          outputPath: result[0].outputPath,
          processingTime: result[0].processingTime,
          settings
        }
      } else {
        // Browser fallback - simulate processing
        console.warn('ImageMagick not available in browser mode, simulating enhancement')
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing time
        
        return {
          success: true,
          outputPath: `enhanced_${file.name}`,
          processingTime: 1000,
          settings
        }
      }
    } catch (error) {
      console.error('Image enhancement error:', error)
      return {
        success: false,
        outputPath: '',
        error: error instanceof Error ? error.message : 'Enhancement failed'
      }
    }
  }

  /**
   * Generate ImageMagick commands for enhancement settings
   */
  private generateEnhancementCommands(settings: EnhancementSettings): ImageMagickCommand[] {
    const commands: ImageMagickCommand[] = []

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

    // Highlight/Shadow recovery
    if (settings.highlights !== 0 || settings.shadows !== 0) {
      commands.push({
        operation: 'shadows-highlights',
        params: [`${Math.abs(settings.shadows)}x${Math.abs(settings.highlights)}`]
      })
    }

    // Color temperature and tint
    if (settings.temperature !== 0 || settings.tint !== 0) {
      commands.push({
        operation: 'color-matrix',
        params: [this.generateColorMatrix(settings.temperature, settings.tint)]
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
    commands.push({
      operation: 'format',
      params: [settings.format.toUpperCase()]
    })

    if (settings.format === 'jpeg') {
      commands.push({
        operation: 'quality',
        params: [settings.quality.toString()]
      })
    }

    return commands
  }

  /**
   * Generate color matrix for temperature/tint adjustments
   */
  private generateColorMatrix(temperature: number, tint: number): string {
    // Simplified color matrix generation
    // In a real implementation, this would be more sophisticated
    const tempFactor = 1 + (temperature / 100) * 0.1
    const tintFactor = 1 + (tint / 100) * 0.05
    
    return `${tempFactor} 0 0 0 ${tintFactor} 0 1 0 0 0 0 0 1`
  }

  /**
   * Generate output filename for enhanced images
   */
  private generateOutputFileName(originalName: string, operation: string, step: number): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
    const ext = originalName.split('.').pop()
    return `${nameWithoutExt}_${operation}_${step + 1}.${ext}`
  }
}

/**
 * Convenience functions for common operations
 */
export const imageProcessor = ImageProcessor.getInstance()

export async function enhanceImage(
  imagePath: string, 
  analysisResult: ImageAnalysisResult, 
  outputDir: string
): Promise<EnhancementResult[]> {
  return imageProcessor.enhanceImage(imagePath, analysisResult, outputDir)
}

export async function enhanceBatch(
  images: { path: string; analysis: ImageAnalysisResult }[],
  outputDir: string,
  onProgress?: (completed: number, total: number, current: string) => void
): Promise<{ [imagePath: string]: EnhancementResult[] }> {
  return imageProcessor.enhanceBatch(images, outputDir, onProgress)
}

export async function applyQuickEnhancement(
  imagePath: string,
  enhancementType: 'brighten' | 'sharpen' | 'denoise' | 'contrast',
  outputPath: string,
  parameters: Record<string, any> = {}
): Promise<EnhancementResult> {
  return imageProcessor.applyEnhancement(imagePath, enhancementType, parameters, outputPath)
}

// Declare global interface for Electron APIs
declare global {
  interface Window {
    electronAPI?: {
      executeImageMagick: (options: {
        command: string
        inputPath: string
        outputPath: string
      }) => Promise<{ success: boolean; error?: string }>
      
      getImageInfo: (imagePath: string) => Promise<any>
      
      importImages: (filePaths: string[], settings: ImportSettings) => Promise<ProcessedImage[]>
      
      onImportProgress: (callback: (progress: ImportProgress) => void) => void
    }
  }
}
