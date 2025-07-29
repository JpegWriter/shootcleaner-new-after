import React, { useState, useEffect, useMemo } from 'react';
import { 
  Image, 
  Settings, 
  Zap, 
  Download, 
  Eye, 
  RotateCcw, 
  Sun, 
  Contrast, 
  Palette,
  Crop,
  Filter,
  Sliders,
  Play,
  Pause,
  SkipForward,
  Check,
  X
} from 'lucide-react';
import type { ImageSession, ImageData } from '../types';
import type { UserStyleProfile } from '../services/styleProfileService';

interface EditPageProps {
  session: ImageSession | null;
  userProfile?: UserStyleProfile | null;
  onEditComplete?: (editedSession: ImageSession) => void;
}

interface EditPreset {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  settings: any;
}

export default function EditPage({ session, userProfile, onEditComplete }: EditPageProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [editingOptions, setEditingOptions] = useState<any>({
    outputResolution: '1920x1080',
    quality: 90,
    format: 'jpeg',
    outputDirectory: './edited-output',
    batchMode: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImages, setProcessedImages] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const selectedImages = useMemo(() => {
    if (!session) return [];
    return session.images.filter(img => img.isSelected);
  }, [session]);

  const selectedImage = useMemo(() => {
    if (!selectedImageId || !session) return null;
    return session.images.find(img => img.id === selectedImageId) || null;
  }, [selectedImageId, session]);

  useEffect(() => {
    if (selectedImages.length > 0 && !selectedImageId) {
      setSelectedImageId(selectedImages[0].id);
    }
  }, [selectedImages, selectedImageId]);

  const editPresets: EditPreset[] = [
    {
      id: 'portrait',
      name: 'Portrait Pro',
      icon: <Eye className="w-4 h-4" />,
      description: 'Professional portrait enhancement',
      settings: { brightness: 15, contrast: 10, saturation: 5, sharpness: 20 }
    },
    {
      id: 'landscape',
      name: 'Vivid Landscape',
      icon: <Sun className="w-4 h-4" />,
      description: 'Enhanced colors and contrast',
      settings: { brightness: 5, contrast: 20, saturation: 15, clarity: 10 }
    },
    {
      id: 'wedding',
      name: 'Wedding Classic',
      icon: <Palette className="w-4 h-4" />,
      description: 'Elegant and timeless',
      settings: { brightness: 10, contrast: 8, warmth: 5, highlights: -10 }
    },
    {
      id: 'street',
      name: 'Street Photography',
      icon: <Contrast className="w-4 h-4" />,
      description: 'Urban mood enhancement',
      settings: { contrast: 25, clarity: 15, shadows: 20, blacks: -15 }
    }
  ];

  const handlePresetSelect = (preset: EditPreset) => {
    setSelectedPreset(preset.id);
    // Mock implementation - would apply preset settings
    console.log('Applying preset:', preset.name, preset.settings);
  };

  const handleBatchProcess = async () => {
    if (selectedImages.length === 0) return;
    
    setIsProcessing(true);
    setBatchProgress(0);
    
    // Mock batch processing
    for (let i = 0; i < selectedImages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessedImages(prev => new Set([...prev, selectedImages[i].id]));
      setBatchProgress(((i + 1) / selectedImages.length) * 100);
    }
    
    setIsProcessing(false);
    
    if (onEditComplete && session) {
      const editedSession = {
        ...session,
        images: session.images.map(img => 
          selectedImages.find(selected => selected.id === img.id)
            ? { ...img, isEdited: true }
            : img
        )
      };
      onEditComplete(editedSession);
    }
  };

  if (!session || selectedImages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No Images Selected for Editing</p>
          <p className="text-sm">Go back to Cull page and select images to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-[#181a1b]">
      {/* Left Panel - Image Preview */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Controls */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-white">Edit Images</h2>
            <span className="px-2 py-1 bg-[#2176FF] text-white text-xs rounded">
              {selectedImages.length} selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBatchProcess}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-[#19C9C2] text-white rounded-lg hover:bg-[#17b3ad] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Batch Process</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="px-4 py-2 bg-gray-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-300">Processing Images</span>
              <span className="text-sm text-gray-300">{Math.round(batchProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-[#19C9C2] h-2 rounded-full transition-all duration-300"
                style={{ width: `${batchProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Preview Area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-900">
          {selectedImage ? (
            <div className="max-w-full max-h-full">
              <img
                src={selectedImage.thumbnailUrl || selectedImage.filePath}
                alt={selectedImage.fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
              <div className="text-center mt-4">
                <p className="text-white font-medium">{selectedImage.fileName}</p>
                <p className="text-gray-400 text-sm">
                  {selectedImage.metadata?.width}x{selectedImage.metadata?.height} • 
                  {selectedImage.metadata?.fileSize ? Math.round(selectedImage.metadata.fileSize / 1024 / 1024) : 0}MB
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No image selected</p>
            </div>
          )}
        </div>

        {/* Bottom Filmstrip */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex space-x-3 overflow-x-auto">
            {selectedImages.map((image) => (
              <div
                key={image.id}
                onClick={() => setSelectedImageId(image.id)}
                className={`relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden ${
                  selectedImageId === image.id 
                    ? 'ring-2 ring-[#2176FF]' 
                    : 'hover:ring-2 hover:ring-gray-500'
                }`}
              >
                <img
                  src={image.thumbnailUrl || image.filePath}
                  alt={image.fileName}
                  className="w-16 h-16 object-cover"
                />
                {processedImages.has(image.id) && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-75 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Editing Controls */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        {/* Style Presets */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-medium mb-3">Style Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {editPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedPreset === preset.id
                    ? 'border-[#2176FF] bg-[#2176FF] bg-opacity-10'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {preset.icon}
                  <span className="text-white text-sm font-medium">{preset.name}</span>
                </div>
                <p className="text-gray-400 text-xs">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Adjustments */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-medium mb-3">Manual Adjustments</h3>
          <div className="space-y-4">
            {['Exposure', 'Contrast', 'Highlights', 'Shadows', 'Whites', 'Blacks'].map((adjustment) => (
              <div key={adjustment}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{adjustment}</span>
                  <span>0</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  defaultValue={0}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Color Adjustments */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-medium mb-3">Color</h3>
          <div className="space-y-4">
            {['Temperature', 'Tint', 'Vibrance', 'Saturation'].map((adjustment) => (
              <div key={adjustment}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{adjustment}</span>
                  <span>0</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  defaultValue={0}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Export Settings */}
        <div className="p-4 flex-1">
          <h3 className="text-white font-medium mb-3">Export Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Format</label>
              <select
                value={editingOptions.format}
                onChange={(e) => setEditingOptions((prev: any) => ({ ...prev, format: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Quality</span>
                <span>{editingOptions.quality}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                step={5}
                value={editingOptions.quality}
                onChange={(e) => setEditingOptions((prev: any) => ({ ...prev, quality: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Resolution</label>
              <select
                value={editingOptions.outputResolution}
                onChange={(e) => setEditingOptions((prev: any) => ({ ...prev, outputResolution: e.target.value as '1920x1080' | '2560x1440' | '3840x2160' | 'original' }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              >
                <option value="1920x1080">1920x1080 (Full HD)</option>
                <option value="2560x1440">2560x1440 (QHD)</option>
                <option value="3840x2160">3840x2160 (4K)</option>
                <option value="original">Original Size</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
