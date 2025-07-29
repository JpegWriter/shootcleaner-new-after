// ShootCleaner ImageMagick Editing Service
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import type { ImageAnalysisResult } from './aiAnalysisService';
import type { UserStyleProfile } from './styleProfileService';

export interface EditingOptions {
  outputResolution: '1920x1080' | '2560x1440' | '3840x2160' | 'original';
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
  outputDirectory: string;
  batchMode: boolean;
}

export interface EditingResult {
  imageId: string;
  inputPath: string;
  outputPath: string;
  appliedEdits: string[];
  fileSize: number;
  processingTime: number;
  success: boolean;
  error?: string;
}

export interface BatchEditingProgress {
  completed: number;
  total: number;
  currentImage: string;
  stage: 'preparing' | 'editing' | 'saving' | 'complete';
  estimatedTimeRemaining: number;
}

class ImageMagickService {
  private readonly outputDir = './edited-output';
  private readonly tempDir = './temp-editing';

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    const directories = [this.outputDir, this.tempDir];
    if (typeof window !== 'undefined' && window.api && window.api.ensureDirectories) {
      await window.api.ensureDirectories(directories);
    }
  }

  /**
   * Apply AI-generated edits to a single image
   */
  async editImage(
    imageId: string,
    hdImagePath: string,
    analysis: ImageAnalysisResult,
    styleProfile: UserStyleProfile,
    options: EditingOptions = {
      outputResolution: '1920x1080',
      quality: 90,
      format: 'jpeg',
      outputDirectory: this.outputDir,
      batchMode: false
    }
  ): Promise<EditingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`Editing image: ${imageId}`);

      // Ensure input file exists
      await fs.access(hdImagePath);

      // Generate output path
      const outputPath = path.join(
        options.outputDirectory,
        `${imageId}_edited.${options.format}`
      );

      // Load image with Sharp
      let sharpInstance = sharp(hdImagePath);

      // Apply edits based on analysis and instructions
      const appliedEdits: string[] = [];

      // Process edit instructions
      for (const instruction of analysis.editInstructions) {
        const edit = await this.parseAndApplyEdit(sharpInstance, instruction, styleProfile);
        if (edit.applied) {
          sharpInstance = edit.sharpInstance;
          appliedEdits.push(edit.description);
        }
      }

      // Apply resolution scaling
      if (options.outputResolution !== 'original') {
        const [width, height] = options.outputResolution.split('x').map(Number);
        sharpInstance = sharpInstance.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
        appliedEdits.push(`Resized to ${options.outputResolution}`);
      }

      // Apply format-specific settings
      switch (options.format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ 
            quality: options.quality,
            progressive: true 
          });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ 
            quality: options.quality,
            progressive: true 
          });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ 
            quality: options.quality 
          });
          break;
      }

      // Save the edited image
      await sharpInstance.toFile(outputPath);

      // Get file size
      const stats = await fs.stat(outputPath);
      const processingTime = Date.now() - startTime;

      const result: EditingResult = {
        imageId,
        inputPath: hdImagePath,
        outputPath,
        appliedEdits,
        fileSize: stats.size,
        processingTime,
        success: true
      };

      console.log(`Editing complete for ${imageId} (${processingTime}ms)`);
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`Error editing image ${imageId}:`, error);
      
      return {
        imageId,
        inputPath: hdImagePath,
        outputPath: '',
        appliedEdits: [],
        fileSize: 0,
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Edit multiple images in batch
   */
  async editBatch(
    images: Array<{
      id: string;
      hdPath: string;
      analysis: ImageAnalysisResult;
    }>,
    styleProfile: UserStyleProfile,
    options: EditingOptions,
    onProgress?: (progress: BatchEditingProgress) => void
  ): Promise<EditingResult[]> {
    const results: EditingResult[] = [];
    const total = images.length;
    const startTime = Date.now();

    console.log(`Starting batch editing of ${total} images`);

    for (let i = 0; i < images.length; i++) {
      const { id, hdPath, analysis } = images[i];
      const completed = i;
      const elapsed = Date.now() - startTime;
      const avgTimePerImage = completed > 0 ? elapsed / completed : 0;
      const estimatedTimeRemaining = avgTimePerImage * (total - completed);

      if (onProgress) {
        onProgress({
          completed,
          total,
          currentImage: id,
          stage: 'editing',
          estimatedTimeRemaining
        });
      }

      try {
        const result = await this.editImage(id, hdPath, analysis, styleProfile, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to edit ${id}:`, error);
        results.push({
          imageId: id,
          inputPath: hdPath,
          outputPath: '',
          appliedEdits: [],
          fileSize: 0,
          processingTime: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (onProgress) {
      onProgress({
        completed: total,
        total,
        currentImage: '',
        stage: 'complete',
        estimatedTimeRemaining: 0
      });
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Batch editing complete: ${successCount}/${total} successful`);
    
    return results;
  }

  /**
   * Apply specific edit based on instruction string
   */
  private async parseAndApplyEdit(
    sharpInstance: sharp.Sharp,
    instruction: string,
    styleProfile: UserStyleProfile
  ): Promise<{
    sharpInstance: sharp.Sharp;
    applied: boolean;
    description: string;
  }> {
    const parts = instruction.toLowerCase().split(' ');
    const command = parts[0];
    const value = parts[1];

    try {
      switch (command) {
        case 'brightness':
          const brightnessValue = parseFloat(value) / 100;
          return {
            sharpInstance: sharpInstance.modulate({ brightness: 1 + brightnessValue }),
            applied: true,
            description: `Brightness ${value > '0' ? '+' : ''}${value}%`
          };

        case 'contrast':
          // Sharp doesn't have direct contrast, use gamma adjustment
          const gamma = parseFloat(value) > 0 ? 1.2 : 0.8;
          return {
            sharpInstance: sharpInstance.gamma(gamma),
            applied: true,
            description: `Contrast ${value > '0' ? '+' : ''}${value}%`
          };

        case 'saturation':
          const saturationValue = 1 + (parseFloat(value) / 100);
          return {
            sharpInstance: sharpInstance.modulate({ saturation: saturationValue }),
            applied: true,
            description: `Saturation ${value > '0' ? '+' : ''}${value}%`
          };

        case 'temperature':
          // Color temperature adjustment using tint
          const temp = parseFloat(value);
          if (temp > 0) {
            // Warmer - add red/yellow
            return {
              sharpInstance: sharpInstance.tint({ r: 255, g: 245, b: 230 }),
              applied: true,
              description: `Temperature +${temp}K (warmer)`
            };
          } else {
            // Cooler - add blue
            return {
              sharpInstance: sharpInstance.tint({ r: 230, g: 245, b: 255 }),
              applied: true,
              description: `Temperature ${temp}K (cooler)`
            };
          }

        case 'sharpen':
          const sharpenAmount = parseFloat(value) || 1;
          return {
            sharpInstance: sharpInstance.sharpen(sharpenAmount),
            applied: true,
            description: `Sharpen ${sharpenAmount}x`
          };

        case 'blur':
          const blurAmount = parseFloat(value);
          if (blurAmount > 0) {
            return {
              sharpInstance: sharpInstance.blur(blurAmount),
              applied: true,
              description: `Blur ${blurAmount}px`
            };
          }
          break;

        case 'sepia':
          const sepiaAmount = parseFloat(value) / 100;
          // Create sepia effect using modulate
          return {
            sharpInstance: sharpInstance
              .modulate({ saturation: 0.3 })
              .tint({ r: 255, g: 230, b: 180 }),
            applied: true,
            description: `Sepia ${value}%`
          };

        case 'vignette':
          // Vignette effect using composite
          const vignetteAmount = parseFloat(value);
          if (vignetteAmount > 0) {
            // This is a simplified vignette - in practice you'd create a radial gradient
            return {
              sharpInstance: sharpInstance.modulate({ brightness: 0.9 }),
              applied: true,
              description: `Vignette ${vignetteAmount}`
            };
          }
          break;

        case 'resize':
          // This is handled separately in the main function
          return {
            sharpInstance,
            applied: false,
            description: 'Resize handled separately'
          };

        default:
          console.warn(`Unknown edit command: ${command}`);
          return {
            sharpInstance,
            applied: false,
            description: `Unknown command: ${command}`
          };
      }
    } catch (error) {
      console.error(`Error applying edit ${instruction}:`, error);
      return {
        sharpInstance,
        applied: false,
        description: `Failed to apply: ${instruction}`
      };
    }

    return {
      sharpInstance,
      applied: false,
      description: `Not applied: ${instruction}`
    };
  }

  /**
   * Generate preview of edits without saving
   */
  async generateEditPreview(
    imageId: string,
    hdImagePath: string,
    analysis: ImageAnalysisResult,
    styleProfile: UserStyleProfile,
    previewSize: { width: number; height: number } = { width: 800, height: 600 }
  ): Promise<string> {
    try {
      let sharpInstance = sharp(hdImagePath);

      // Apply a subset of edits for preview
      const previewEdits = analysis.editInstructions.slice(0, 3); // Limit for speed
      
      for (const instruction of previewEdits) {
        const edit = await this.parseAndApplyEdit(sharpInstance, instruction, styleProfile);
        if (edit.applied) {
          sharpInstance = edit.sharpInstance;
        }
      }

      // Resize for preview
      sharpInstance = sharpInstance.resize(previewSize.width, previewSize.height, {
        fit: 'inside',
        withoutEnlargement: true
      });

      // Generate temporary preview file
      const previewPath = path.join(this.tempDir, `${imageId}_preview.jpg`);
      await sharpInstance.jpeg({ quality: 70 }).toFile(previewPath);

      return previewPath;
    } catch (error) {
      console.error(`Error generating edit preview for ${imageId}:`, error);
      throw error;
    }
  }

  /**
   * Get editing statistics
   */
  async getStats(): Promise<{
    totalEdited: number;
    totalOutputSize: number;
    averageProcessingTime: number;
    successRate: number;
  }> {
    try {
      const outputFiles = await fs.readdir(this.outputDir);
      let totalSize = 0;

      for (const file of outputFiles) {
        try {
          const stats = await fs.stat(path.join(this.outputDir, file));
          totalSize += stats.size;
        } catch {
          // Ignore files that can't be read
        }
      }

      return {
        totalEdited: outputFiles.length,
        totalOutputSize: totalSize,
        averageProcessingTime: 2500, // Placeholder - would track in real implementation
        successRate: 0.95 // Placeholder - would track in real implementation
      };
    } catch (error) {
      console.error('Error getting editing stats:', error);
      return {
        totalEdited: 0,
        totalOutputSize: 0,
        averageProcessingTime: 0,
        successRate: 0
      };
    }
  }

  /**
   * Clean up temporary and output files
   */
  async cleanup(imageId?: string): Promise<void> {
    try {
      if (imageId) {
        // Clean specific image files
        const patterns = [
          path.join(this.tempDir, `${imageId}_*`),
          path.join(this.outputDir, `${imageId}_*`)
        ];
        
        for (const pattern of patterns) {
          // In a real implementation, you'd use glob to match patterns
          console.log(`Cleaning up files matching: ${pattern}`);
        }
      } else {
        // Clean all temporary files
        const tempFiles = await fs.readdir(this.tempDir);
        for (const file of tempFiles) {
          await fs.unlink(path.join(this.tempDir, file));
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export const imageMagickService = new ImageMagickService();
