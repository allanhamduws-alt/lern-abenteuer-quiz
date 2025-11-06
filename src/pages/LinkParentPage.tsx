/**
 * Link Parent Page
 * Seite für Kinder, um sich mit einem Eltern-Konto zu verknüpfen
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { validateAndLinkCode } from '../services/linking';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { User } from '../types';

export function LinkParentPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Prüfe ob bereits verknüpft
      if (currentUser.parentId && currentUser.parentId !== '') {
        setLoading(false);
        setSuccess(true);
        setTimeout(() => {
          navigate('/home');
        }, 2000);
        return;
      }

      // Prüfe ob es ein Eltern-Konto ist
      if (currentUser.role === 'parent') {
        setLoading(false);
        navigate('/admin');
        return;
      }

      setLoading(false);
    };

    loadUser();
  }, [navigate]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Normalisiere Eingabe: Nur Großbuchstaben und Zahlen, max 6 Zeichen
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 6) {
      value = value.substring(0, 6);
    }
    setCode(value);
    setError('');
  };

  const handleLink = async () => {
    if (!user?.uid) return;

    if (code.length !== 6) {
      setError('Der Code muss genau 6 Zeichen lang sein.');
      return;
    }

    setIsLinking(true);
    setError('');

    try {
      await validateAndLinkCode(code, user.uid);
      setSuccess(true);
      
      // Weiterleitung nach 2 Sekunden
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (error: any) {
      console.error('Fehler beim Verknüpfen:', error);
      setError(error.message || 'Fehler beim Verknüpfen. Bitte versuche es erneut.');
    } finally {
      setIsLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card>
          <LoadingSpinner text="Lade..." />
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-background">
        <Header user={user || undefined} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="bg-gradient-to-br from-green-200 to-emerald-200 border-2 border-green-400 shadow-large animate-fade-in">
              <div className="text-center py-8">
                <div className="text-7xl mb-4 animate-bounce">✅</div>
                <h2 className="text-4xl font-bold text-green-900 mb-4">
                  Erfolgreich verknüpft! 🎉
                </h2>
                <p className="text-green-800 mb-6 text-lg">
                  Du wurdest erfolgreich mit dem Eltern-Konto verknüpft.
                </p>
                <p className="text-sm text-green-700 font-semibold">
                  Weiterleitung zur Startseite...
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="bg-gradient-to-br from-purple-200 to-pink-200 border-2 border-purple-400 shadow-large animate-fade-in">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 animate-bounce">🔗</div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
                Mit Eltern verknüpfen
              </h2>
              <p className="text-gray-700 text-lg">
                Gib den Code ein, den deine Eltern dir gegeben haben.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-gradient-to-r from-red-200 to-orange-200 text-red-900 rounded-xl border-2 border-red-400 shadow-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-bold text-gray-700 mb-2">
                  Verknüpfungscode (6 Zeichen)
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-4 py-4 text-3xl font-mono text-center border-2 border-purple-400 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 bg-white shadow-medium tracking-widest"
                  autoFocus
                />
                <div className="text-xs text-gray-600 mt-2 text-center font-semibold">
                  {code.length} / 6 Zeichen
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleLink}
                disabled={code.length !== 6 || isLinking}
                className="w-full text-lg py-4 shadow-colored-lime"
              >
                {isLinking ? '⏳ Verknüpfe...' : '🔗 Mit Eltern verknüpfen'}
              </Button>

              <Button
                variant="secondary"
                onClick={() => navigate('/home')}
                className="w-full shadow-colored-blue"
              >
                Zurück zur Startseite
              </Button>
            </div>

            <div className="mt-6 p-4 bg-white/80 rounded-xl text-sm text-gray-700 border-2 border-purple-300 shadow-soft">
              <div className="font-bold mb-2 text-lg">ℹ️ So funktioniert's:</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Deine Eltern haben einen Code generiert</li>
                <li>Gib den Code hier ein</li>
                <li>Die Verknüpfung wird automatisch erstellt</li>
              </ol>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

