/**
 * Header-Komponente für die App
 * Spielerischer Stil: Gradient-Hintergrund, bunte Navigation-Buttons
 */

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

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    }
  };

  const handleLogoClick = () => {
    if (location.pathname === '/login') {
      return;
    }
    
    if (user) {
      if (user.role === 'parent') {
        navigate('/parent-dashboard');
      } else {
        navigate('/home');
      }
    } else {
      const currentPath = location.pathname;
      if (currentPath.startsWith('/parent-dashboard') || currentPath.startsWith('/admin')) {
        navigate('/parent-dashboard');
      } else {
        navigate('/home');
      }
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
                  onClick={() => navigate('/home')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isActive('/home') 
                      ? 'bg-gradient-primary text-white shadow-colored-lime' 
                      : 'text-gray-700 hover:bg-white/50 hover:shadow-soft'
                  }`}
                >
                  <MathIcon className="w-5 h-5" />
                  <span className="font-semibold">Fächer</span>
                </button>
                
                <button
                  onClick={() => navigate('/progress')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isActive('/progress') 
                      ? 'bg-gradient-primary text-white shadow-colored-lime' 
                      : 'text-gray-700 hover:bg-white/50 hover:shadow-soft'
                  }`}
                >
                  <ProgressIcon className="w-5 h-5" />
                  <span className="font-semibold">Fortschritt</span>
                </button>
                
                <button
                  onClick={() => navigate('/profile')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isActive('/profile') 
                      ? 'bg-gradient-primary text-white shadow-colored-lime' 
                      : 'text-gray-700 hover:bg-white/50 hover:shadow-soft'
                  }`}
                >
                  <ProfileIcon className="w-5 h-5" />
                  <span className="font-semibold">Profil</span>
                </button>
                
                <button
                  onClick={() => navigate('/practice')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isActive('/practice') 
                      ? 'bg-gradient-primary text-white shadow-colored-lime' 
                      : 'text-gray-700 hover:bg-white/50 hover:shadow-soft'
                  }`}
                >
                  <span className="font-semibold">Üben</span>
                </button>
                
                <button
                  onClick={() => navigate('/games')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isActive('/games') 
                      ? 'bg-gradient-primary text-white shadow-colored-lime' 
                      : 'text-gray-700 hover:bg-white/50 hover:shadow-soft'
                  }`}
                >
                  <GameIcon className="w-5 h-5" />
                  <span className="font-semibold">Spiele</span>
                </button>
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white/60 px-3 py-1.5 rounded-xl shadow-soft">
                  <span>{user.name}</span>
                  <span className="text-purple-500">•</span>
                  <span className="text-lime-600 font-bold">{user.totalPoints} Punkte</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white/70 rounded-xl transition-all duration-300 shadow-soft hover:shadow-medium transform hover:scale-105"
              >
                Abmelden
              </button>
            </div>
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
                    ? 'bg-gradient-primary text-white shadow-colored-lime' 
                    : 'text-gray-700 hover:bg-white/70 shadow-soft'
                }`}
              >
                Verwaltung
              </button>
              <button
                onClick={() => navigate('/parent-dashboard')}
                className={`px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 font-semibold ${
                  isActive('/parent-dashboard') 
                    ? 'bg-gradient-primary text-white shadow-colored-lime' 
                    : 'text-gray-700 hover:bg-white/70 shadow-soft'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white/70 rounded-xl transition-all duration-300 shadow-soft hover:shadow-medium transform hover:scale-105"
              >
                Abmelden
              </button>
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
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          Lern-Abenteuer-Quiz
        </h1>
      </div>
    </header>
  );
}

