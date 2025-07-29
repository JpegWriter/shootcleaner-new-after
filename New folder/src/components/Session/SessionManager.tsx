import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Calendar,
  Camera,
  MapPin,
  User,
  Clock,
  Star,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  Grid,
  List,
  Download,
  Eye,
  Heart,
  Share2,
  FolderOpen,
  Tag,
  Settings
} from 'lucide-react'
import type { PhotoSession, SessionStatus, Album } from '../../types'

interface SessionManagerProps {
  className?: string
}

interface SessionStats {
  totalSessions: number
  activeSessions: number
  completedSessions: number
  totalImages: number
  averageRating: number
}

const SessionManager: React.FC<SessionManagerProps> = ({ className = '' }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterStatus, setFilterStatus] = useState<SessionStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'rating'>('date')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSession, setSelectedSession] = useState<PhotoSession | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const queryClient = useQueryClient()

  // Mock data - in real app, this would come from your database
  const mockSessions: PhotoSession[] = [
    {
      id: 'session-1',
      name: 'Sarah & John Wedding',
      date: new Date('2024-07-15'),
      location: 'Central Park, NYC',
      client: 'Sarah Johnson',
      status: 'completed',
      imageCount: 245,
      selectedCount: 89,
      rating: 4.8,
      tags: ['wedding', 'outdoor', 'couple'],
      albums: ['ceremony', 'reception', 'portraits'],
      createdAt: new Date('2024-07-10'),
      updatedAt: new Date('2024-07-20')
    },
    {
      id: 'session-2',
      name: 'Corporate Headshots - TechCorp',
      date: new Date('2024-07-22'),
      location: 'TechCorp Office, Manhattan',
      client: 'TechCorp Inc.',
      status: 'processing',
      imageCount: 156,
      selectedCount: 0,
      rating: 0,
      tags: ['corporate', 'headshots', 'business'],
      albums: ['executives', 'team'],
      createdAt: new Date('2024-07-20'),
      updatedAt: new Date('2024-07-22')
    },
    {
      id: 'session-3',
      name: 'Emma Fashion Portfolio',
      date: new Date('2024-07-28'),
      location: 'Studio Downtown',
      client: 'Emma Rodriguez',
      status: 'active',
      imageCount: 89,
      selectedCount: 23,
      rating: 5.0,
      tags: ['fashion', 'studio', 'portfolio'],
      albums: ['portraits', 'editorial'],
      createdAt: new Date('2024-07-25'),
      updatedAt: new Date('2024-07-28')
    }
  ]

  const mockStats: SessionStats = {
    totalSessions: 12,
    activeSessions: 2,
    completedSessions: 8,
    totalImages: 2456,
    averageRating: 4.6
  }

  const { data: sessions = mockSessions } = useQuery({
    queryKey: ['photo-sessions'],
    queryFn: async () => {
      // In real app, fetch from your API
      return mockSessions
    }
  })

  const { data: stats = mockStats } = useQuery({
    queryKey: ['session-stats'],
    queryFn: async () => {
      // In real app, calculate from your database
      return mockStats
    }
  })

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: Partial<PhotoSession>) => {
      // In real app, call your API
      return { ...sessionData, id: `session-${Date.now()}` } as PhotoSession
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-sessions'] })
      setShowCreateModal(false)
    }
  })

  const filteredSessions = sessions.filter(session => {
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus
    const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'rating':
        return b.rating - a.rating
      case 'date':
      default:
        return b.date.getTime() - a.date.getTime()
    }
  })

  const getStatusBadge = (status: SessionStatus) => {
    const styles = {
      active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      importing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      imported: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      culled: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
        }`}
      />
    ))
  }

  return (
    <div className={`p-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Session Manager</h1>
          <p className="text-gray-400">Organize and manage your photo sessions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-2 bg-[#2176FF] hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Sessions</p>
              <p className="text-xl font-bold text-white">{stats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Camera className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-xl font-bold text-white">{stats.activeSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Eye className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Completed</p>
              <p className="text-xl font-bold text-white">{stats.completedSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Camera className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Images</p>
              <p className="text-xl font-bold text-white">{stats.totalImages.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Star className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg Rating</p>
              <p className="text-xl font-bold text-white">{stats.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search sessions, clients, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#2176FF]"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as SessionStatus | 'all')}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#2176FF]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'rating')}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#2176FF]"
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="rating">Sort by Rating</option>
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-[#2176FF] text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-[#2176FF] text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sessions Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSessions.map((session) => (
            <div key={session.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{session.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{session.client}</p>
                </div>
                {getStatusBadge(session.status)}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {session.date.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="w-4 h-4" />
                  {session.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Camera className="w-4 h-4" />
                  {session.imageCount} images
                  {session.selectedCount > 0 && ` (${session.selectedCount} selected)`}
                </div>
              </div>

              {session.rating > 0 && (
                <div className="flex items-center gap-1 mb-4">
                  {renderStars(session.rating)}
                  <span className="text-sm text-gray-400 ml-2">{session.rating.toFixed(1)}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1 mb-4">
                {session.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button className="px-3 py-1 bg-[#2176FF] hover:bg-blue-600 text-white text-sm rounded-lg transition-colors">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedSessions.map((session) => (
            <div key={session.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">{session.name}</h3>
                      {getStatusBadge(session.status)}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {session.client}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {session.date.toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {session.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Camera className="w-4 h-4" />
                        {session.imageCount} images
                      </span>
                    </div>
                  </div>
                  
                  {session.rating > 0 && (
                    <div className="flex items-center gap-1">
                      {renderStars(session.rating)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button className="px-4 py-2 bg-[#2176FF] hover:bg-blue-600 text-white text-sm rounded-lg transition-colors">
                    Open
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sortedSessions.length === 0 && (
        <div className="text-center py-16">
          <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No sessions found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first photo session to get started'
            }
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-[#2176FF] hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Create Session
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default SessionManager
