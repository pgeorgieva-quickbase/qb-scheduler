import React from 'react'
import { Bell, HelpCircle, Search, ChevronDown, User } from 'lucide-react'

export default function QuickbaseTopNav() {
  return (
    <header className="h-11 bg-[#1F1F1F] flex items-center justify-between px-4 flex-shrink-0">
      {/* Left: Logo + App name */}
      <div className="flex items-center gap-3">
        {/* Quickbase logo */}
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#1A73E8" />
            <path d="M8 8h6v6H8V8zm10 0h6v6h-6V8zM8 18h6v6H8v-6zm10 0h6v6h-6v-6z" fill="white" fillOpacity="0.9" />
          </svg>
          <span className="text-[14px] font-semibold text-white/95 tracking-[-0.01em]">quickbase</span>
        </div>

        <div className="w-px h-5 bg-white/15 mx-1" />

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium text-white/70 hover:text-white/90 cursor-pointer transition-colors">Field Service Pro</span>
          <ChevronDown size={12} className="text-white/40" />
        </div>
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-1.5">
        {/* Global search */}
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search everything..."
            className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 rounded-md pl-9 pr-4 py-[5px] text-[13px] text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 border border-white/15 rounded px-1 py-0.5 font-mono">⌘K</kbd>
        </div>

        <div className="w-px h-5 bg-white/15 mx-1" />

        <button className="p-1.5 rounded text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors">
          <HelpCircle size={16} />
        </button>
        <button className="relative p-1.5 rounded text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-status-critical rounded-full" />
        </button>
        <div className="w-px h-5 bg-white/15 mx-1" />
        <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 transition-colors">
          <div className="w-6 h-6 rounded-full bg-qb-blue flex items-center justify-center">
            <User size={13} className="text-white" />
          </div>
          <ChevronDown size={12} className="text-white/40" />
        </button>
      </div>
    </header>
  )
}
