/**
 * Profil-Seite - Spielerischer Stil
 * Bunte Gradienten, 3D-Effekte, animierte Badges
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
      <div className="min-h-screen bg-gradient-background">
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
    <div className="min-h-screen bg-gradient-background">
      <Header user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profil-Info */}
          <Card className="mb-6 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 border-purple-300 shadow-large animate-fade-in">
            <div className="flex items-center gap-6">
              <div className="text-7xl transform hover:scale-110 transition-transform duration-300 drop-shadow-md">{user.avatar || '👦'}</div>
              <div className="flex-1">
                <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-md">
                  {user.name}
                </h2>
                <div className="text-white/90 space-y-1 text-lg">
                  <div className="font-semibold">Klasse {user.class}</div>
                  {user.age && <div>Alter: {user.age} Jahre</div>}
                  {user.year && <div>Jahrgang: {user.year}</div>}
                  {progress && (
                    <>
                      <div className="font-bold">Gesamt-Punkte: {progress.totalPoints} ⭐</div>
                      <div className="font-bold">Lernstreak: {progress.learningStreak.current} Tage 🔥</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Badges-Galerie */}
          {progress && (
            <Card className="mb-6 bg-gradient-to-r from-yellow-300 to-orange-300 border-2 border-yellow-500 shadow-large animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <TrophyIcon className="w-8 h-8 text-yellow-900 drop-shadow-md" />
                <h3 className="text-3xl font-bold text-yellow-900 drop-shadow-sm">
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
                        className="bg-white rounded-xl p-4 text-center border-2 border-yellow-400 shadow-medium hover:shadow-large transform hover:scale-110 transition-all duration-300"
                      >
                        <div className="text-5xl mb-2">{badge.emoji}</div>
                        <div className="font-bold text-sm text-gray-900">{badge.name}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-yellow-900">
                  <TrophyIcon className="w-16 h-16 mx-auto mb-3 text-yellow-700 opacity-50" />
                  <p className="text-lg font-semibold">Noch keine Badges verdient!</p>
                  <p className="text-sm mt-2">
                    Spiele Quizzes und sammle Badges für deine Erfolge! 🎉
                  </p>
                </div>
              )}

              {/* Alle verfügbaren Badges */}
              {progress.badges.length > 0 && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-base font-semibold text-yellow-900 hover:text-yellow-800 mb-4 bg-white/60 px-4 py-2 rounded-xl shadow-soft">
                    Alle verfügbaren Badges anzeigen
                  </summary>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                    {getAllBadges().map((badge) => {
                      const isEarned = progress.badges.includes(badge.id);
                      return (
                        <div
                          key={badge.id}
                          className={`rounded-xl p-4 text-center border-2 transition-all duration-300 transform hover:scale-105 ${
                            isEarned
                              ? 'bg-white border-yellow-400 shadow-medium'
                              : 'bg-white/50 border-gray-300 opacity-60'
                          }`}
                        >
                          <div className="text-5xl mb-2">{badge.emoji}</div>
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

