import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Filter, Star, Heart, X, Check, Zap, ChevronDown, Grid, List, Play, Pause } from 'lucide-react';
import type { ImageSession, ImageData } from '../types';
import type { UserStyleProfile } from '../services/styleProfileService';
import type { ImageAnalysisResult } from '../services/aiAnalysisService';

interface CullPageProps {
  session: ImageSession | null;
  userProfile?: UserStyleProfile | null;
  onCullComplete?: (culledSession: ImageSession) => void;
}

interface QuickFilter {
  id: string;
  label: string;
  active: boolean;
  count: number;
}

export default function CullPage({ session, userProfile, onCullComplete }: CullPageProps) {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([
    { id: 'all', label: 'All Images', active: true, count: 0 },
    { id: 'keep', label: 'AI Recommended', active: false, count: 0 },
    { id: 'duplicates', label: 'Duplicates', active: false, count: 0 },
    { id: 'blurry', label: 'Blurry', active: false, count: 0 },
    { id: 'faces', label: 'Best Faces', active: false, count: 0 }
  ]);
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'filename'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoSpeed, setAutoSpeed] = useState(2); // seconds per image
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Calculate filter counts based on AI analysis
  useEffect(() => {
    if (!session?.images) return;

    const images = session.images;
    const total = images.length;
    const recommended = images.filter(img => img.aiAnalysis?.recommendations.keep).length;
    const duplicates = images.filter(img => img.aiAnalysis?.scores.duplicates).length;
    const blurry = images.filter(img => img.aiAnalysis?.scores.blurriness).length;
    const faces = images.filter(img => img.aiAnalysis?.scores.face_match === 'primary').length;

    setQuickFilters(prev => prev.map(filter => ({
      ...filter,
      count: filter.id === 'all' ? total :
             filter.id === 'keep' ? recommended :
             filter.id === 'duplicates' ? duplicates :
             filter.id === 'blurry' ? blurry :
             filter.id === 'faces' ? faces : 0
    })));
  }, [session]);

  // Auto-cull mode timer
  useEffect(() => {
    if (!isAutoMode || !session?.images.length) return;

    const timer = setInterval(() => {
      setCurrentImageIndex(prev => {
        const next = prev + 1;
        if (next >= session.images.length) {
          setIsAutoMode(false);
          return prev;
        }
        
        // Auto-select based on AI recommendation
        const currentImage = session.images[next];
        if (currentImage.aiAnalysis?.recommendations.keep) {
          setSelectedImages(prev => new Set([...prev, currentImage.id]));
        }
        
        return next;
      });
    }, autoSpeed * 1000);

    return () => clearInterval(timer);
  }, [isAutoMode, autoSpeed, session]);

  // Filtered and sorted images
  const filteredImages = useMemo(() => {
    if (!session?.images) return [];

    const activeFilter = quickFilters.find(f => f.active);
    let filtered = session.images;

    if (activeFilter?.id !== 'all') {
      filtered = session.images.filter(img => {
        switch (activeFilter?.id) {
          case 'keep':
            return img.aiAnalysis?.recommendations.keep;
          case 'duplicates':
            return img.aiAnalysis?.scores.duplicates;
          case 'blurry':
            return img.aiAnalysis?.scores.blurriness;
          case 'faces':
            return img.aiAnalysis?.scores.face_match === 'primary';
          default:
            return true;
        }
      });
    }

    // Sort images
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.aiAnalysis?.scores.artistry || 0) - (a.aiAnalysis?.scores.artistry || 0);
        case 'date':
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case 'filename':
          return a.filename.localeCompare(b.filename);
        default:
          return 0;
      }
    });
  }, [session, quickFilters, sortBy]);

  const handleFilterClick = (filterId: string) => {
    setQuickFilters(prev => prev.map(filter => ({
      ...filter,
      active: filter.id === filterId
    })));
  };

  const handleImageSelect = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleBulkAction = (action: 'select-all' | 'select-none' | 'select-recommended') => {
    switch (action) {
      case 'select-all':
        setSelectedImages(new Set(filteredImages.map(img => img.id)));
        break;
      case 'select-none':
        setSelectedImages(new Set());
        break;
      case 'select-recommended':
        setSelectedImages(new Set(
          filteredImages
            .filter(img => img.aiAnalysis?.recommendations.keep)
            .map(img => img.id)
        ));
        break;
    }
  };

  const handleCompleteCull = () => {
    if (!session) return;

    console.log('🎯 SHOOTCLEANER WORKFLOW: Completing Cull Process');

    const culledSession: ImageSession = {
      ...session,
      images: session.images.map(img => ({
        ...img,
        selected: selectedImages.has(img.id),
        status: selectedImages.has(img.id) ? 'selected' : 'culled'
      })),
      status: 'culled',
      updatedAt: new Date()
    };

    console.log(`✅ Culled ${selectedImages.size} of ${session.images.length} images`);

    if (onCullComplete) {
      onCullComplete(culledSession);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    if (score >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No Session to Cull</h2>
          <p className="text-gray-400">Import images first to start culling</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-900">
      {/* Main Culling Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-white">{session.name}</h1>
              <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                {filteredImages.length} images
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto Mode Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsAutoMode(!isAutoMode)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    isAutoMode 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {isAutoMode ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isAutoMode ? 'Stop' : 'Auto'}</span>
                </button>
                {isAutoMode && (
                  <select
                    value={autoSpeed}
                    onChange={(e) => setAutoSpeed(Number(e.target.value))}
                    className="bg-gray-700 text-white text-sm px-2 py-1 rounded"
                  >
                    <option value={1}>1s</option>
                    <option value={2}>2s</option>
                    <option value={3}>3s</option>
                    <option value={5}>5s</option>
                  </select>
                )}
              </div>

              {/* View Mode */}
              <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-gray-600' : ''}`}
                >
                  <Grid className="w-4 h-4 text-gray-300" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-gray-600' : ''}`}
                >
                  <List className="w-4 h-4 text-gray-300" />
                </button>
              </div>

              {/* Selected Count */}
              <span className="text-sm text-gray-400">
                {selectedImages.size} selected
              </span>
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            {quickFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => handleFilterClick(filter.id)}
                className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter.active 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{filter.label}</span>
                <span className="px-2 py-0.5 bg-black/20 rounded text-xs">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="bg-gray-800 px-6 py-2 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('select-all')}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => handleBulkAction('select-none')}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                Select None
              </button>
              <button
                onClick={() => handleBulkAction('select-recommended')}
                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded transition-colors"
              >
                <Zap className="w-4 h-4 inline mr-1" />
                AI Recommended
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'rating' | 'filename')}
                className="bg-gray-700 text-white text-sm px-2 py-1 rounded"
              >
                <option value="rating">AI Rating</option>
                <option value="date">Date Added</option>
                <option value="filename">Filename</option>
              </select>
            </div>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-auto p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-4 gap-4">
              {filteredImages.map((image, index) => (
                <div
                  key={image.id}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImages.has(image.id)
                      ? 'border-blue-500 ring-2 ring-blue-500/50'
                      : 'border-gray-600 hover:border-gray-500'
                  } ${
                    isAutoMode && index === currentImageIndex
                      ? 'ring-2 ring-yellow-500/50'
                      : ''
                  }`}
                  onClick={() => handleImageSelect(image.id)}
                >
                  <div className="aspect-square bg-gray-700">
                    {image.thumbnail ? (
                      <img
                        src={image.thumbnail}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Eye className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* AI Analysis Overlay */}
                  {image.aiAnalysis && (
                    <div className="absolute top-2 left-2 space-y-1">
                      {/* AI Score */}
                      <div className={`px-2 py-1 bg-black/70 rounded text-xs font-medium ${
                        getScoreColor(image.aiAnalysis.scores.artistry)
                      }`}>
                        {Math.round(image.aiAnalysis.scores.artistry * 100)}%
                      </div>
                      
                      {/* Recommendations */}
                      {image.aiAnalysis.recommendations.keep && (
                        <div className="px-2 py-1 bg-green-600/80 rounded text-xs text-white">
                          <Check className="w-3 h-3 inline mr-1" />
                          Keep
                        </div>
                      )}
                      
                      {image.aiAnalysis?.scores.duplicates && 
                       typeof image.aiAnalysis.scores.duplicates === 'string' && 
                       parseFloat(image.aiAnalysis.scores.duplicates) > 0.5 && (
                        <div className="px-2 py-1 bg-orange-600/80 rounded text-xs text-white">
                          Duplicate
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selection Indicator */}
                  <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                    selectedImages.has(image.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-white/50 group-hover:border-white'
                  }`}>
                    {selectedImages.has(image.id) && (
                      <Check className="w-4 h-4 text-white absolute top-0.5 left-0.5" />
                    )}
                  </div>

                  {/* Filename */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs truncate">{image.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredImages.map((image, index) => (
                <div
                  key={image.id}
                  className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedImages.has(image.id)
                      ? 'bg-blue-600/20 border border-blue-600'
                      : 'bg-gray-800 hover:bg-gray-700'
                  } ${
                    isAutoMode && index === currentImageIndex
                      ? 'ring-2 ring-yellow-500/50'
                      : ''
                  }`}
                  onClick={() => handleImageSelect(image.id)}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                    {image.thumbnail ? (
                      <img
                        src={image.thumbnail}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{image.filename}</h4>
                    <p className="text-gray-400 text-sm">
                      {new Date(image.dateAdded).toLocaleDateString()}
                    </p>
                  </div>

                  {/* AI Analysis */}
                  {image.aiAnalysis && (
                    <div className="flex items-center space-x-4">
                      <div className={`text-sm font-medium ${
                        getScoreColor(image.aiAnalysis.scores.artistry)
                      }`}>
                        {Math.round(image.aiAnalysis.scores.artistry * 100)}%
                      </div>
                      
                      {image.aiAnalysis.recommendations.keep && (
                        <div className="px-2 py-1 bg-green-600 rounded text-xs text-white">
                          <Check className="w-3 h-3 inline mr-1" />
                          Recommended
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selection */}
                  <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                    selectedImages.has(image.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-400'
                  }`}>
                    {selectedImages.has(image.id) && (
                      <Check className="w-4 h-4 text-white absolute" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {selectedImages.size} of {filteredImages.length} images selected
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Back to Import
              </button>
              <button
                onClick={handleCompleteCull}
                disabled={selectedImages.size === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Continue to Edit ({selectedImages.size})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
