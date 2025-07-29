import React, { useState, useCallback } from 'react';
import { Upload, Folder, Settings, Camera } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { rawConversionService } from '../services/rawConversionService';
import { aiAnalysisService } from '../services/aiAnalysisService';
import type { ImageSession, ImageData } from '../types';
import type { UserStyleProfile } from '../services/styleProfileService';

interface ImportPageProps {
  onImportComplete?: (session: ImageSession) => void;
  userProfile?: UserStyleProfile | null;
}

export default function ImportPage({ onImportComplete, userProfile }: ImportPageProps) {
  const [importSettings, setImportSettings] = useState({
    fileTypes: 'RAW' as 'RAW' | 'JPEG',
    catalogType: 'LrCatalogs' as 'LrCatalogs' | 'C1Catalogs',
    includeSubfolders: true,
    ingestAndBackup: true
  });

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      console.log('🔥 SHOOTCLEANER WORKFLOW: Starting Import Process');
      
      // Create new session
      const sessionId = crypto.randomUUID();
      const sessionName = `Import Session ${new Date().toLocaleDateString()}`;
      
      const session: ImageSession = {
        id: sessionId,
        name: sessionName,
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'importing'
      };

      const totalFiles = acceptedFiles.length;
      let processed = 0;

      console.log(`📸 Converting ${totalFiles} images to dual formats...`);

      // STEP 2: Convert each file to dual outputs (low-res + HD)
      for (const file of acceptedFiles) {
        try {
          const imageId = crypto.randomUUID();
          
          // Convert RAW/JPEG to dual outputs using Sharp.js
          const conversionResult = await rawConversionService.convertImage(
            file,
            imageId,
            {
              lowResWidth: 800,
              lowResHeight: 600,
              hdWidth: parseInt(userProfile?.preferences.outputResolution.split('x')[0] || '1920'),
              hdHeight: parseInt(userProfile?.preferences.outputResolution.split('x')[1] || '1080'),
              quality: 85,
              preserveExif: true
            }
          );

          // STEP 4: Analyze image with AI Assistant using style profile
          let analysis = null;
          if (userProfile) {
            console.log(`🤖 Analyzing image ${imageId} with AI...`);
            analysis = await aiAnalysisService.analyzeImage(
              conversionResult.lowResPath,
              imageId,
              userProfile,
              'full' // Full analysis including culling and editing recommendations
            );
          }

          // Add to session with all metadata
          const imageData: ImageData = {
            id: imageId,
            filename: file.name,
            path: file.name, // File interface doesn't have path property
            size: file.size,
            type: file.type,
            dateAdded: new Date(),
            exifData: conversionResult.metadata.exifData,
            thumbnail: conversionResult.lowResPath, // Use low-res for thumbnails
            hdPath: conversionResult.hdPath, // Store HD path for editing
            previewPath: conversionResult.lowResPath,
            status: 'imported' as const,
            rating: analysis?.scores.artistry || 0,
            tags: [],
            selected: false,
            aiAnalysis: analysis || undefined // Store full AI analysis
          };

          session.images.push(imageData);
          processed++;
          setImportProgress((processed / totalFiles) * 100);

          console.log(`✅ Processed ${file.name}: Preview + HD + AI Analysis complete`);

        } catch (error) {
          console.error(`❌ Error processing ${file.name}:`, error);
          processed++;
          setImportProgress((processed / totalFiles) * 100);
        }
      }

      // Update session status
      session.status = 'imported';
      session.updatedAt = new Date();

      console.log(`🎉 Import complete! ${session.images.length} images ready for culling`);

      if (onImportComplete) {
        onImportComplete(session);
      }

    } catch (error) {
      console.error('❌ Import error:', error);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  }, [onImportComplete, userProfile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.tiff', '.raw', '.cr2', '.nef', '.orf', '.dng']
    },
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    disabled: isImporting
  });

  const handleBrowseFiles = () => {
    // Trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,.raw,.cr2,.nef,.orf,.dng';
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      onDrop(files);
    };
    input.click();
  };

  return (
    <div className="flex h-full bg-gray-900">
      {/* Main Import Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">Untitled Album</h1>
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">Ready to import</span>
            </div>
          </div>
        </div>

        {/* Drop Zone */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div
            {...getRootProps()}
            className={`w-full max-w-2xl mx-auto border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
              isDragActive || dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            } ${isImporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input {...getInputProps()} />
            
            {isImporting ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-blue-500 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-white">Importing Images...</p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">{Math.round(importProgress)}% complete</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto bg-gray-700 rounded-full flex items-center justify-center">
                  <Upload className="w-10 h-10 text-gray-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    Click to import folder(s)
                  </h3>
                  <p className="text-lg text-white">or Drag and Drop them here</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 inline-block">
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <span className="font-medium">RAW / JPEG</span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                      CULL, EDIT & RETOUCH
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Recommended for better experience</p>
                </div>

                {/* Catalog Options */}
                <div className="flex items-center justify-center space-x-4 mt-8">
                  <div className="flex flex-col items-center space-y-2 p-4 bg-gray-800 rounded-lg">
                    <Folder className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-300">Lr / C1 Catalog</span>
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-700 rounded">
                      EDITS ONLY
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Browse Button */}
        {!isImporting && (
          <div className="p-6 bg-gray-800 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <button
                onClick={handleBrowseFiles}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Choose from recent
              </button>
              <button
                onClick={handleBrowseFiles}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                Browse
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Import Settings */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        {/* Import Settings Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-400" />
            <h3 className="font-medium text-white">Import Settings</h3>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-4 space-y-6">
          {/* Type of photos to import */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Type of photos to import</h4>
            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-2">CULL OR EDIT</div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setImportSettings(prev => ({ ...prev, fileTypes: 'RAW' }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    importSettings.fileTypes === 'RAW'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  RAW
                </button>
                <button
                  onClick={() => setImportSettings(prev => ({ ...prev, fileTypes: 'JPEG' }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    importSettings.fileTypes === 'JPEG'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  JPEG
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-gray-500 mb-2">EDITS ONLY</div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setImportSettings(prev => ({ ...prev, catalogType: 'LrCatalogs' }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    importSettings.catalogType === 'LrCatalogs'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  LrCatalogs
                </button>
                <button
                  onClick={() => setImportSettings(prev => ({ ...prev, catalogType: 'C1Catalogs' }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    importSettings.catalogType === 'C1Catalogs'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  C1Catalogs
                </button>
              </div>
            </div>
          </div>

          {/* Include sub-folders */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Include sub-folders</h4>
            <select
              value={importSettings.includeSubfolders ? 'Yes' : 'No'}
              onChange={(e) => setImportSettings(prev => ({ 
                ...prev, 
                includeSubfolders: e.target.value === 'Yes' 
              }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Ingest Settings */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Ingest Settings</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={importSettings.ingestAndBackup}
                  onChange={(e) => setImportSettings(prev => ({ 
                    ...prev, 
                    ingestAndBackup: e.target.checked 
                  }))}
                  className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Ingest and backup photos</span>
              </label>
              <p className="text-xs text-gray-500 ml-7">
                Click here to Ingest and Backup photos from your memory card(s) before culling them
              </p>
            </div>
          </div>
        </div>

        {/* Activate Windows Section */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-500 mb-2">Activate Windows</div>
          <button className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors">
            Go to Settings to activate Windows
          </button>
        </div>
      </div>
    </div>
  );
};
