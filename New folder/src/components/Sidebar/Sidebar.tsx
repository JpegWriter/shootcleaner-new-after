import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface NavigationItem {
  id: string
  label: string
  icon: LucideIcon
}

interface SidebarProps {
  navigationItems: NavigationItem[]
  currentView: string
  onViewChange: (viewId: string) => void
  userCredits: number
  userName: string
}

const Sidebar: React.FC<SidebarProps> = ({
  navigationItems,
  currentView,
  onViewChange,
  userCredits,
  userName,
}) => {
  return (
    <div className="fixed left-0 top-0 h-full w-80 bg-dark-950 border-r border-dark-700 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">SC</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">ShootCleaner</h1>
            <p className="text-xs text-gray-400">Premium</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {userName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-gray-400">{userCredits.toLocaleString()} credits</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                    ${isActive 
                      ? 'bg-primary-500/20 text-primary-400 border-l-3 border-primary-500' 
                      : 'text-gray-400 hover:text-white hover:bg-dark-800'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Quick Start Help */}
      <div className="p-4 border-t border-dark-700">
        <div className="bg-dark-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-2">Quick Start</h3>
          <p className="text-xs text-gray-400 mb-3">
            Create your first album to begin culling and enhancing your photos with AI.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary-400">Step 1 of 4</span>
            <div className="w-16 h-1 bg-dark-700 rounded-full overflow-hidden">
              <div className="w-1/4 h-full bg-primary-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
