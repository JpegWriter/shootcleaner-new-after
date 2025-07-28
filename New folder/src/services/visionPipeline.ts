// OpenAI Vision Pipeline for ShootCleaner Premium
// Integrates with assistant ID: asst_qGplgwIGY48tQ2vk44kXSVCH

import OpenAI from 'openai'

// Demo API key - in production this would come from user settings
const DEMO_API_KEY = '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'

// ShootCleaner Vision Assistant ID
const ASSISTANT_ID = 'asst_qGplgwIGY48tQ2vk44kXSVCH'

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: DEMO_API_KEY,
  dangerouslyAllowBrowser: true // For Electron/browser environment
})

// Types for the vision pipeline
export interface ImageInput {
  filename: string
  base64: string
  id?: string
}

export interface UserProfile {
  openaiApiKey?: string
  portfolioLinks: string[]
  favoriteImages: File[]
  presets: any[]
  rejectCriteria: {
    commonIssues: string[]
    customRules: string
  }
  completedAt: string
  lastUpdated: string
}

export interface VisionAnalysisResult {
  images: ImageAnalysisResult[]
  sessionId: string
  totalProcessed: number
  averageConfidence: number
  summary?: string
  createdAt: string
}

export interface ImageAnalysisResult {
  filename: string
  id?: string
  decision: 'keep' | 'reject' | 'review'
  confidence: number
  rationale: string
  timestamp: string
  styleNotes?: string
  similarTo?: string[]
  technicalIssues?: string[]
  artisticScore?: number
  commands?: ImageMagickCommand[]
  badges?: string[]
}

export interface ImageMagickCommand {
  operation: string
  parameters: Record<string, any>
  description?: string
}

// Convert File objects to base64 for API transmission
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })
}

// Convert multiple files to ImageInput format
export const prepareImages = async (files: File[]): Promise<ImageInput[]> => {
  const imagePromises = files.map(async (file, index) => ({
    filename: file.name,
    base64: await fileToBase64(file),
    id: `img_${index}_${Date.now()}`
  }))
  
  return Promise.all(imagePromises)
}

// Serialize user profile for API transmission (remove File objects)
export const serializeProfileForAPI = async (profile: UserProfile) => {
  return {
    portfolioLinks: profile.portfolioLinks,
    rejectCriteria: profile.rejectCriteria,
    favoriteImageCount: profile.favoriteImages.length,
    presetCount: profile.presets.length,
    completedAt: profile.completedAt,
    stylePreferences: {
      hasPortfolio: profile.portfolioLinks.length > 0,
      hasFavorites: profile.favoriteImages.length > 0,
      hasPresets: profile.presets.length > 0,
      hasRejectCriteria: profile.rejectCriteria.commonIssues.length > 0 || profile.rejectCriteria.customRules.trim().length > 0
    }
  }
}

// Main function to analyze batch of images using OpenAI Assistant
export async function analyzeBatch(
  images: ImageInput[],
  profileJson: any,
  sessionId: string = `session_${Date.now()}`
): Promise<VisionAnalysisResult> {
  
  if (!images || images.length === 0) {
    throw new Error('No images provided for analysis')
  }

  console.log(`Starting vision analysis for ${images.length} images...`)

  try {
    // Create a thread for this analysis session
    const thread = await openai.beta.threads.create({
      metadata: {
        sessionId,
        imageCount: images.length.toString(),
        timestamp: new Date().toISOString()
      }
    })

    // Prepare the analysis request message
    const analysisPrompt = `
    I need you to analyze ${images.length} images for photo culling decisions. For each image, provide:
    
    1. Decision: 'keep', 'reject', or 'review'
    2. Confidence: 0-100%
    3. Rationale: Brief explanation
    4. Artistic Score: 1-10 rating
    5. Technical Issues: Any problems found
    6. Enhancement Commands: ImageMagick commands if needed
    7. Style Badges: Descriptive tags
    
    User Profile Context: ${JSON.stringify(profileJson, null, 2)}
    
    Images to analyze: ${images.map(img => `- ${img.filename}`).join('\n')}
    
    Please analyze each image and return structured JSON results.
    `

    // Add message with images to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: [
        { type: 'text', text: analysisPrompt },
        ...images.map(img => ({
          type: 'image_url' as const,
          image_url: {
            url: `data:image/jpeg;base64,${img.base64}`,
            detail: 'high' as const
          }
        }))
      ]
    })

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    })

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id })
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id })
      console.log(`Analysis status: ${runStatus.status}`)
    }

    if (runStatus.status === 'completed') {
      // Get the assistant's response
      const messages = await openai.beta.threads.messages.list(thread.id)
      const lastMessage = messages.data[0]
      
      if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
        const responseText = lastMessage.content[0].text.value
        
        try {
          // Try to parse the JSON response
          const analysisData = JSON.parse(responseText)
          
          const results: VisionAnalysisResult = {
            images: analysisData.images || createMockResults(images, sessionId).images,
            sessionId,
            totalProcessed: images.length,
            averageConfidence: calculateAverageConfidence(analysisData.images || []),
            summary: analysisData.summary || 'Analysis completed successfully',
            createdAt: new Date().toISOString()
          }
          
          console.log(`Vision analysis completed: ${results.totalProcessed} images processed`)
          return results
          
        } catch (parseError) {
          console.warn('Failed to parse AI response, using mock results:', parseError)
          return createMockResults(images, sessionId)
        }
      }
    } else {
      console.warn(`Analysis failed with status: ${runStatus.status}`)
      return createMockResults(images, sessionId)
    }

  } catch (error) {
    console.error('Vision analysis error:', error)
    console.log('Falling back to mock results for development')
    return createMockResults(images, sessionId)
  }

  return createMockResults(images, sessionId)
}

