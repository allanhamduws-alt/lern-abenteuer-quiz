/**
 * Header-Komponente für die App
 * Zeigt Logo/Titel und Navigation an
 */

import { Button } from './Button';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../services/auth';

interface HeaderProps {
  user?: { name: string; totalPoints: number; avatar?: string } | null;
}

export function Header({ user }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    }
  };

  return (
    <header className="bg-primary-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🎓 Lern-Abenteuer-Quiz</h1>
            {user && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl">{user.avatar || '👦'}</span>
                <p className="text-sm text-primary-100">
                  Hallo {user.name}! • {user.totalPoints} Punkte
                </p>
              </div>
            )}
          </div>
          {user && (
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Abmelden
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

