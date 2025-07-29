// ShootCleaner AI Analysis Service
import type { UserStyleProfile } from './styleProfileService';

export interface ImageAnalysisResult {
  image_id: string;
  scores: {
    sharpness: number;
    eyes_open: boolean;
    duplicates: string | null;
    face_match: 'primary' | 'secondary' | 'none';
    blurriness: boolean;
    artistry: number;
    style_match: number;
    composition: number;
    exposure: number;
    color_harmony: number;
  };
  editInstructions: string[];
  metadata: {
    faces_detected: number;
    dominant_colors: string[];
    scene_type: string;
    lighting: 'natural' | 'artificial' | 'mixed';
    time_of_day: 'morning' | 'afternoon' | 'evening' | 'night' | 'unknown';
  };
  recommendations: {
    keep: boolean;
    priority: 'high' | 'medium' | 'low';
    reasons: string[];
    suggested_edits: string[];
  };
}

export interface AnalysisPayload {
  image: string; // base64 or URL
  styleProfile: UserStyleProfile;
  includeAnalysis: boolean;
  returnEdits: boolean;
  analysisType: 'culling' | 'editing' | 'full';
}

export interface BatchAnalysisProgress {
  completed: number;
  total: number;
  currentImage: string;
  stage: 'uploading' | 'analyzing' | 'processing' | 'complete';
}

class AIAnalysisService {
  private readonly openAIAssistantId = 'asst_qGplgwIGY48tQ2vk44kXSVCH';
  private readonly apiEndpoint = 'https://api.openai.com/v1/threads';
  private readonly maxBatchSize = 10;

  /**
   * Analyze a single image for culling and editing
   */
  async analyzeImage(
    imagePath: string,
    imageId: string,
    styleProfile: UserStyleProfile,
    analysisType: 'culling' | 'editing' | 'full' = 'full'
  ): Promise<ImageAnalysisResult> {
    try {
      console.log(`Analyzing image: ${imageId}`);

      // Convert image to base64 for API
      const imageBase64 = await this.imageToBase64(imagePath);

      const payload: AnalysisPayload = {
        image: imageBase64,
        styleProfile,
        includeAnalysis: true,
        returnEdits: analysisType !== 'culling',
        analysisType
      };

      // Call OpenAI Assistant
      const analysis = await this.callOpenAIAssistant(payload);

      // Process and validate response
      const result: ImageAnalysisResult = {
        image_id: imageId,
        scores: {
          sharpness: this.validateScore(analysis.scores?.sharpness, 8.5),
          eyes_open: analysis.scores?.eyes_open ?? true,
          duplicates: analysis.scores?.duplicates ?? null,
          face_match: analysis.scores?.face_match ?? 'none',
          blurriness: analysis.scores?.blurriness ?? false,
          artistry: this.validateScore(analysis.scores?.artistry, 7.5),
          style_match: this.validateScore(analysis.scores?.style_match, 85),
          composition: this.validateScore(analysis.scores?.composition, 8.0),
          exposure: this.validateScore(analysis.scores?.exposure, 7.0),
          color_harmony: this.validateScore(analysis.scores?.color_harmony, 8.0)
        },
        editInstructions: analysis.editInstructions || this.generateDefaultEdits(styleProfile),
        metadata: {
          faces_detected: analysis.metadata?.faces_detected ?? 0,
          dominant_colors: analysis.metadata?.dominant_colors ?? ['#333333', '#666666'],
          scene_type: analysis.metadata?.scene_type ?? 'portrait',
          lighting: analysis.metadata?.lighting ?? 'natural',
          time_of_day: analysis.metadata?.time_of_day ?? 'unknown'
        },
        recommendations: {
          keep: analysis.recommendations?.keep ?? true,
          priority: analysis.recommendations?.priority ?? 'medium',
          reasons: analysis.recommendations?.reasons ?? ['Good overall quality'],
          suggested_edits: analysis.recommendations?.suggested_edits ?? ['Basic color correction']
        }
      };

      // Save analysis to metadata folder
      await this.saveAnalysis(imageId, result);

      console.log(`Analysis complete for ${imageId}`);
      return result;

    } catch (error) {
      console.error(`Error analyzing image ${imageId}:`, error);
      // Return default analysis on error
      return this.getDefaultAnalysis(imageId);
    }
  }

