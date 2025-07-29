import React, { useState, useEffect } from 'react';
import { Camera, Home, Settings, Download, Star, Image, Eye, Palette, Zap } from 'lucide-react';
import ImportPage from './components/ImportPage';
import CullPage from './components/CullPage';
import EditPage from './components/EditPage';
import ExportPage from './components/ExportPage';
import OnboardingPage from './components/OnboardingPage';
import { styleProfileService } from './services/styleProfileService';
import type { UserStyleProfile } from './services/styleProfileService';
import type { ImageSession } from './types';

type ActiveTab = 'dashboard' | 'import' | 'cull' | 'edit' | 'export';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('import');
  const [currentSession, setCurrentSession] = useState<ImageSession | null>(null);
  const [userProfile, setUserProfile] = useState<UserStyleProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing style profile on app start
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await styleProfileService.getStyleProfile();
        if (profile) {
          setUserProfile(profile);
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error loading style profile:', error);
        setShowOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleOnboardingComplete = (profile: UserStyleProfile) => {
    setUserProfile(profile);
    setShowOnboarding(false);
    setActiveTab('import');
  };

  const handleImportComplete = (session: ImageSession) => {
    setCurrentSession(session);
    setActiveTab('cull');
  };

  const handleCullComplete = (culledSession: ImageSession) => {
    setCurrentSession(culledSession);
    setActiveTab('edit');
  };

  const handleEditComplete = (editedSession: ImageSession) => {
    setCurrentSession(editedSession);
    setActiveTab('export');
  };

  const handleExportComplete = () => {
    setActiveTab('dashboard');
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-white">Loading ShootCleaner...</h2>
          <p className="text-gray-400">Initializing your AI photography assistant</p>
        </div>
      </div>
    );
  }

  // Show onboarding if no user profile exists
  if (showOnboarding) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  // Render active page content
  const renderActivePage = () => {
    switch (activeTab) {
      case 'import':
        return (
          <ImportPage 
            onImportComplete={handleImportComplete}
            userProfile={userProfile}
          />
        );
      case 'cull':
        return currentSession ? (
          <CullPage 
            session={currentSession}
            userProfile={userProfile}
            onCullComplete={handleCullComplete}
          />
        ) : (
          <ImportPage 
            onImportComplete={handleImportComplete}
            userProfile={userProfile}
          />
        );
      case 'edit':
        return currentSession ? (
          <EditPage 
            session={currentSession}
            userProfile={userProfile}
            onEditComplete={handleEditComplete}
          />
        ) : (
          <ImportPage 
            onImportComplete={handleImportComplete}
            userProfile={userProfile}
          />
        );
      case 'export':
        return currentSession ? (
          <ExportPage 
            session={currentSession}
            userProfile={userProfile}
            onExportComplete={handleExportComplete}
          />
        ) : (
          <ImportPage 
            onImportComplete={handleImportComplete}
            userProfile={userProfile}
          />
        );
      case 'dashboard':
        return renderDashboard();
      default:
        return (
          <ImportPage 
            onImportComplete={handleImportComplete}
            userProfile={userProfile}
          />
        );
    }
  };

  const renderDashboard = () => (
    <div className="flex h-screen bg-gray-900">
      {/* Left Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Star className="w-6 h-6 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Favorites</h2>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="text-gray-400 text-sm">No favorite albums yet</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">ShootCleaner Premium</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowOnboarding(true)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              >
                Settings
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-blue-600 rounded-full flex items-center justify-center">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Welcome to ShootCleaner</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Your AI-powered photography workflow assistant. Import your images to get started with intelligent culling and professional editing.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <div 
                onClick={() => setActiveTab('import')}
                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                    <Image className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white">Import</h3>
                    <p className="text-sm text-gray-400">Add RAW or JPEG images</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => currentSession && setActiveTab('cull')}
                className={`bg-gray-800 rounded-xl p-6 transition-colors ${
                  currentSession ? 'hover:bg-gray-700 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mx-auto">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white">Cull</h3>
                    <p className="text-sm text-gray-400">AI-powered selection</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => currentSession && setActiveTab('edit')}
                className={`bg-gray-800 rounded-xl p-6 transition-colors ${
                  currentSession ? 'hover:bg-gray-700 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white">Edit</h3>
                    <p className="text-sm text-gray-400">Professional enhancement</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => currentSession && setActiveTab('export')}
                className={`bg-gray-800 rounded-xl p-6 transition-colors ${
                  currentSession ? 'hover:bg-gray-700 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white">Export</h3>
                    <p className="text-sm text-gray-400">Final delivery</p>
                  </div>
                </div>
              </div>
            </div>

            {userProfile && (
              <div className="bg-gray-800 rounded-xl p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-white mb-4">Your AI Style Profile</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Editing Style:</span>
                    <span className="text-white ml-2">{userProfile.styleAnalysis.editingStyle}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Color Grading:</span>
                    <span className="text-white ml-2">{userProfile.preferences.colorGrading}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Intensity:</span>
                    <span className="text-white ml-2">{userProfile.preferences.editingIntensity}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Output:</span>
                    <span className="text-white ml-2">{userProfile.preferences.outputResolution}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold text-white mb-6">Quick Start</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="border border-gray-600 rounded-lg p-4 cursor-pointer hover:border-gray-500 transition-colors"
                     onClick={() => setActiveTab('import')}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span>📸</span>
                    <span className="font-medium">Import Photos</span>
                  </div>
                  <p className="text-sm text-gray-400">Drop your RAW or JPEG files to get started with AI analysis.</p>
                </div>

                <div className="border border-gray-600 rounded-lg p-4 cursor-pointer hover:border-gray-500 transition-colors"
                     onClick={() => currentSession && setActiveTab('cull')}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span>🤖</span>
                    <span className="font-medium">AI Culling</span>
                  </div>
                  <p className="text-sm text-gray-400">Let AI help you select the best shots from your collection.</p>
                </div>

                <div className="border border-gray-600 rounded-lg p-4 cursor-pointer hover:border-gray-500 transition-colors"
                     onClick={() => currentSession && setActiveTab('export')}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span>📤</span>
                    <span className="font-medium">Export & Publish</span>
                    <span className="bg-green-600 text-xs px-2 py-1 rounded">FINAL</span>
                  </div>
                  <p className="text-sm text-gray-400">Export with IPTC metadata and generate social media content.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-medium text-white">Recent Sessions</h3>
        </div>
        <div className="flex-1 p-4">
          {currentSession ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-white">{currentSession.name}</div>
              <div className="text-xs text-gray-400">
                {currentSession.images.length} images
              </div>
              <div className="text-xs text-gray-500">
                {currentSession.createdAt.toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No active sessions</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>🏠 Home</span>
            </button>
            <span className="cursor-pointer text-gray-400 hover:text-white">AI Profiles</span>
            <span className="cursor-pointer text-gray-400 hover:text-white">Marketplace</span>
            <span className="cursor-pointer text-gray-400 hover:text-white">Performance</span>
            <span className="cursor-pointer text-gray-400 hover:text-white">Support</span>
            <span className="bg-green-600 text-xs px-2 py-1 rounded">ONLINE ●</span>
            <span className="cursor-pointer text-gray-400 hover:text-white">Settings</span>
            <span className="cursor-pointer text-gray-400 hover:text-white">Tutorials</span>
            <span className="cursor-pointer text-gray-400 hover:text-white">More ▼</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">💰 0 Credits</span>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm">SC</div>
          </div>
        </div>
      </nav>

      {/* Render Active Page */}
      {renderActivePage()}
    </div>
  );
}

export default App;