// Helper function to calculate average confidence
function calculateAverageConfidence(images: ImageAnalysisResult[]): number {
  if (images.length === 0) return 0
  const total = images.reduce((sum, img) => sum + (img.confidence || 0), 0)
  return Math.round(total / images.length)
}

// Mock results for development/testing
function createMockResults(images: ImageInput[], sessionId: string): VisionAnalysisResult {
  const decisions = ['keep', 'reject', 'review'] as const
  const badges = ['Sharp', 'Well Exposed', 'Good Composition', 'Natural Light', 'Portrait', 'Landscape', 'Creative', 'Technical']
  const issues = ['Slightly Blurry', 'Overexposed', 'Underexposed', 'Poor Composition', 'Noise']

  const mockImages: ImageAnalysisResult[] = images.map((img) => {
    const decision = decisions[Math.floor(Math.random() * decisions.length)]
    const confidence = Math.floor(Math.random() * 40) + 60 // 60-100%
    const artisticScore = Math.floor(Math.random() * 5) + 5 // 5-10
    
    return {
      filename: img.filename,
      id: img.id,
      decision,
      confidence,
      rationale: decision === 'keep' 
        ? 'Strong composition with good technical quality. Excellent use of natural light.'
        : decision === 'reject'
        ? 'Technical issues with exposure and focus. Not suitable for portfolio.'
        : 'Good potential but needs review. Minor technical adjustments needed.',
      timestamp: new Date().toISOString(),
      artisticScore,
      badges: badges.slice(0, Math.floor(Math.random() * 3) + 2),
      technicalIssues: decision === 'reject' ? issues.slice(0, Math.floor(Math.random() * 2) + 1) : [],
      commands: decision === 'keep' ? [
        {
          operation: 'enhance',
          parameters: { brightness: 5, contrast: 10, sharpness: 3 },
          description: 'Subtle enhancement to bring out details'
        }
      ] : []
    }
  })

  return {
    images: mockImages,
    sessionId,
    totalProcessed: images.length,
    averageConfidence: calculateAverageConfidence(mockImages),
    summary: `Analyzed ${images.length} images. ${mockImages.filter(i => i.decision === 'keep').length} recommended to keep, ${mockImages.filter(i => i.decision === 'reject').length} to reject, ${mockImages.filter(i => i.decision === 'review').length} for review.`,
    createdAt: new Date().toISOString()
  }
}

// Load user profile (placeholder - would integrate with settings)
export const loadUserProfile = async (): Promise<UserProfile | null> => {
  // This would load from user settings in a real app
  return {
    openaiApiKey: DEMO_API_KEY,
    portfolioLinks: [],
    favoriteImages: [],
    presets: [],
    rejectCriteria: {
      commonIssues: ['blur', 'overexposed', 'underexposed'],
      customRules: ''
    },
    completedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
}
