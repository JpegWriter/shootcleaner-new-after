// React hooks for ShootCleaner Premium services
import { useMutation, useQuery } from '@tanstack/react-query'
import { 
  analyzeBatch, 
  loadUserProfile, 
  prepareImages,
  enhanceImage,
  enhanceBatch,
  type ImageInput,
  type VisionAnalysisResult,
  type UserProfile,
  type ImageAnalysisResult,
  type EnhancementResult
} from '../services'

// Hook for vision analysis
export function useVisionAnalysis() {
  return useMutation({
    mutationFn: async ({ 
      files, 
      profile 
    }: { 
      files: File[]
      profile?: UserProfile 
    }): Promise<VisionAnalysisResult> => {
      const images = await prepareImages(files)
      const userProfile = profile || await loadUserProfile()
      
      if (!userProfile) {
        throw new Error('User profile not found')
      }
      
      const profileData = {
        portfolioLinks: userProfile.portfolioLinks,
        rejectCriteria: userProfile.rejectCriteria,
        favoriteImageCount: userProfile.favoriteImages.length,
        presetCount: userProfile.presets.length,
        completedAt: userProfile.completedAt
      }
      
      return analyzeBatch(images, profileData)
    }
  })
}

// Hook for loading user profile
export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: loadUserProfile,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  })
}

// Hook for enhancing a single image
export function useImageEnhancement() {
  return useMutation({
    mutationFn: async ({
      imagePath,
      analysis,
      outputDir
    }: {
      imagePath: string
      analysis: ImageAnalysisResult
      outputDir: string
    }): Promise<EnhancementResult[]> => {
      return enhanceImage(imagePath, analysis, outputDir)
    }
  })
}

// Hook for batch enhancement
export function useBatchEnhancement() {
  return useMutation({
    mutationFn: async ({
      images,
      outputDir,
      onProgress
    }: {
      images: { path: string; analysis: ImageAnalysisResult }[]
      outputDir: string
      onProgress?: (completed: number, total: number, current: string) => void
    }): Promise<{ [imagePath: string]: EnhancementResult[] }> => {
      return enhanceBatch(images, outputDir, onProgress)
    }
  })
}
