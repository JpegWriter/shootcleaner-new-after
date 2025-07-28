function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-400 rounded-lg flex items-center justify-center">
                <span className="text-sm">📸</span>
              </div>
              <span className="text-sm bg-gray-700 px-2 py-1 rounded text-gray-300">PRO TRIAL</span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span className="bg-gray-700 px-2 py-1 rounded cursor-pointer">🏠 Home</span>
              <span className="cursor-pointer text-gray-400">AI Profiles</span>
              <span className="cursor-pointer text-gray-400">Marketplace</span>
              <span className="cursor-pointer text-gray-400">Performance</span>
              <span className="cursor-pointer text-gray-400">Support</span>
              <span className="bg-green-600 text-xs px-2 py-1 rounded">ONLINE ●</span>
              <span className="cursor-pointer text-gray-400">Settings</span>
              <span className="cursor-pointer text-gray-400">Tutorials</span>
              <span className="cursor-pointer text-gray-400">More ▼</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">💰 0 Credits</span>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm">SP</div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-gray-800 min-h-screen p-4">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">📁 favorites</h2>
              <button className="text-gray-400 hover:text-white">✏️</button>
            </div>
            <div className="text-xl font-bold mb-2">1092 Images</div>
            <button className="text-blue-400 text-sm hover:underline">Add More Images</button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Action Tabs */}
          <div className="flex space-x-1 mb-6">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <span>IMPORT</span>
              <span className="bg-white text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>
            </button>
            <button className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg">CULL</button>
            <button className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg">EDIT</button>
            <button className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg">RETOUCH</button>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Sample Images */}
            <div className="relative group">
              <img src="/api/placeholder/300/200" alt="Sample" className="w-full h-48 object-cover rounded-lg" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="bg-gray-800 p-2 rounded">🗑️</button>
              </div>
              <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                19_L0433 (2).jpg
              </div>
            </div>
            <div className="relative group">
              <img src="/api/placeholder/300/200" alt="Sample" className="w-full h-48 object-cover rounded-lg" />
              <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                19_L0456 (2).jpg
              </div>
            </div>
            <div className="relative group">
              <img src="/api/placeholder/300/200" alt="Sample" className="w-full h-48 object-cover rounded-lg" />
              <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                19_L4996.jpg
              </div>
            </div>
            <div className="relative group">
              <img src="/api/placeholder/300/200" alt="Sample" className="w-full h-48 object-cover rounded-lg" />
              <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                19_L5052.jpg
              </div>
            </div>
            <div className="relative group">
              <img src="/api/placeholder/300/200" alt="Sample" className="w-full h-48 object-cover rounded-lg" />
              <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                19_L6883.jpg
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <span>✓</span>
            <span>Successfully imported "favorites"</span>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-gray-800 min-h-screen p-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Get Started</h3>
            
            <div className="space-y-4">
              <div className="border border-gray-600 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span>⭐</span>
                  <span className="font-medium">Culling</span>
                </div>
                <p className="text-sm text-gray-400">The AI will analyze and select the best images while separating the rest for easier review.</p>
              </div>

              <div className="border border-gray-600 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span>✏️</span>
                  <span className="font-medium">Editing</span>
                </div>
                <p className="text-sm text-gray-400">Use a Personal AI Editing Profile or AI Style to take care of the bulk of your editing needs.</p>
              </div>

              <div className="border border-gray-600 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span>🔗</span>
                  <span className="font-medium">Retouching</span>
                  <span className="bg-blue-600 text-xs px-2 py-1 rounded">NEW</span>
                </div>
                <p className="text-sm text-gray-400">Add the finishing touches to your photos without leaving the app.</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="text-gray-400 mb-2">or</div>
              <div className="bg-blue-600 text-white px-4 py-3 rounded-lg">
                <div className="font-medium">One-Click Cull & Edit</div>
                <div className="text-sm opacity-90">Set your preferences, click Start, and let Aftershoot handle culling & editing.</div>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-gray-400 mb-2">Activate Windows</div>
              <div className="text-sm text-gray-500">Go to Settings to activate Windows.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