  /**
   * Analyze multiple images in batches
   */
  async analyzeBatch(
    images: Array<{ id: string; path: string }>,
    styleProfile: UserStyleProfile,
    analysisType: 'culling' | 'editing' | 'full' = 'full',
    onProgress?: (progress: BatchAnalysisProgress) => void
  ): Promise<ImageAnalysisResult[]> {
    const results: ImageAnalysisResult[] = [];
    const total = images.length;
    let completed = 0;

    console.log(`Starting batch analysis of ${total} images`);

    // Process in smaller batches to avoid API limits
    for (let i = 0; i < images.length; i += this.maxBatchSize) {
      const batch = images.slice(i, i + this.maxBatchSize);
      
      if (onProgress) {
        onProgress({
          completed,
          total,
          currentImage: batch[0].id,
          stage: 'analyzing'
        });
      }

      // Process batch in parallel
      const batchPromises = batch.map(async (image) => {
        try {
          const result = await this.analyzeImage(image.path, image.id, styleProfile, analysisType);
          completed++;
          
          if (onProgress) {
            onProgress({
              completed,
              total,
              currentImage: image.id,
              stage: completed === total ? 'complete' : 'analyzing'
            });
          }
          
          return result;
        } catch (error) {
          console.error(`Failed to analyze ${image.id}:`, error);
          completed++;
          return this.getDefaultAnalysis(image.id);
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to respect API limits
      if (i + this.maxBatchSize < images.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Batch analysis complete: ${results.length}/${total} processed`);
    return results;
  }

  /**
   * Group images by duplicates/similarity
   */
  async groupSimilarImages(analyses: ImageAnalysisResult[]): Promise<Array<{
    groupId: string;
    images: ImageAnalysisResult[];
    bestImage: ImageAnalysisResult;
    reason: string;
  }>> {
    const groups: Map<string, ImageAnalysisResult[]> = new Map();
    const ungrouped: ImageAnalysisResult[] = [];

    // Group by duplicate markers
    analyses.forEach(analysis => {
      if (analysis.scores.duplicates) {
        const groupId = analysis.scores.duplicates;
        if (!groups.has(groupId)) {
          groups.set(groupId, []);
        }
        groups.get(groupId)!.push(analysis);
      } else {
        ungrouped.push(analysis);
      }
    });

    // Convert to result format
    const result = Array.from(groups.entries()).map(([groupId, images]) => {
      // Find best image in group (highest combined score)
      const bestImage = images.reduce((best, current) => {
        const bestScore = best.scores.artistry + best.scores.sharpness + best.scores.style_match;
        const currentScore = current.scores.artistry + current.scores.sharpness + current.scores.style_match;
        return currentScore > bestScore ? current : best;
      });

      return {
        groupId,
        images,
        bestImage,
        reason: 'Similar composition/content detected'
      };
    });

    // Add ungrouped images as single-image groups
    ungrouped.forEach(analysis => {
      result.push({
        groupId: `single_${analysis.image_id}`,
        images: [analysis],
        bestImage: analysis,
        reason: 'Unique image'
      });
    });

    return result;
  }

  /**
   * Get culling recommendations based on analysis
   */
  getCullingRecommendations(analyses: ImageAnalysisResult[]): {
    keep: ImageAnalysisResult[];
    discard: ImageAnalysisResult[];
    review: ImageAnalysisResult[];
  } {
    const keep: ImageAnalysisResult[] = [];
    const discard: ImageAnalysisResult[] = [];
    const review: ImageAnalysisResult[] = [];

    analyses.forEach(analysis => {
      if (analysis.scores.blurriness || analysis.scores.sharpness < 5) {
        discard.push(analysis);
      } else if (analysis.scores.artistry >= 8 && analysis.scores.style_match >= 80) {
        keep.push(analysis);
      } else {
        review.push(analysis);
      }
    });

    return { keep, discard, review };
  }

  /**
   * Load saved analysis for an image
   */
  async loadAnalysis(imageId: string): Promise<ImageAnalysisResult | null> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const analysisPath = path.join('./analysis', `${imageId}.json`);
      const data = await fs.readFile(analysisPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  private async callOpenAIAssistant(payload: AnalysisPayload): Promise<any> {
    // This is a placeholder implementation
    // In a real implementation, you would integrate with the OpenAI Assistant API
    
    console.log('Calling OpenAI Assistant for image analysis...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock analysis based on style profile
    const mockAnalysis = {
      scores: {
        sharpness: 7.5 + Math.random() * 2,
        eyes_open: Math.random() > 0.2,
        duplicates: Math.random() > 0.8 ? `group_${Math.floor(Math.random() * 5)}` : null,
        face_match: Math.random() > 0.6 ? 'primary' : 'none',
        blurriness: Math.random() < 0.1,
        artistry: 6 + Math.random() * 4,
        style_match: 70 + Math.random() * 30,
        composition: 6 + Math.random() * 3,
        exposure: 6 + Math.random() * 3,
        color_harmony: 6 + Math.random() * 3
      },
      editInstructions: this.generateDefaultEdits(payload.styleProfile),
      metadata: {
        faces_detected: Math.floor(Math.random() * 3),
        dominant_colors: ['#2176FF', '#19C9C2'],
        scene_type: 'portrait',
        lighting: 'natural',
        time_of_day: 'afternoon'
      },
      recommendations: {
        keep: Math.random() > 0.3,
        priority: 'medium',
        reasons: ['Good composition', 'Clear focus'],
        suggested_edits: ['Color correction', 'Slight sharpening']
      }
    };

    return mockAnalysis;
  }

  private generateDefaultEdits(styleProfile: UserStyleProfile): string[] {
    const { styleAnalysis, preferences } = styleProfile;
    
    const edits = [
      `brightness ${styleAnalysis.brightness > 0 ? '+' : ''}${styleAnalysis.brightness}`,
      `contrast ${styleAnalysis.contrast > 0 ? '+' : ''}${styleAnalysis.contrast}`,
      `saturation ${styleAnalysis.saturation > 0 ? '+' : ''}${styleAnalysis.saturation}`
    ];

    // Add resolution based on preferences
    if (preferences.outputResolution !== 'original') {
      edits.push(`resize ${preferences.outputResolution}`);
    }

    // Add color grading
    switch (preferences.colorGrading) {
      case 'warm':
        edits.push('temperature +200');
        break;
      case 'cool':
        edits.push('temperature -200');
        break;
      case 'vintage':
        edits.push('sepia 20', 'vignette 0.3');
        break;
    }

    return edits;
  }

  private async saveAnalysis(imageId: string, analysis: ImageAnalysisResult): Promise<void> {
    try {
      const analysisDir = './analysis';
      if (typeof window !== 'undefined' && window.api && window.api.ensureDirectories) {
        await window.api.ensureDirectories([analysisDir]);
      }
      const path = await import('path');
      const fs = await import('fs/promises');
      const analysisPath = path.join(analysisDir, `${imageId}.json`);
      await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  }

  private async imageToBase64(imagePath: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(imagePath);
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
  }

  private validateScore(score: any, defaultValue: number): number {
    const parsed = typeof score === 'number' ? score : parseFloat(score);
    return isNaN(parsed) ? defaultValue : Math.max(0, Math.min(10, parsed));
  }

  private getDefaultAnalysis(imageId: string): ImageAnalysisResult {
    return {
      image_id: imageId,
      scores: {
        sharpness: 7.0,
        eyes_open: true,
        duplicates: null,
        face_match: 'none',
        blurriness: false,
        artistry: 7.0,
        style_match: 75,
        composition: 7.0,
        exposure: 7.0,
        color_harmony: 7.0
      },
      editInstructions: ['brightness +5', 'contrast +10', 'resize 1920x1080'],
      metadata: {
        faces_detected: 0,
        dominant_colors: ['#333333', '#666666'],
        scene_type: 'unknown',
        lighting: 'natural',
        time_of_day: 'unknown'
      },
      recommendations: {
        keep: true,
        priority: 'medium',
        reasons: ['Analysis unavailable - default keep'],
        suggested_edits: ['Basic enhancement']
      }
    };
  }
}

export const aiAnalysisService = new AIAnalysisService();
