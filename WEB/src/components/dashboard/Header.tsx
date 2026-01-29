import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { Menu, Settings, User, LogOut, Users } from 'lucide-react';

interface HeaderProps {
  onProfileClick: () => void;
  onSettingsClick?: () => void;
}

export default function Header({ onProfileClick, onSettingsClick }: HeaderProps) {
  const { setLeftSidebarOpen, setRightSidebarOpen, isEmergencyMode } = useApp();
  const { profile, logout } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className={`px-4 py-3 flex items-center justify-between border-b ${isEmergencyMode ? 'bg-destructive border-destructive' : 'bg-card border-border/50'} sticky top-0 z-40`}>
      {/* Left - Hamburger (Patient Only) */}
      {profile.role !== 'caretaker' && (
        <button
          onClick={() => setLeftSidebarOpen(true)}
          className={`p-2 rounded-xl transition-colors ${isEmergencyMode ? 'hover:bg-white/20 text-white' : 'hover:bg-accent text-foreground'}`}
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Center - Logo */}
      <h1 className={`text-2xl font-bold ${isEmergencyMode ? 'text-white' : 'text-primary'}`}>
        LUMI
      </h1>

      {/* Right - Settings & Avatar */}
      <div className="flex items-center gap-2">
        {/* Settings (Patient Only) */}
        {profile.role !== 'caretaker' && (
          <button
            onClick={() => onSettingsClick ? onSettingsClick() : setRightSidebarOpen(true)}
            className={`p-2 rounded-xl transition-colors ${isEmergencyMode ? 'hover:bg-white/20 text-white' : 'hover:bg-accent text-foreground'}`}
          >
            <Settings className="w-6 h-6" />
          </button>
        )}

        {/* Avatar with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${isEmergencyMode ? 'bg-white/20 text-white' : 'bg-primary text-primary-foreground'}`}
          >
            {profile.name ? profile.name[0].toUpperCase() : 'U'}
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-12 w-56 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden animate-scale-in">
                <div className="p-3 border-b border-border">
                  <p className="font-semibold text-foreground">{profile.name || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{profile.phone}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onProfileClick();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
                  >
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left text-destructive"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
