/**
 * Header-Komponente für die App
 * LogicLike-Style: Weißer Hintergrund, horizontale Navigation
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
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 
                onClick={handleLogoClick}
                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors"
                style={{ userSelect: 'none' }}
              >
                Lern-Abenteuer-Quiz
              </h1>
              
              <nav className="hidden md:flex items-center gap-1">
                <button
                  onClick={() => navigate('/home')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/home') 
                      ? 'bg-green-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MathIcon className="w-5 h-5" />
                  <span className="font-medium">Fächer</span>
                </button>
                
                <button
                  onClick={() => navigate('/progress')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/progress') 
                      ? 'bg-green-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ProgressIcon className="w-5 h-5" />
                  <span className="font-medium">Fortschritt</span>
                </button>
                
                <button
                  onClick={() => navigate('/profile')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/profile') 
                      ? 'bg-green-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ProfileIcon className="w-5 h-5" />
                  <span className="font-medium">Profil</span>
                </button>
                
                <button
                  onClick={() => navigate('/practice')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/practice') 
                      ? 'bg-green-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-medium">Üben</span>
                </button>
                
                <button
                  onClick={() => navigate('/games')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/games') 
                      ? 'bg-green-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <GameIcon className="w-5 h-5" />
                  <span className="font-medium">Spiele</span>
                </button>
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                  <span>{user.name}</span>
                  <span>•</span>
                  <span>{user.totalPoints} Punkte</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 
              onClick={handleLogoClick}
              className="text-xl font-bold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors"
              style={{ userSelect: 'none' }}
            >
              Lern-Abenteuer-Quiz
            </h1>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/admin')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive('/admin') 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Verwaltung
              </button>
              <button
                onClick={() => navigate('/parent-dashboard')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive('/parent-dashboard') 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">
          Lern-Abenteuer-Quiz
        </h1>
      </div>
    </header>
  );
}

