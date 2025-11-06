/**
 * Header-Komponente für die App
 * Zeigt Logo/Titel und Navigation an
 */

import { Button } from './Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../../services/auth';
import type { User } from '../../types';

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
    // Wenn auf Login-Seite, nichts tun
    if (location.pathname === '/login') {
      return;
    }
    
    // Bestimme Ziel basierend auf User-Rolle oder aktueller Route
    // Wenn User vorhanden ist, nutze die Rolle
    if (user) {
      if (user.role === 'parent') {
        navigate('/parent-dashboard');
      } else {
        navigate('/home');
      }
    } else {
      // Wenn kein User, aber auf geschützter Route
      // Prüfe aktuelle Route für Hinweis
      const currentPath = location.pathname;
      if (currentPath.startsWith('/parent-dashboard') || currentPath.startsWith('/admin')) {
        navigate('/parent-dashboard');
      } else {
        navigate('/home');
      }
    }
  };

  return (
    <header className="bg-gradient-to-r from-pastel-blue-500 to-pastel-purple-500 text-white shadow-lg border-b-2 border-pastel-purple-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 
              onClick={handleLogoClick}
              className={`text-2xl font-bold text-white drop-shadow-lg transition-colors cursor-pointer ${
                user ? 'hover:text-pastel-blue-100 active:scale-95' : 'opacity-80'
              }`}
              style={{ userSelect: 'none' }}
            >
              🎓 Lern-Abenteuer-Quiz
            </h1>
            {user && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl">{user.avatar || '👦'}</span>
                <p className="text-sm text-pastel-blue-100">
                  Hallo {user.name}! • {user.totalPoints} Punkte
                </p>
              </div>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-2">
              {user.role === 'parent' && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/admin')}
                  >
                    Verwaltung ⚙️
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/parent-dashboard')}
                  >
                    Eltern-Dashboard
                  </Button>
                </>
              )}
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Abmelden
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

