// ShootCleaner RAW Conversion Service
// Using dynamic imports to avoid Vite build issues
const sharp = typeof window === 'undefined' ? require('sharp') : null;
const fs = typeof window === 'undefined' ? require('fs').promises : null;
const path = typeof window === 'undefined' ? require('path') : null;

export interface ConversionResult {
  lowResPath: string;
  hdPath: string;
  metadata: {
    originalFormat: string;
    width: number;
    height: number;
    fileSize: number;
    exifData?: any;
  };
}

export interface ConversionOptions {
  lowResWidth: number;
  lowResHeight: number;
  hdWidth?: number;
  hdHeight?: number;
  quality: number;
  preserveExif: boolean;
}

class RAWConversionService {
  private readonly previewCacheDir = './preview-cache';
  private readonly editReadyDir = './edit-ready';
  private readonly metadataDir = './metadata';

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    const directories = [this.previewCacheDir, this.editReadyDir, this.metadataDir];
    if (typeof window !== 'undefined' && window.api && window.api.ensureDirectories) {
      await window.api.ensureDirectories(directories);
    }
  }

  /**
   * Convert RAW or JPEG to dual outputs: low-res preview + HD version
   */
  async convertImage(
    inputFile: File | string,
    imageId: string,
    options: ConversionOptions = {
      lowResWidth: 800,
      lowResHeight: 600,
      hdWidth: 1920,
      hdHeight: 1080,
      quality: 85,
      preserveExif: true
    }
  ): Promise<ConversionResult> {
    try {
      console.log(`Converting image: ${imageId}`);

      // Handle File object or file path
      let inputBuffer: Buffer;
      if (inputFile instanceof File) {
        inputBuffer = Buffer.from(await inputFile.arrayBuffer());
      } else {
        inputBuffer = await fs.readFile(inputFile);
      }

      // Get image metadata
      const metadata = await sharp(inputBuffer).metadata();
      
      // Generate output paths
      const lowResPath = path.join(this.previewCacheDir, `${imageId}_preview.jpg`);
      const hdPath = path.join(this.editReadyDir, `${imageId}_hd.jpg`);

      // Convert to low-res preview
      await sharp(inputBuffer)
        .resize(options.lowResWidth, options.lowResHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: 70,
          progressive: true 
        })
        .toFile(lowResPath);

      // Convert to HD version
      const hdSharp = sharp(inputBuffer);
      
      if (options.hdWidth && options.hdHeight) {
        hdSharp.resize(options.hdWidth, options.hdHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      await hdSharp
        .jpeg({ 
          quality: options.quality,
          progressive: true 
        })
        .toFile(hdPath);

      // Extract and save EXIF data if requested
      let exifData;
      if (options.preserveExif) {
        exifData = await this.extractExifData(inputBuffer);
        await this.saveMetadata(imageId, {
          originalFormat: metadata.format || 'unknown',
          width: metadata.width || 0,
          height: metadata.height || 0,
          fileSize: inputBuffer.length,
          exifData
        });
      }

      const result: ConversionResult = {
        lowResPath,
        hdPath,
        metadata: {
          originalFormat: metadata.format || 'unknown',
          width: metadata.width || 0,
          height: metadata.height || 0,
          fileSize: inputBuffer.length,
          exifData
        }
      };

      console.log(`Conversion complete for ${imageId}`);
      return result;

    } catch (error) {
      console.error(`Error converting image ${imageId}:`, error);
      throw new Error(`Failed to convert image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch convert multiple images
   */
  async convertBatch(
    inputFiles: Array<{ file: File | string; id: string }>,
    options?: ConversionOptions,
    onProgress?: (completed: number, total: number) => void
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    const total = inputFiles.length;

    console.log(`Starting batch conversion of ${total} images`);

    for (let i = 0; i < inputFiles.length; i++) {
      const { file, id } = inputFiles[i];
      
      try {
        const result = await this.convertImage(file, id, options);
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, total);
        }
      } catch (error) {
        console.error(`Failed to convert image ${id}:`, error);
        // Continue with other images even if one fails
      }
    }

    console.log(`Batch conversion complete: ${results.length}/${total} successful`);
    return results;
  }

  /**
   * Get preview image path for an image ID
   */
  getPreviewPath(imageId: string): string {
    return path.join(this.previewCacheDir, `${imageId}_preview.jpg`);
  }

  /**
   * Get HD image path for an image ID
   */
  getHDPath(imageId: string): string {
    return path.join(this.editReadyDir, `${imageId}_hd.jpg`);
  }

  /**
   * Check if converted files exist for an image
   */
  async hasConvertedFiles(imageId: string): Promise<{ preview: boolean; hd: boolean }> {
    const previewPath = this.getPreviewPath(imageId);
    const hdPath = this.getHDPath(imageId);

    const [previewExists, hdExists] = await Promise.all([
      this.fileExists(previewPath),
      this.fileExists(hdPath)
    ]);

    return {
      preview: previewExists,
      hd: hdExists
    };
  }

  /**
   * Clean up converted files for an image
   */
  async cleanupImage(imageId: string): Promise<void> {
    const previewPath = this.getPreviewPath(imageId);
    const hdPath = this.getHDPath(imageId);
    const metadataPath = path.join(this.metadataDir, `${imageId}.json`);

    await Promise.all([
      this.safeDelete(previewPath),
      this.safeDelete(hdPath),
      this.safeDelete(metadataPath)
    ]);
  }

  /**
   * Get conversion statistics
   */
  async getStats(): Promise<{
    previewCount: number;
    hdCount: number;
    totalSize: number;
  }> {
    try {
      const [previewFiles, hdFiles] = await Promise.all([
        fs.readdir(this.previewCacheDir),
        fs.readdir(this.editReadyDir)
      ]);

      let totalSize = 0;
      
      // Calculate total size
      const allFiles = [
        ...previewFiles.map(f => path.join(this.previewCacheDir, f)),
        ...hdFiles.map(f => path.join(this.editReadyDir, f))
      ];

      for (const filePath of allFiles) {
        try {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        } catch {
          // Ignore files that can't be read
        }
      }

      return {
        previewCount: previewFiles.length,
        hdCount: hdFiles.length,
        totalSize
      };
    } catch (error) {
      console.error('Error getting conversion stats:', error);
      return { previewCount: 0, hdCount: 0, totalSize: 0 };
    }
  }

  private async extractExifData(buffer: Buffer): Promise<any> {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        depth: metadata.depth,
        density: metadata.density,
        hasProfile: metadata.hasProfile,
        hasAlpha: metadata.hasAlpha,
        exif: metadata.exif ? metadata.exif.toString() : null
      };
    } catch (error) {
      console.error('Error extracting EXIF data:', error);
      return null;
    }
  }

  private async saveMetadata(imageId: string, metadata: any): Promise<void> {
    const metadataPath = path.join(this.metadataDir, `${imageId}.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async safeDelete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore errors when deleting (file might not exist)
    }
  }
}

export const rawConversionService = new RAWConversionService();
