import React, { useState } from 'react'
import { ArrowLeft, Upload, Filter, Grid, List } from 'lucide-react'
import type { Album } from '../../types'

interface AlbumViewProps {
  album: Album
  onBack: () => void
}

const AlbumView: React.FC<AlbumViewProps> = ({ album, onBack }) => {
  const [activeTab, setActiveTab] = useState<'import' | 'cull' | 'edit' | 'retouch'>('import')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const tabs = [
    { id: 'import' as const, label: 'Import', icon: Upload },
    { id: 'cull' as const, label: 'Cull', icon: Filter },
    { id: 'edit' as const, label: 'Edit', icon: Grid },
    { id: 'retouch' as const, label: 'Retouch', icon: List },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'import':
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-12 h-12 text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Import Your Photos</h3>
              <p className="text-gray-400 mb-6">
                Drag and drop your RAW and JPEG files here, or click to browse and select your photo session.
              </p>
              <div className="space-y-3">
                <button className="w-full btn btn-primary">
                  Browse Files
                </button>
                <button className="w-full btn btn-secondary">
                  Import from Lightroom Catalog
                </button>
              </div>
            </div>
          </div>
        )
      
      case 'cull':
        return (
          <div className="flex-1 p-6">
            <div className="text-center text-gray-400">
              <Filter className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">AI Culling</h3>
              <p>Import photos first to begin the culling process</p>
            </div>
          </div>
        )
      
      case 'edit':
        return (
          <div className="flex-1 p-6">
            <div className="text-center text-gray-400">
              <Grid className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Batch Edit</h3>
              <p>Cull your photos first to begin batch editing</p>
            </div>
          </div>
        )
      
      case 'retouch':
        return (
          <div className="flex-1 p-6">
            <div className="text-center text-gray-400">
              <List className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">AI Retouch</h3>
              <p>Edit your photos first to begin retouching</p>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Album Header */}
      <div className="bg-dark-800 border-b border-dark-700 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Albums</span>
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{album.name}</h1>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>{album.imageCount.toLocaleString()} images</span>
              {album.cullingStats && (
                <>
                  <span>{album.cullingStats.kept} kept</span>
                  <span>{album.cullingStats.rejected} rejected</span>
                  <span>{album.cullingStats.review} review</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Tabs */}
      <div className="bg-dark-800 border-b border-dark-700">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const isDisabled = tab.id !== 'import' // Only import is enabled for now
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`
                  flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors
                  ${isActive 
                    ? 'border-primary-500 text-primary-400 bg-primary-500/10' 
                    : isDisabled
                      ? 'border-transparent text-gray-600 cursor-not-allowed'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-dark-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-dark-900 overflow-auto">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default AlbumView
