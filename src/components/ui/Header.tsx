/**
 * Header-Komponente für die App
 * Spielerischer Stil: Gradient-Hintergrund, bunte Navigation-Buttons
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../../services/auth';
import type { User } from '../../types';
import { MathIcon, ProgressIcon, ProfileIcon, GameIcon } from '../icons';

interface HeaderProps {
  user?: User | null;
}

export function Header({ user }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    }
  };

  // Schließe Dropdown wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const handleLogoClick = () => {
    // Navigiere immer zur entsprechenden Startseite basierend auf Benutzer-Rolle
    if (user) {
      if (user.role === 'parent') {
        navigate('/parent-dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      // Wenn nicht eingeloggt, gehe zur Login-Seite (von dort kann man sich einloggen)
      // Aber wenn man bereits auf einer anderen Seite ist, versuche zur Dashboard zu gehen
      const currentPath = location.pathname;
      if (currentPath === '/login') {
        // Bleibe auf Login-Seite wenn bereits dort
        return;
      }
      // Sonst versuche zur Dashboard-Seite zu gehen (wird dann zu Login umgeleitet wenn nicht eingeloggt)
      navigate('/dashboard');
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Für Kinder: Hauptnavigation
  if (user && user.role !== 'parent') {
    return (
      <header className="bg-gradient-background border-b border-purple-200/50 shadow-medium">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 
                onClick={handleLogoClick}
                className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent cursor-pointer hover:from-purple-700 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                style={{ userSelect: 'none' }}
              >
                Lern-Abenteuer-Quiz
              </h1>
              
              <nav className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isActive('/dashboard') 
                      ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' 
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-sm'
                  }`}
                >
                  <ProgressIcon className="w-5 h-5" />
                  <span className="font-semibold">Dashboard</span>
                </button>
                
                <button
                  onClick={() => navigate('/learn')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isActive('/learn') 
                      ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-sm'
                  }`}
                >
                  <MathIcon className="w-5 h-5" />
                  <span className="font-semibold">Lernen</span>
                </button>
                
                <button
                  onClick={() => navigate('/play')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isActive('/play') 
                      ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700' 
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-sm'
                  }`}
                >
                  <GameIcon className="w-5 h-5" />
                  <span className="font-semibold">Spiele</span>
                </button>
              </nav>
            </div>
            
            {user && (
              <div className="relative" ref={dropdownRef}>
                {/* Profil-Button mit Avatar und Name */}
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white/60 px-3 py-1.5 rounded-xl shadow-soft hover:bg-white/80 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-lg shadow-sm">
                    {user.avatar || '👤'}
                  </div>
                  <span className="hidden md:inline">{user.name}</span>
                  <span className="hidden md:inline text-purple-500">•</span>
                  <span className="hidden md:inline text-lime-600 font-bold">{user.totalPoints} Punkte</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown-Menü */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-fade-in">
                    {/* Profil-Info oben im Dropdown */}
                    <div
                      onClick={() => {
                        navigate('/profile');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xl shadow-sm">
                          {user.avatar || '👤'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.totalPoints} Punkte</div>
                        </div>
                      </div>
                    </div>

                    {/* Menü-Optionen */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <ProfileIcon className="w-4 h-4" />
                        <span>Mein Profil</span>
                      </button>
                      <button
                        onClick={() => {
                          if (user && user.role === 'parent') {
                            navigate('/settings');
                          } else {
                            navigate('/profile');
                          }
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Einstellungen</span>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Abmelden</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  // Für Eltern: Vereinfachte Navigation
  if (user && user.role === 'parent') {
    return (
      <header className="bg-gradient-background border-b border-purple-200/50 shadow-medium">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 
              onClick={handleLogoClick}
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent cursor-pointer hover:from-purple-700 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
              style={{ userSelect: 'none' }}
            >
              Lern-Abenteuer-Quiz
            </h1>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/admin')}
                className={`px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 font-semibold ${
                  isActive('/admin') 
                    ? 'bg-green-600 text-white shadow-md hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-sm'
                }`}
              >
                Verwaltung
              </button>
              <button
                onClick={() => navigate('/parent-dashboard')}
                className={`px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 font-semibold ${
                  isActive('/parent-dashboard') 
                    ? 'bg-green-600 text-white shadow-md hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-sm'
                }`}
              >
                Dashboard
              </button>
              
              {/* Profil-Dropdown für Eltern */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white/60 px-3 py-1.5 rounded-xl shadow-soft hover:bg-white/80 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-lg shadow-sm">
                    {user.avatar || '👤'}
                  </div>
                  <span className="hidden md:inline">{user.name}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown-Menü */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-fade-in">
                    {/* Profil-Info oben im Dropdown */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xl shadow-sm">
                          {user.avatar || '👤'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{user.name}</div>
                          <div className="text-xs text-gray-500">Eltern-Konto</div>
                        </div>
                      </div>
                    </div>

                    {/* Menü-Optionen */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Einstellungen</span>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Abmelden</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Für nicht eingeloggte Benutzer
  return (
    <header className="bg-gradient-background border-b border-purple-200/50 shadow-medium">
      <div className="container mx-auto px-4 py-4">
        <h1 
          onClick={handleLogoClick}
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent cursor-pointer hover:from-purple-700 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
          style={{ userSelect: 'none' }}
        >
          Lern-Abenteuer-Quiz
        </h1>
      </div>
    </header>
  );
}

