import { useState } from 'react'
import { supabase } from './supabaseClient'

export interface DashboardCategory {
  id: string
  title: string
  icon: string
  badge: string
  description: string
  items: string[]
}

export interface DashboardMenuProps {
  session?: any
  onBookService?: (serviceName: string) => void
  onSignOut?: () => void
  onBackToStore?: () => void
}

export default function DashboardMenu({
  session,
  onBookService,
  onSignOut,
  onBackToStore,
}: DashboardMenuProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories: DashboardCategory[] = [
    {
      id: 'electrical',
      title: 'Electrical Installations',
      icon: '⚡',
      badge: 'Core Service',
      description: 'Industrial, commercial, and residential electrical wiring, panel setups, and maintenance.',
      items: ['3-Phase Wiring', 'Distribution Boards', 'Load Balancing', 'Fault Diagnosis & Repair']
    },
    {
      id: 'cctv',
      title: 'CCTV & Surveillance',
      icon: '📹',
      badge: 'Popular',
      description: 'IP cameras, NVR configuration, remote mobile monitoring, and night-vision optical setups.',
      items: ['4K IP Camera Deployment', 'NVR/DVR Remote Sync', 'Motion Detection Alerts', 'Perimeter Thermal Scans']
    },
    {
      id: 'solar',
      title: 'Solar & Backup Energy',
      icon: '☀️',
      badge: 'Eco Friendly',
      description: 'Solar panel installations, hybrid inverters, and lithium battery storage systems.',
      items: ['Hybrid Inverter Setup', 'Lithium Battery Storage', 'Rooftop Solar Array Design', 'Off-Grid Power Sync']
    },
    {
      id: 'security',
      title: 'Security & Access Control',
      icon: '🛡️',
      badge: 'High Demand',
      description: 'Biometric doors, RFID turnstiles, electric fencing, and smart gate automation.',
      items: ['Biometric & Card Access', 'Electric Fence Setup', 'Automatic Gate Openers', 'Intercom & Video Door Phone']
    },
    {
      id: 'smarthome',
      title: 'Smart Home Automation',
      icon: '🏠',
      badge: 'Modern',
      description: 'Smart lighting, automated climate control, voice assistance, and central controller setup.',
      items: ['Automated Lighting Control', 'Smart Thermostat Integration', 'Motorized Blinds & Curtains', 'Central Hub Setup']
    },
    {
      id: 'networking',
      title: 'Networking & IT Infrastructure',
      icon: '🌐',
      badge: 'Enterprise',
      description: 'Structured LAN cabling, Wi-Fi mesh systems, server rack installations, and router config.',
      items: ['Cat6/Cat7 Structured Cabling', 'Enterprise Wi-Fi Mesh', 'Server Rack & Patch Panels', 'VPN & Network Firewall']
    }
  ]

  const filteredCategories = selectedCategory === 'all' 
    ? categories 
    : categories.filter(c => c.id === selectedCategory)

  const handleSignOut = async () => {
    try {
      await supabase?.auth?.signOut()
    } catch (e) {
      console.warn('Sign out completed', e)
    }
    if (onSignOut) {
      onSignOut()
    }
  }

  const handleBookOrInquire = (cat: DashboardCategory) => {
    if (onBookService) {
      onBookService(cat.title)
    } else {
      const text = encodeURIComponent(
        `Hello AjmanTech Services, I would like to book / inquire about ${cat.title} (${cat.items.join(', ')}).`
      )
      window.open(`https://wa.me/2348075329182?text=${text}`, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 bg-slate-800/90 backdrop-blur-md border-b border-slate-700/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Hamburger Icon Button */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSidebarOpen ? (
                // Close (X) Icon
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                // Hamburger Lines Icon
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AJMAN TECH
            </span>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
              Services Portal
            </span>
          </div>
        </div>

        {/* User Session Info & Navigation Controls */}
        <div className="flex items-center gap-3">
          {onBackToStore && (
            <button
              onClick={onBackToStore}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-600 hover:border-cyan-400 hover:text-cyan-300 text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>← Store</span>
            </button>
          )}

          <span className="hidden md:inline text-xs text-slate-400 font-mono">
            {session?.user?.email || 'Guest Client'}
          </span>
          <button 
            onClick={handleSignOut}
            className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-rose-600/80 text-white rounded-md transition-all font-medium cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER (Sidebar + Content) */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* SIDEBAR NAVIGATION (HAMBURGER SLIDE-OUT) */}
        <aside className={`
          fixed md:static top-[57px] bottom-0 left-0 z-20 w-64 bg-slate-800/95 border-r border-slate-700/60 p-4 transition-transform duration-300 ease-in-out flex flex-col justify-between
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-64'}
        `}>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
              Categories
            </p>
            <nav className="space-y-1">
              <button
                onClick={() => { setSelectedCategory('all'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${selectedCategory === 'all' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold' : 'text-slate-300 hover:bg-slate-700/50'}`}
              >
                <span>🗂️</span> All Services
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${selectedCategory === cat.id ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold' : 'text-slate-300 hover:bg-slate-700/50'}`}
                >
                  <span>{cat.icon}</span> {cat.title}
                </button>
              ))}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-700/50 text-xs text-slate-500 px-2 space-y-2">
            <p>&copy; 2026 Ajman Tech Services</p>
            <p className="text-[11px] text-slate-400">“Let There Be Light”</p>
          </div>
        </aside>

        {/* OVERLAY FOR MOBILE WHEN SIDEBAR IS OPEN */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-10 md:hidden"
          />
        )}

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Service Directory & Menu
            </h1>
            <p className="text-sm text-slate-400">
              Browse electrical engineering, security automation, and IT solutions offered by Ajman Tech.
            </p>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((cat) => (
              <div 
                key={cat.id} 
                className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 hover:border-cyan-500/50 hover:bg-slate-800/70 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-3xl p-2 bg-slate-900/60 rounded-xl border border-slate-700/50">{cat.icon}</span>
                    <span className="text-xs px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full font-medium">
                      {cat.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    {cat.description}
                  </p>

                  {/* Included Items Checklist */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-700/40">
                    {cat.items.map((item, idx) => (
                      <div key={idx} className="flex items-center text-xs text-slate-300 gap-2">
                        <span className="text-cyan-400">✓</span> {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Request Button */}
                <button 
                  onClick={() => handleBookOrInquire(cat)}
                  className="mt-6 w-full py-2.5 px-4 bg-slate-700 hover:bg-cyan-500 hover:text-slate-950 text-white font-medium text-xs rounded-lg transition-all cursor-pointer active:scale-[0.98]"
                >
                  Book or Inquire Service
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>

    </div>
  )
}
