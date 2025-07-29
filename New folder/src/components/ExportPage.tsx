import React, { useState, useEffect } from 'react';
import { Download, Share2, FileText, Camera, Settings, Globe, Instagram, Facebook, Twitter, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { ImageData, ImageSession } from '../types';
import type { UserStyleProfile } from '../services/styleProfileService';

interface ExportPageProps {
  session: ImageSession;
  userProfile?: UserStyleProfile | null;
  onExportComplete?: () => void;
}

interface ExportSettings {
  format: 'JPEG' | 'PNG' | 'TIFF';
  quality: number;
  resolution: string;
  colorSpace: 'sRGB' | 'AdobeRGB' | 'ProPhoto';
  embedIPTC: boolean;
  watermark: boolean;
  socialOptimized: boolean;
}

interface ExportProgress {
  current: number;
  total: number;
  currentFile: string;
  status: 'preparing' | 'processing' | 'embedding' | 'complete' | 'error';
}

export default function ExportPage({ 
  session, 
  userProfile, 
  onExportComplete 
}: ExportPageProps) {
  const [selectedImages, setSelectedImages] = useState<ImageData[]>([]);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'JPEG',
    quality: 95,
    resolution: userProfile?.preferences.outputResolution || '1920x1080',
    colorSpace: 'sRGB',
    embedIPTC: true,
    watermark: false,
    socialOptimized: false
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    blog?: string;
    social?: {
      instagram: string;
      facebook: string;
      twitter: string;
    };
  }>({});

  // Initialize with edited/selected images
  useEffect(() => {
    const editedImages = session.images.filter(img => 
      img.status === 'accepted' || img.selected
    );
    setSelectedImages(editedImages);
  }, [session]);

  const handleImageSelection = (image: ImageData) => {
    setSelectedImages(prev => {
      const isSelected = prev.some(img => img.id === image.id);
      if (isSelected) {
        return prev.filter(img => img.id !== image.id);
      } else {
        return [...prev, image];
      }
    });
  };

  const handleSelectAll = () => {
    const editedImages = session.images.filter(img => 
      img.status === 'accepted' || img.rating >= 3
    );
    setSelectedImages(editedImages);
  };

  const handleDeselectAll = () => {
    setSelectedImages([]);
  };

  const handleExport = async () => {
    if (selectedImages.length === 0) {
      alert('Please select images to export');
      return;
    }

    setIsExporting(true);
    setExportProgress({
      current: 0,
      total: selectedImages.length,
      currentFile: '',
      status: 'preparing'
    });

    try {
      console.log('🚀 SHOOTCLEANER EXPORT: Starting final export process');

      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        
        setExportProgress({
          current: i + 1,
          total: selectedImages.length,
          currentFile: image.filename,
          status: 'processing'
        });

        // Simulate export process with IPTC embedding
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate IPTC metadata
        const iptcData = {
          title: `${image.filename} - Edited by ShootCleaner`,
          keywords: image.tags.join(', ') || 'photography, portrait, shootcleaner',
          description: `Professional edit by ShootCleaner User. Enhanced with ShootCleaner Premium - Visit www.shootcleaner.com`,
          copyright: `© ${new Date().getFullYear()} Photographer - Edited with ShootCleaner | www.shootcleaner.com`,
          author: 'ShootCleaner User',
          location: 'Professional Studio',
          rating: image.rating.toString(),
          software: 'ShootCleaner Premium v1.0'
        };

        setExportProgress(prev => prev ? { ...prev, status: 'embedding' } : null);
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log(`✅ Exported ${image.filename} with IPTC metadata`);
      }

      setExportProgress(prev => prev ? { ...prev, status: 'complete' } : null);

      console.log('🎉 Export complete! All images ready for publishing');

      setTimeout(() => {
        setExportProgress(null);
        setIsExporting(false);
        if (onExportComplete) {
          onExportComplete();
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Export error:', error);
      setExportProgress(prev => prev ? { ...prev, status: 'error' } : null);
      setIsExporting(false);
    }
  };

  const handleGenerateContent = async () => {
    if (selectedImages.length === 0) {
      alert('Please select images to generate content for');
      return;
    }

    try {
      console.log('🤖 Generating social media and blog content...');
      
      // Simulate AI content generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const sampleImages = selectedImages.slice(0, 3);
      const sessionTheme = userProfile?.styleAnalysis?.editingStyle || 'Professional Portrait';

      const generatedBlog = `# Behind the Lens: ${session.name}

Just wrapped up an incredible ${sessionTheme.toLowerCase()} session! Here are some of my favorite shots from this collection.

${sampleImages.map((img, idx) => 
  `## Shot ${idx + 1}: ${img.filename}
  
This capture really showcases the essence of ${sessionTheme.toLowerCase()} photography. The lighting and composition came together perfectly to create something truly special.`
).join('\n\n')}

Each image was carefully edited using professional techniques to enhance the natural beauty while maintaining authenticity. The post-processing workflow focused on ${userProfile?.styleAnalysis?.editingStyle || 'clean, modern aesthetics'}.

*Edited with ShootCleaner Premium - Professional photography workflow made simple. Visit www.shootcleaner.com*

#Photography #${sessionTheme.replace(' ', '')} #ProfessionalPhotography #ShootCleaner`;

      const socialContent = {
        instagram: `✨ Fresh from the studio! ${sessionTheme} session highlights ✨

Swipe to see the magic we created together. Each shot tells a story, and I'm obsessed with how these turned out! 

What's your favorite? Drop a comment below! 👇

#photography #${sessionTheme.replace(' ', '').toLowerCase()} #photoshoot #behindthelens #shootcleaner

*Edited with @shootcleaner - the ultimate photography workflow*`,

        facebook: `🎉 Excited to share some highlights from my latest ${sessionTheme.toLowerCase()} session!

There's something magical about capturing authentic moments and transforming them through careful editing. These images represent hours of planning, shooting, and post-processing to create something truly special.

Each photo was enhanced using professional techniques while preserving the natural essence of the moment. The result? Timeless images that tell a beautiful story.

Thank you to everyone who makes this creative journey possible! ❤️

#ProfessionalPhotography #${sessionTheme.replace(' ', '')} #Photography #ShootCleanerEdited`,

        twitter: `🔥 Latest ${sessionTheme.toLowerCase()} session is LIVE! 

The editing workflow on these was incredible - each shot enhanced to perfection while keeping that authentic feel.

What do you think? 👀

#photography #${sessionTheme.replace(' ', '').toLowerCase()} #shootcleaner`
      };

      setGeneratedContent({
        blog: generatedBlog,
        social: socialContent
      });

      setShowSocialModal(true);

    } catch (error) {
      console.error('❌ Content generation error:', error);
      alert('Failed to generate content. Please try again.');
    }
  };

  const renderProgressModal = () => {
    if (!exportProgress || !isExporting) return null;

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-blue-500 rounded-full flex items-center justify-center">
              {exportProgress.status === 'complete' ? (
                <Check className="w-8 h-8 text-white" />
              ) : exportProgress.status === 'error' ? (
                <AlertCircle className="w-8 h-8 text-white" />
              ) : (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">
                {exportProgress.status === 'complete' && 'Export Complete!'}
                {exportProgress.status === 'error' && 'Export Failed'}
                {exportProgress.status === 'preparing' && 'Preparing Export...'}
                {exportProgress.status === 'processing' && 'Processing Images...'}
                {exportProgress.status === 'embedding' && 'Embedding Metadata...'}
              </h3>
              
              {exportProgress.status !== 'complete' && exportProgress.status !== 'error' && (
                <>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">
                    {exportProgress.current} of {exportProgress.total} images
                  </p>
                  {exportProgress.currentFile && (
                    <p className="text-xs text-gray-500">
                      Processing: {exportProgress.currentFile}
                    </p>
                  )}
                </>
              )}
              
              {exportProgress.status === 'complete' && (
                <p className="text-sm text-gray-400">
                  All images exported with IPTC metadata and ready for publishing!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSocialModal = () => {
    if (!showSocialModal || !generatedContent.social) return null;

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Generated Content</h3>
              <button
                onClick={() => setShowSocialModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Blog Content */}
            {generatedContent.blog && (
              <div>
                <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Blog Post Draft
                </h4>
                <div className="bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                    {generatedContent.blog}
                  </pre>
                </div>
              </div>
            )}

            {/* Social Media Posts */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                  <Instagram className="w-5 h-5 mr-2" />
                  Instagram
                </h4>
                <div className="bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {generatedContent.social?.instagram}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                  <Facebook className="w-5 h-5 mr-2" />
                  Facebook
                </h4>
                <div className="bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {generatedContent.social?.facebook}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                  <Twitter className="w-5 h-5 mr-2" />
                  Twitter
                </h4>
                <div className="bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {generatedContent.social?.twitter}
                  </p>
                </div>
              </div>
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-blue-400">Coming Soon</span>
              </div>
              <p className="text-sm text-gray-300 mt-2">
                Direct publishing to social media platforms and blog integration will be available in a future update.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">Export & Publish</h1>
              <p className="text-sm text-gray-400 mt-1">
                Final export with IPTC metadata and social content generation
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">
                {selectedImages.length} selected for export
              </span>
            </div>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              >
                Deselect All
              </button>
            </div>
            <p className="text-sm text-gray-400">
              {selectedImages.length} of {session.images.length} images selected
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {session.images.map((image) => {
              const isSelected = selectedImages.some(img => img.id === image.id);
              const isEdited = image.status === 'accepted';
              
              return (
                <div
                  key={image.id}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' 
                      : 'hover:ring-2 hover:ring-gray-500'
                  }`}
                  onClick={() => handleImageSelection(image)}
                >
                  <img
                    src={image.previewPath || image.thumbnail}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Selection Overlay */}
                  <div className={`absolute inset-0 transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-500/20' 
                      : 'bg-black/0 hover:bg-black/20'
                  }`} />
                  
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-black/50 border-white/50'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    {isEdited && (
                      <div className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                        Accepted
                      </div>
                    )}
                    {image.rating >= 4 && (
                      <div className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">
                        ★ {image.rating}
                      </div>
                    )}
                  </div>

                  {/* Filename */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                    <p className="text-xs text-white truncate">{image.filename}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-gray-800 border-t border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExport}
                disabled={isExporting || selectedImages.length === 0}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isExporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span>Export with IPTC</span>
              </button>

              <button
                onClick={handleGenerateContent}
                disabled={selectedImages.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>Generate Content</span>
              </button>
            </div>

            <div className="text-sm text-gray-400">
              Ready to export {selectedImages.length} images with professional metadata
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Export Settings */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        {/* Settings Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-400" />
            <h3 className="font-medium text-white">Export Settings</h3>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Output Format */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Output Format</h4>
            <div className="space-y-2">
              {(['JPEG', 'PNG', 'TIFF'] as const).map((format) => (
                <label key={format} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="format"
                    value={format}
                    checked={exportSettings.format === format}
                    onChange={(e) => setExportSettings(prev => ({ 
                      ...prev, 
                      format: e.target.value as 'JPEG' | 'PNG' | 'TIFF'
                    }))}
                    className="text-blue-500"
                  />
                  <span className="text-sm text-gray-300">{format}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quality */}
          {exportSettings.format === 'JPEG' && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Quality: {exportSettings.quality}%
              </h4>
              <input
                type="range"
                min="60"
                max="100"
                value={exportSettings.quality}
                onChange={(e) => setExportSettings(prev => ({ 
                  ...prev, 
                  quality: parseInt(e.target.value)
                }))}
                className="w-full"
              />
            </div>
          )}

          {/* Resolution */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Resolution</h4>
            <select
              value={exportSettings.resolution}
              onChange={(e) => setExportSettings(prev => ({ 
                ...prev, 
                resolution: e.target.value
              }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1920x1080">1920 × 1080 (Full HD)</option>
              <option value="2560x1440">2560 × 1440 (2K)</option>
              <option value="3840x2160">3840 × 2160 (4K)</option>
              <option value="4000x6000">4000 × 6000 (Print)</option>
              <option value="original">Original Size</option>
            </select>
          </div>

          {/* Color Space */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Color Space</h4>
            <select
              value={exportSettings.colorSpace}
              onChange={(e) => setExportSettings(prev => ({ 
                ...prev, 
                colorSpace: e.target.value as 'sRGB' | 'AdobeRGB' | 'ProPhoto'
              }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sRGB">sRGB (Web/Social)</option>
              <option value="AdobeRGB">Adobe RGB</option>
              <option value="ProPhoto">ProPhoto RGB</option>
            </select>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Export Options</h4>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={exportSettings.embedIPTC}
                onChange={(e) => setExportSettings(prev => ({ 
                  ...prev, 
                  embedIPTC: e.target.checked
                }))}
                className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Embed IPTC Metadata</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={exportSettings.watermark}
                onChange={(e) => setExportSettings(prev => ({ 
                  ...prev, 
                  watermark: e.target.checked
                }))}
                className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Add Watermark</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={exportSettings.socialOptimized}
                onChange={(e) => setExportSettings(prev => ({ 
                  ...prev, 
                  socialOptimized: e.target.checked
                }))}
                className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Social Media Optimized</span>
            </label>
          </div>

          {/* IPTC Preview */}
          {exportSettings.embedIPTC && userProfile && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">IPTC Metadata Preview</h4>
              <div className="space-y-1 text-xs text-gray-400">
                <p><span className="text-gray-300">Author:</span> ShootCleaner User</p>
                <p><span className="text-gray-300">Copyright:</span> © {new Date().getFullYear()} ShootCleaner User</p>
                <p><span className="text-gray-300">Software:</span> ShootCleaner Premium</p>
                <p><span className="text-gray-300">Website:</span> www.shootcleaner.com</p>
              </div>
            </div>
          )}
        </div>

        {/* Export Summary */}
        <div className="p-4 border-t border-gray-700">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Selected Images:</span>
              <span>{selectedImages.length}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Format:</span>
              <span>{exportSettings.format}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Resolution:</span>
              <span>{exportSettings.resolution}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>IPTC Metadata:</span>
              <span>{exportSettings.embedIPTC ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {renderProgressModal()}
      {renderSocialModal()}
    </div>
  );
};
