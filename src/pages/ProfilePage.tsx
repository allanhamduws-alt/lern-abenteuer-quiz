/**
 * Profil-Seite - LogicLike-Style
 * Zeigt Profil-Info, Badges und Einstellungen
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../services/auth';
import { loadProgress } from '../services/progress';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Button } from '../components/ui/Button';
import { TrophyIcon } from '../components/icons';
import { getAllBadges, getBadgeById } from '../data/badges';
import type { User, Progress } from '../types';

export function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          if (currentUser.role === 'parent') {
            navigate('/parent-dashboard');
            return;
          }
          
          const userProgress = await loadProgress(currentUser.uid);
          setProgress(userProgress);
        }
      } catch (error) {
        console.error('Fehler beim Laden:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header user={user || undefined} />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-8 text-gray-500">Lädt...</div>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profil-Info */}
          <Card className="mb-6">
            <div className="flex items-center gap-6">
              <div className="text-6xl">{user.avatar || '👦'}</div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {user.name}
                </h2>
                <div className="text-gray-600 space-y-1">
                  <div>Klasse {user.class}</div>
                  {user.age && <div>Alter: {user.age} Jahre</div>}
                  {user.year && <div>Jahrgang: {user.year}</div>}
                  {progress && (
                    <>
                      <div>Gesamt-Punkte: {progress.totalPoints}</div>
                      <div>Lernstreak: {progress.learningStreak.current} Tage</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Badges-Galerie */}
          {progress && (
            <Card className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrophyIcon className="w-6 h-6 text-yellow-500" />
                <h3 className="text-2xl font-bold text-gray-900">
                  Deine Badges
                </h3>
              </div>
              
              {progress.badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {progress.badges.map((badgeId) => {
                    const badge = getBadgeById(badgeId);
                    if (!badge) return null;
                    return (
                      <div
                        key={badgeId}
                        className="bg-yellow-50 rounded-lg p-4 text-center border-2 border-yellow-300"
                      >
                        <div className="text-4xl mb-2">{badge.emoji}</div>
                        <div className="font-bold text-sm text-gray-900">{badge.name}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrophyIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Noch keine Badges verdient!</p>
                  <p className="text-sm mt-2">
                    Spiele Quizzes und sammle Badges für deine Erfolge!
                  </p>
                </div>
              )}

              {/* Alle verfügbaren Badges */}
              {progress.badges.length > 0 && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-4">
                    Alle verfügbaren Badges anzeigen
                  </summary>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {getAllBadges().map((badge) => {
                      const isEarned = progress.badges.includes(badge.id);
                      return (
                        <div
                          key={badge.id}
                          className={`rounded-lg p-4 text-center border-2 ${
                            isEarned
                              ? 'bg-yellow-50 border-yellow-300'
                              : 'bg-gray-50 border-gray-200 opacity-50'
                          }`}
                        >
                          <div className="text-4xl mb-2">{badge.emoji}</div>
                          <div className={`font-bold text-sm ${isEarned ? 'text-gray-900' : 'text-gray-400'}`}>
                            {badge.name}
                          </div>
                          <div className={`text-xs mt-1 ${isEarned ? 'text-gray-600' : 'text-gray-400'}`}>
                            {badge.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </Card>
          )}

          {/* Einstellungen */}
          <Card>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Einstellungen
            </h3>
            
            <div className="space-y-4">
              {(!user.parentId || user.parentId === '') && (
                <Button
                  variant="secondary"
                  onClick={() => navigate('/link-parent')}
                  className="w-full"
                >
                  Mit Eltern verknüpfen
                </Button>
              )}
              
              <Button
                variant="danger"
                onClick={handleLogout}
                className="w-full"
              >
                Abmelden
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

