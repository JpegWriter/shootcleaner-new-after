import { useState, useCallback } from 'react'
import { 
  Upload, 
  Brain, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Zap,
  Filter,
  Download,
  Trash2,
  Star
} from 'lucide-react'
import { useVisionAnalysis, useUserProfile } from '../../hooks'
import type { VisionAnalysisResult, ImageAnalysisResult } from '../../types'

interface VisionAnalysisProps {
  onAnalysisComplete?: (results: VisionAnalysisResult) => void
  onImageAction?: (image: ImageAnalysisResult, action: string) => void
}

export default function VisionAnalysis({ onAnalysisComplete, onImageAction }: VisionAnalysisProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [analysisResults, setAnalysisResults] = useState<VisionAnalysisResult | null>(null)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [filterDecision, setFilterDecision] = useState<'all' | 'keep' | 'reject' | 'review'>('all')
  const [isDragOver, setIsDragOver] = useState(false)

  const visionAnalysis = useVisionAnalysis()
  const { data: userProfile } = useUserProfile()

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length !== files.length) {
      // Show toast notification - simplified for now
      console.warn('Only image files are supported')
    }
    
    setSelectedFiles(imageFiles)
    setAnalysisResults(null)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(event.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length !== files.length) {
      console.warn('Only image files are supported')
    }
    
    setSelectedFiles(imageFiles)
    setAnalysisResults(null)
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }, [])

  const runAnalysis = async () => {
    if (selectedFiles.length === 0) {
      console.warn('Please select images to analyze')
      return
    }

    try {
      const results = await visionAnalysis.mutateAsync({
        files: selectedFiles,
        profile: userProfile || undefined
      })
      
      setAnalysisResults(results)
      
      if (onAnalysisComplete) {
        onAnalysisComplete(results)
      }
    } catch (error) {
      console.error('Vision analysis failed:', error)
    }
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'keep':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'reject':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'review':
        return <Eye className="h-5 w-5 text-yellow-400" />
      default:
        return <Eye className="h-5 w-5 text-gray-400" />
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'keep':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'reject':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'review':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const toggleImageSelection = (imageId: string) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId)
    } else {
      newSelected.add(imageId)
    }
    setSelectedImages(newSelected)
  }

  const filteredImages = analysisResults?.images.filter(img => 
    filterDecision === 'all' || img.decision === filterDecision
  ) || []

  const getDecisionCounts = () => {
    if (!analysisResults) return { keep: 0, reject: 0, review: 0 }
    
    return analysisResults.images.reduce((acc, img) => {
      acc[img.decision]++
      return acc
    }, { keep: 0, reject: 0, review: 0 } as { keep: number; reject: number; review: number })
  }

  const counts = getDecisionCounts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">AI Culling</h1>
          <p className="text-gray-400">Upload images to automatically sort and cull using AI analysis</p>
        </div>
        {analysisResults && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-green-300">{counts.keep} Keep</span>
            </div>
            <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-lg">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-300">{counts.reject} Reject</span>
            </div>
            <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-lg">
              <Eye className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-300">{counts.review} Review</span>
            </div>
          </div>
        )}
      </div>

      {/* File Upload Area */}
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
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Upload Images for AI Analysis
          </h3>
          <p className="text-gray-400 mb-4">
            Drag and drop your images here, or click to select files
          </p>
          
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Select Images
          </button>
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="p-6 border-t border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium">Selected Images ({selectedFiles.length})</h4>
              <div className="flex gap-2">
                <button
                  onClick={runAnalysis}
                  disabled={visionAnalysis.isPending}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all"
                >
                  <Brain className="h-4 w-4" />
                  {visionAnalysis.isPending ? 'Analyzing...' : 'Analyze with AI'}
                </button>
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-gray-400 mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Progress */}
      {visionAnalysis.isPending && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin">
              <Brain className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <h3 className="text-white font-medium">AI Analysis in Progress</h3>
              <p className="text-gray-400 text-sm">Analyzing your images with advanced AI vision...</p>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Analysis Results</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filterDecision}
                    onChange={(e) => setFilterDecision(e.target.value as any)}
                    className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-1 text-sm"
                  >
                    <option value="all">All Images</option>
                    <option value="keep">Keep Only</option>
                    <option value="reject">Reject Only</option>
                    <option value="review">Review Only</option>
                  </select>
                </div>
                <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm">
                  <Download className="h-4 w-4" />
                  Export Results
                </button>
              </div>
            </div>

            {analysisResults.summary && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                <p className="text-gray-300 text-sm">{analysisResults.summary}</p>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="grid gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.filename}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleImageSelection(image.filename)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedImages.has(image.filename)
                            ? 'bg-primary-500 border-primary-500'
                            : 'border-gray-500 hover:border-gray-400'
                        }`}
                      >
                        {selectedImages.has(image.filename) && (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </button>
                      <h4 className="text-white font-medium">{image.filename}</h4>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs border ${getDecisionColor(image.decision)}`}>
                        {getDecisionIcon(image.decision)}
                        <span className="ml-1 capitalize">{image.decision}</span>
                      </span>
                      {image.artisticScore && (
                        <span className="flex items-center gap-1 text-yellow-400 text-sm">
                          <Star className="h-4 w-4" />
                          {image.artisticScore}/10
                        </span>
                      )}
                      <span className="text-gray-400 text-sm">{image.confidence}% confident</span>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-3">{image.rationale}</p>

                  {image.badges && image.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {image.badges.map((badge, index) => (
                        <span
                          key={index}
                          className="bg-primary-500/20 text-primary-300 px-2 py-1 rounded text-xs"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  {image.technicalIssues && image.technicalIssues.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {image.technicalIssues.map((issue, index) => (
                        <span
                          key={index}
                          className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs"
                        >
                          {issue}
                        </span>
                      ))}
                    </div>
                  )}

                  {image.commands && image.commands.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-accent-400" />
                        <span className="text-accent-300 text-sm font-medium">
                          Enhancement Available
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {image.commands.map((cmd, index) => (
                          <div key={index} className="bg-gray-800 rounded p-2">
                            <p className="text-white text-xs font-medium">{cmd.operation}</p>
                            {cmd.description && (
                              <p className="text-gray-400 text-xs">{cmd.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredImages.length === 0 && (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No images match the current filter</p>
              </div>
            )}
          </div>
        </div>
      )}

      {visionAnalysis.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300">
            Analysis failed: {visionAnalysis.error.message}
          </p>
        </div>
      )}
    </div>
  )
}
