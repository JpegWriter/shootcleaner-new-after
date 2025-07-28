import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  Home, 
  Camera, 
  Settings, 
  HelpCircle, 
  Zap,
  Sliders,
  Calendar
} from 'lucide-react'
import Sidebar from './components/Sidebar/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'
import AlbumView from './components/Album/AlbumView'
import SettingsView from './components/Settings/SettingsView'
import VisionAnalysis from './components/AI/VisionAnalysis'
import RAWImport from './components/Import/RAWImport'
import BatchEnhancement from './components/Enhancement/BatchEnhancement'
import SessionManager from './components/Session/SessionManager'
import type { Album } from './types'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

// Navigation items for the sidebar
const navigationItems = [
  { id: 'dashboard', label: 'Albums', icon: Home },
  { id: 'culling', label: 'AI Culling', icon: Camera },
  { id: 'batch', label: 'RAW Import', icon: Zap },
  { id: 'enhance', label: 'Enhancement', icon: Sliders },
  { id: 'sessions', label: 'Sessions', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
]

// User info for the sidebar
const userName = 'Professional User'
const userCredits = 1250

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if we're running in Electron
        if (typeof window !== 'undefined' && window.api) {
          const appName = await window.api.getName()
          const appVersion = await window.api.getVersion()
          console.log(`${appName} v${appVersion} initialized`)
          
          // Load user settings
          const settings = await window.api.getSettings()
          console.log('User settings loaded:', settings)
        } else {
          console.log('Running in browser mode')
        }
      } catch (error) {
        console.warn('Failed to initialize Electron APIs:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeApp()
  }, [])

  const handleViewChange = (viewId: string) => {
    setCurrentView(viewId)
    setSelectedAlbum(null) // Clear selected album when changing views
  }

  const handleAlbumSelect = (album: Album) => {
    setSelectedAlbum(album)
  }

  const handleBackToDashboard = () => {
    setSelectedAlbum(null)
    setCurrentView('dashboard')
  }

  const renderCurrentView = () => {
    // If we have a selected album, show the album view
    if (selectedAlbum) {
      return (
        <AlbumView 
          album={selectedAlbum}
          onBack={handleBackToDashboard}
        />
      )
    }

    // Otherwise show the current view based on navigation
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onAlbumSelect={handleAlbumSelect} />
      case 'culling':
        return <VisionAnalysis />
      case 'batch':
        return <RAWImport />
      case 'enhance':
        return <BatchEnhancement />
      case 'sessions':
        return <SessionManager />
      case 'settings':
        return <SettingsView />
      case 'help':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-6">Help & Support</h1>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300">Help documentation and support resources.</p>
              <p className="text-sm text-gray-500 mt-2">Get assistance with ShootCleaner Premium features.</p>
            </div>
          </div>
        )
      default:
        return <Dashboard onAlbumSelect={handleAlbumSelect} />
    }
  }

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#181A1B] flex items-center justify-center">
        <div className="text-white text-lg">Loading ShootCleaner Premium...</div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#181A1B] flex">
        <Sidebar 
          navigationItems={navigationItems}
          userName={userName}
          userCredits={userCredits}
          currentView={currentView}
          onViewChange={handleViewChange}
        />
        <main className="flex-1 flex flex-col ml-80">
          {renderCurrentView()}
        </main>
      </div>
    </QueryClientProvider>
  )
}

export default App
