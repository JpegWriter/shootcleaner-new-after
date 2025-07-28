import React, { useState } from 'react'
import { Key, Globe, Palette, Zap, Shield, HelpCircle } from 'lucide-react'

const SettingsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general')
  const [settings, setSettings] = useState({
    language: 'en',
    theme: 'dark',
    openaiApiKey: '',
    autoRejectBlurred: true,
    autoRejectClosedEyes: false,
    confidenceThreshold: 75,
    batchSize: 50
  })

  const sections = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'ai', label: 'AI Settings', icon: Zap },
    { id: 'license', label: 'License', icon: Key },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ]

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
  ]

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Language</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSettingChange('language', lang.code)}
                    className={`p-4 rounded-lg border transition-all ${
                      settings.language === lang.code
                        ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                        : 'border-dark-600 bg-dark-800 text-gray-400 hover:border-primary-500'
                    }`}
                  >
                    <div className="text-2xl mb-2">{lang.flag}</div>
                    <div className="font-medium">{lang.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Theme</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSettingChange('theme', 'dark')}
                  className={`p-4 rounded-lg border transition-all ${
                    settings.theme === 'dark'
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-dark-600 bg-dark-800 hover:border-primary-500'
                  }`}
                >
                  <div className="w-full h-16 bg-dark-900 rounded mb-3 border border-dark-700"></div>
                  <div className="text-white font-medium">Dark Theme</div>
                  <div className="text-gray-400 text-sm">Professional dark interface</div>
                </button>
                <button
                  onClick={() => handleSettingChange('theme', 'light')}
                  className={`p-4 rounded-lg border transition-all opacity-50 cursor-not-allowed ${
                    settings.theme === 'light'
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-dark-600 bg-dark-800'
                  }`}
                  disabled
                >
                  <div className="w-full h-16 bg-gray-200 rounded mb-3 border"></div>
                  <div className="text-white font-medium">Light Theme</div>
                  <div className="text-gray-400 text-sm">Coming soon</div>
                </button>
              </div>
            </div>
          </div>
        )

      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">OpenAI Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={settings.openaiApiKey}
                    onChange={(e) => handleSettingChange('openaiApiKey', e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full form-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your OpenAI API key for AI analysis. Keep this secure.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Culling Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Auto-reject blurred images</div>
                    <div className="text-gray-400 text-sm">Automatically reject images with blur</div>
                  </div>
                  <button
                    onClick={() => handleSettingChange('autoRejectBlurred', !settings.autoRejectBlurred)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.autoRejectBlurred ? 'bg-primary-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.autoRejectBlurred ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Auto-reject closed eyes</div>
                    <div className="text-gray-400 text-sm">Automatically reject images with closed eyes</div>
                  </div>
                  <button
                    onClick={() => handleSettingChange('autoRejectClosedEyes', !settings.autoRejectClosedEyes)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.autoRejectClosedEyes ? 'bg-primary-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.autoRejectClosedEyes ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confidence Threshold: {settings.confidenceThreshold}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={settings.confidenceThreshold}
                    onChange={(e) => handleSettingChange('confidenceThreshold', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum confidence level for AI decisions
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Batch Size: {settings.batchSize} images
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={settings.batchSize}
                    onChange={(e) => handleSettingChange('batchSize', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of images to process in each batch
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'license':
        return (
          <div className="space-y-6">
            <div className="bg-dark-800 border border-dark-600 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white">License Active</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan:</span>
                  <span className="text-white">ShootCleaner Premium</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">License Key:</span>
                  <span className="text-white font-mono">SC-PREMIUM-****-****</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expires:</span>
                  <span className="text-white">Never (Lifetime License)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Albums:</span>
                  <span className="text-white">Unlimited</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center text-gray-400 py-12">
            <div className="text-lg">Coming Soon</div>
            <div className="text-sm">This section is under development</div>
          </div>
        )
    }
  }

  return (
    <div className="h-full flex">
      {/* Settings Sidebar */}
      <div className="w-64 bg-dark-800 border-r border-dark-700 p-4">
        <h2 className="text-lg font-semibold text-white mb-6">Settings</h2>
        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  )
}

export default SettingsView
