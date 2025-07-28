import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation } from '@tanstack/react-query'
import { 
  Upload, 
  Image as ImageIcon, 
  Settings,
  Play,
  Pause,
  Square,
  Download,
  Sliders,
  Sun,
  Contrast,
  Palette,
  Filter,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { imageProcessor } from '../../services/imageProcessor'
import type { EnhancementSettings, ProcessingResult } from '../../types'

interface BatchEnhancementProps {
  className?: string
}

interface EnhancementJob {
  id: string
  file: File
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  result?: ProcessingResult
  error?: string
}

const BatchEnhancement: React.FC<BatchEnhancementProps> = ({ className = '' }) => {
  const [jobs, setJobs] = useState<EnhancementJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<EnhancementSettings>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    temperature: 0,
    tint: 0,
    sharpening: 50,
    noiseReduction: 0,
    format: 'jpeg',
    quality: 90,
    resize: false,
    width: 1920,
    height: 1080,
    maintainAspectRatio: true
  })
  const [showSettings, setShowSettings] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newJobs: EnhancementJob[] = acceptedFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'pending',
      progress: 0
    }))
    setJobs(prev => [...prev, ...newJobs])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp']
    },
    multiple: true
  })

  const enhancementMutation = useMutation({
    mutationFn: async (jobIds: string[]) => {
      const jobsToProcess = jobs.filter(job => jobIds.includes(job.id))
      const results = []
      
      for (const job of jobsToProcess) {
        try {
          // Update job status
          setJobs(prev => prev.map(j => 
            j.id === job.id ? { ...j, status: 'processing' as const } : j
          ))

          // Process image with settings
          const result = await imageProcessor.enhanceImageBatch(job.file, settings)
          
          // Update progress
          for (let i = 0; i <= 100; i += 10) {
            setJobs(prev => prev.map(j => 
              j.id === job.id ? { ...j, progress: i } : j
            ))
            await new Promise(resolve => setTimeout(resolve, 50))
          }

          // Update with result
          setJobs(prev => prev.map(j => 
            j.id === job.id ? { 
              ...j, 
              status: 'completed' as const, 
              progress: 100,
              result 
            } : j
          ))

          results.push(result)
        } catch (error) {
          setJobs(prev => prev.map(j => 
            j.id === job.id ? { 
              ...j, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : 'Processing failed'
            } : j
          ))
        }
      }
      
      return results
    }
  })

  const handleStartProcessing = () => {
    const pendingJobs = jobs.filter(job => job.status === 'pending')
    if (pendingJobs.length === 0) return

    setIsProcessing(true)
    enhancementMutation.mutate(pendingJobs.map(job => job.id), {
      onSettled: () => setIsProcessing(false)
    })
  }

  const handleRemoveJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId))
  }

  const handleClearCompleted = () => {
    setJobs(prev => prev.filter(job => job.status !== 'completed'))
  }

  const handleDownloadAll = () => {
    const completedJobs = jobs.filter(job => job.status === 'completed' && job.result)
    completedJobs.forEach(job => {
      if (job.result?.outputPath) {
        // Trigger download via Electron API
        window.api?.downloadFile?.(job.result.outputPath, `enhanced_${job.file.name}`)
      }
    })
  }

  const getStatusColor = (status: EnhancementJob['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-400'
      case 'processing': return 'text-blue-400'
      case 'completed': return 'text-green-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: EnhancementJob['status']) => {
    switch (status) {
      case 'pending': return <ImageIcon className="w-4 h-4" />
      case 'processing': return <Play className="w-4 h-4" />
      case 'completed': return <Check className="w-4 h-4" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      default: return <ImageIcon className="w-4 h-4" />
    }
  }

  const completedCount = jobs.filter(job => job.status === 'completed').length
  const totalCount = jobs.length

  return (
    <div className={`p-8 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Batch Enhancement</h1>
          <p className="text-gray-400">Apply professional enhancements to multiple images</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          {jobs.length > 0 && (
            <button
              onClick={handleStartProcessing}
              disabled={isProcessing || jobs.filter(j => j.status === 'pending').length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-[#2176FF] hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {isProcessing ? 'Processing...' : 'Start Enhancement'}
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Enhancement Settings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Basic Adjustments */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Basic
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Brightness</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={settings.brightness}
                    onChange={(e) => setSettings(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{settings.brightness}</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Contrast</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={settings.contrast}
                    onChange={(e) => setSettings(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{settings.contrast}</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Saturation</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={settings.saturation}
                    onChange={(e) => setSettings(prev => ({ ...prev, saturation: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{settings.saturation}</span>
                </div>
              </div>
            </div>

            {/* Advanced Adjustments */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Advanced
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Exposure</label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={settings.exposure}
                    onChange={(e) => setSettings(prev => ({ ...prev, exposure: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{settings.exposure.toFixed(1)}</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Highlights</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={settings.highlights}
                    onChange={(e) => setSettings(prev => ({ ...prev, highlights: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{settings.highlights}</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Shadows</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={settings.shadows}
                    onChange={(e) => setSettings(prev => ({ ...prev, shadows: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{settings.shadows}</span>
                </div>
              </div>
            </div>

            {/* Color Adjustments */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Temperature</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={settings.temperature}
                    onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{settings.temperature}</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tint</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={settings.tint}
                    onChange={(e) => setSettings(prev => ({ ...prev, tint: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{settings.tint}</span>
                </div>
              </div>
            </div>

            {/* Details & Output */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Details
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sharpening</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.sharpening}
                    onChange={(e) => setSettings(prev => ({ ...prev, sharpening: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{settings.sharpening}</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Noise Reduction</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.noiseReduction}
                    onChange={(e) => setSettings(prev => ({ ...prev, noiseReduction: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{settings.noiseReduction}</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Quality</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={settings.quality}
                    onChange={(e) => setSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{settings.quality}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {jobs.length === 0 ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-16 text-center transition-colors ${
            isDragActive 
              ? 'border-[#2176FF] bg-blue-950/20' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {isDragActive ? 'Drop images here' : 'Upload images for enhancement'}
          </h3>
          <p className="text-gray-400 mb-4">
            Drop your images here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports JPEG, PNG, TIFF, BMP, WebP formats
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress Summary */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {completedCount} of {totalCount} images processed
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearCompleted}
                disabled={completedCount === 0}
                className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Clear completed
              </button>
              <button
                onClick={handleDownloadAll}
                disabled={completedCount === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Download All ({completedCount})
              </button>
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={getStatusColor(job.status)}>
                      {getStatusIcon(job.status)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{job.file.name}</p>
                      <p className="text-sm text-gray-400">
                        {(job.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {job.status === 'processing' && (
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-[#2176FF] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">{job.progress}%</span>
                      </div>
                    )}
                    
                    {job.status === 'error' && job.error && (
                      <p className="text-sm text-red-400">{job.error}</p>
                    )}
                    
                    {job.status === 'completed' && job.result && (
                      <button
                        onClick={() => window.api?.downloadFile?.(job.result!.outputPath, `enhanced_${job.file.name}`)}
                        className="text-sm text-green-400 hover:text-green-300 transition-colors"
                      >
                        Download
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRemoveJob(job.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg p-8 text-center transition-colors cursor-pointer"
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400">Add more images</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchEnhancement
