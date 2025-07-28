import React, { useState } from 'react'
import { Plus, Camera, Calendar, Image } from 'lucide-react'
import type { Album } from '../../types'

interface DashboardProps {
  onAlbumSelect: (album: Album) => void
}

// Mock albums data - in real app this would come from a database/API
const mockAlbums: Album[] = [
  {
    id: '1',
    name: 'Wedding - Sarah & John',
    coverImage: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=300&fit=crop',
    imageCount: 2847,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T18:30:00Z',
    cullingStats: {
      totalImages: 2847,
      kept: 892,
      rejected: 1755,
      review: 200,
      duplicates: 45,
      blurred: 123,
      closedEyes: 67
    }
  },
  {
    id: '2',
    name: 'Portrait Session - Emma',
    coverImage: 'https://images.unsplash.com/photo-1494790108755-2616c31c0999?w=400&h=300&fit=crop',
    imageCount: 456,
    createdAt: '2024-01-12T14:00:00Z',
    updatedAt: '2024-01-12T16:45:00Z',
    cullingStats: {
      totalImages: 456,
      kept: 78,
      rejected: 298,
      review: 80,
      duplicates: 12,
      blurred: 23,
      closedEyes: 15
    }
  },
  {
    id: '3',
    name: 'Corporate Event - Tech Conference',
    coverImage: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&h=300&fit=crop',
    imageCount: 1234,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T17:00:00Z',
    cullingStats: {
      totalImages: 1234,
      kept: 345,
      rejected: 789,
      review: 100,
      duplicates: 23,
      blurred: 45,
      closedEyes: 12
    }
  }
]

const Dashboard: React.FC<DashboardProps> = ({ onAlbumSelect }) => {
  const [albums] = useState<Album[]>(mockAlbums)
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false)

  const handleCreateAlbum = () => {
    setIsCreatingAlbum(true)
    // In a real app, this would open a modal or navigate to album creation
    console.log('Create new album clicked')
    setTimeout(() => setIsCreatingAlbum(false), 1000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const calculateCullingProgress = (stats?: Album['cullingStats']) => {
    if (!stats) return 0
    const processed = stats.kept + stats.rejected
    return (processed / stats.totalImages) * 100
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Albums</h1>
        <p className="text-gray-400">
          Manage your photo collections and AI-powered culling workflows
        </p>
      </div>

      {/* Albums Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Album Card */}
        <div
          onClick={handleCreateAlbum}
          className="group relative bg-dark-800 border-2 border-dashed border-dark-600 rounded-lg p-8 hover:border-primary-500 hover:bg-dark-700 transition-all duration-200 cursor-pointer min-h-[280px] flex flex-col items-center justify-center"
        >
          <div className={`w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mb-4 transition-all duration-200 ${isCreatingAlbum ? 'animate-pulse' : 'group-hover:scale-110'}`}>
            <Plus className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Create New Album</h3>
          <p className="text-gray-400 text-center text-sm">
            Start a new photo culling and enhancement project
          </p>
        </div>

        {/* Album Cards */}
        {albums.map((album) => {
          const cullingProgress = calculateCullingProgress(album.cullingStats)
          
          return (
            <div
              key={album.id}
              onClick={() => onAlbumSelect(album)}
              className="group bg-dark-800 rounded-lg overflow-hidden hover:bg-dark-700 border border-dark-600 hover:border-primary-500 transition-all duration-200 cursor-pointer"
            >
              {/* Cover Image */}
              <div className="relative h-48 bg-dark-700 overflow-hidden">
                {album.coverImage ? (
                  <img
                    src={album.coverImage}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                
                {/* Image Count Badge */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                  <Image className="w-3 h-3 text-white" />
                  <span className="text-xs text-white font-medium">
                    {album.imageCount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Album Info */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2 truncate">
                  {album.name}
                </h3>
                
                <div className="flex items-center text-sm text-gray-400 mb-4">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(album.createdAt)}</span>
                </div>

                {/* Culling Progress */}
                {album.cullingStats && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Culling Progress</span>
                      <span className="text-primary-400 font-medium">
                        {Math.round(cullingProgress)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-300"
                        style={{ width: `${cullingProgress}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-green-400 font-medium">
                          {album.cullingStats.kept}
                        </div>
                        <div className="text-gray-500">Keep</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 font-medium">
                          {album.cullingStats.rejected}
                        </div>
                        <div className="text-gray-500">Reject</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-medium">
                          {album.cullingStats.review}
                        </div>
                        <div className="text-gray-500">Review</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Statistics Summary */}
      {albums.length > 0 && (
        <div className="mt-12 p-6 bg-dark-800 rounded-lg border border-dark-600">
          <h2 className="text-lg font-semibold text-white mb-4">Your Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-400">
                {albums.length}
              </div>
              <div className="text-sm text-gray-400">Total Albums</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {albums.reduce((sum, album) => sum + (album.cullingStats?.kept || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Images Kept</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {albums.reduce((sum, album) => sum + (album.cullingStats?.rejected || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Images Rejected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-400">
                {albums.reduce((sum, album) => sum + album.imageCount, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Images</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
