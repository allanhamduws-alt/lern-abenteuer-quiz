/**
 * Link Parent Page
 * Seite für Kinder, um sich mit einem Eltern-Konto zu verknüpfen
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { validateAndLinkCode, fetchInvitesForChild, acceptParentInvite, declineParentInvite, type ParentInvite } from '../services/linking';
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
  const [invites, setInvites] = useState<ParentInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [inviteActionLoading, setInviteActionLoading] = useState<string | null>(null);
  const formatDate = (date?: Date) => {
    if (!date) {
      return '-';
    }
    try {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  useEffect(() => {
    let cancelled = false;
    
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (cancelled) return;
        
        if (!currentUser) {
          setLoading(false);
          navigate('/login');
          return;
        }
        
        setUser(currentUser);

        // Prüfe ob bereits verknüpft
        if (currentUser.parentId && currentUser.parentId !== '') {
          setLoading(false);
          setSuccess(true);
          setTimeout(() => {
            if (!cancelled) {
              navigate('/dashboard');
            }
          }, 2000);
          return;
        }

        // Prüfe ob es ein Eltern-Konto ist
        if (currentUser.role === 'parent') {
          setLoading(false);
          navigate('/admin');
          return;
        }

        try {
          setInvitesLoading(true);
          const inviteList = await fetchInvitesForChild(currentUser.uid);
          if (cancelled) return;
          setInvites(inviteList);
        } catch (error) {
          console.error('Fehler beim Laden der Einladungen:', error);
          if (cancelled) return;
          setInvites([]); // Setze leeres Array bei Fehler
        } finally {
          if (!cancelled) {
            setInvitesLoading(false);
          }
        }

        if (!cancelled) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Fehler beim Laden des Benutzers:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadUser();
    
    return () => {
      cancelled = true;
    };
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
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Fehler beim Verknüpfen:', error);
      setError(error.message || 'Fehler beim Verknüpfen. Bitte versuche es erneut.');
    } finally {
      setIsLinking(false);
    }
  };

  const refreshInvites = async (childId: string) => {
    try {
      setInvitesLoading(true);
      const inviteList = await fetchInvitesForChild(childId);
      setInvites(inviteList);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Einladungen:', error);
    } finally {
      setInvitesLoading(false);
    }
  };

  const handleAcceptInvite = async (invite: ParentInvite) => {
    if (!user) return;
    try {
      setInviteActionLoading(invite.id);
      await acceptParentInvite(invite.id);
      await refreshInvites(user.uid);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Fehler beim Annehmen der Einladung:', error);
      setError(error.message || 'Einladung konnte nicht angenommen werden.');
    } finally {
      setInviteActionLoading(null);
    }
  };

  const handleDeclineInvite = async (invite: ParentInvite) => {
    if (!user) return;
    try {
      setInviteActionLoading(invite.id);
      await declineParentInvite(invite.id);
      await refreshInvites(user.uid);
      setError('Einladung abgelehnt.');
      setTimeout(() => setError(''), 3000);
    } catch (error: any) {
      console.error('Fehler beim Ablehnen der Einladung:', error);
      setError(error.message || 'Einladung konnte nicht abgelehnt werden.');
    } finally {
      setInviteActionLoading(null);
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
              <div className="bg-white/80 rounded-xl border-2 border-purple-300 shadow-soft p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    📬 Einladungen von Eltern
                  </h3>
                  {invitesLoading && (
                    <span className="text-xs font-bold text-purple-600 uppercase">Lädt…</span>
                  )}
                </div>
                {invites.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Keine Einladungen vorhanden. Bitte gib den Verknüpfungscode ein, den dir deine Eltern gegeben haben.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="border border-purple-200 rounded-lg p-3 bg-white shadow-sm"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-800">
                              Einladung von {invite.parentName || 'deinem Elternteil'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Gesendet am {formatDate(invite.createdAt)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {invite.status === 'pending' ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleAcceptInvite(invite)}
                                  disabled={inviteActionLoading === invite.id}
                                  className="shadow-colored-lime"
                                >
                                  {inviteActionLoading === invite.id ? '⏳ …' : 'Annehmen'}
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleDeclineInvite(invite)}
                                  disabled={inviteActionLoading === invite.id}
                                  className="shadow-soft"
                                >
                                  Ablehnen
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs font-semibold text-gray-600 uppercase">
                                {invite.status === 'accepted' ? 'Schon angenommen' : 'Nicht verfügbar'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
                onClick={() => navigate('/dashboard')}
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

