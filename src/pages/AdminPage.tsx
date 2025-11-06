/**
 * Verwaltungsseite für Eltern
 * Spielerischer Stil: Bunte Gradienten, animierte Karten
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { User } from '../types';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { generateLinkingCode, getCurrentLinkingCode } from '../services/linking';

interface ChildAccount {
  uid: string;
  name: string;
  email: string;
  class?: number;
  avatar?: string;
  totalPoints: number;
}

export function AdminPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [linkingCode, setLinkingCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser?.role !== 'parent') {
        // Nicht-Eltern umleiten
        setLoading(false);
        navigate('/home');
        return;
      }

      // Lade verknüpfte Kinder
      if (currentUser.children && currentUser.children.length > 0) {
        const childrenData: ChildAccount[] = [];
        
        for (const childId of currentUser.children) {
          try {
            const childDoc = await getDoc(doc(db, 'users', childId));
            if (childDoc.exists()) {
              const childData = childDoc.data() as User;
              childrenData.push({
                uid: childId,
                name: childData.name,
                email: childData.email,
                class: childData.class,
                avatar: childData.avatar,
                totalPoints: childData.totalPoints || 0,
              });
            }
          } catch (error) {
            console.error(`Fehler beim Laden von Kind ${childId}:`, error);
          }
        }
        
        setChildren(childrenData);
      }
      
      setLoading(false);
    };

    loadData();
  }, [navigate]);

  // Lade aktuellen Verknüpfungscode
  useEffect(() => {
    const loadCode = async () => {
      if (user?.uid && user?.role === 'parent') {
        try {
          const currentCode = await getCurrentLinkingCode(user.uid);
          if (currentCode) {
            setLinkingCode(currentCode.code);
            setCodeExpiresAt(currentCode.expiresAt);
          }
        } catch (error) {
          console.error('Fehler beim Laden des Codes:', error);
        }
      }
    };

    if (user) {
      loadCode();
    }
  }, [user]);

  // Aktualisiere Countdown für Code-Ablaufzeit
  useEffect(() => {
    if (!codeExpiresAt) return;

    const updateCountdown = () => {
      const now = new Date();
      const expires = codeExpiresAt;
      
      if (now >= expires) {
        // Code ist abgelaufen
        setLinkingCode(null);
        setCodeExpiresAt(null);
        return;
      }
    };

    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  const handleGenerateCode = async () => {
    if (!user?.uid) return;

    setCodeLoading(true);
    setCodeError('');

    try {
      const code = await generateLinkingCode(user.uid);
      setLinkingCode(code);
      
      // Setze Ablaufzeit (1 Stunde)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      setCodeExpiresAt(expiresAt);
    } catch (error: any) {
      console.error('Fehler beim Generieren des Codes:', error);
      setCodeError(error.message || 'Fehler beim Generieren des Codes.');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!linkingCode) return;

    try {
      await navigator.clipboard.writeText(linkingCode);
      setLinkSuccess('Code in Zwischenablage kopiert!');
      setTimeout(() => setLinkSuccess(''), 3000);
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
      setCodeError('Code konnte nicht kopiert werden.');
    }
  };

  const getTimeRemaining = (): string => {
    if (!codeExpiresAt) return '';
    
    const now = new Date();
    const expires = codeExpiresAt;
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Abgelaufen';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLinkChild = async () => {
    setLinkError('');
    setLinkSuccess('');
    
    if (!linkEmail.trim()) {
      setLinkError('Bitte geben Sie die E-Mail-Adresse des Kindes ein.');
      return;
    }

    try {
      // Suche nach Kind-Konto
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', linkEmail.trim())
      );
      const querySnapshot = await getDocs(usersQuery);

      if (querySnapshot.empty) {
        setLinkError('Kein Konto mit dieser E-Mail-Adresse gefunden.');
        return;
      }

      const childDoc = querySnapshot.docs[0];
      const childData = childDoc.data() as User;
      const childId = childDoc.id;

      // Prüfe ob bereits verknüpft
      if (user?.children?.includes(childId)) {
        setLinkError('Dieses Kind ist bereits verknüpft.');
        return;
      }

      // Füge Kind zum Eltern-Konto hinzu
      const updatedChildren = [...(user?.children || []), childId];
      await updateDoc(doc(db, 'users', user!.uid), {
        children: updatedChildren,
      });

      // Verknüpfe Kind mit Eltern
      await updateDoc(doc(db, 'users', childId), {
        parentId: user!.uid,
      });

      // Aktualisiere lokalen State
      setChildren([
        ...children,
        {
          uid: childId,
          name: childData.name,
          email: childData.email,
          class: childData.class,
          avatar: childData.avatar,
          totalPoints: childData.totalPoints || 0,
        },
      ]);

      setLinkSuccess(`Kind "${childData.name}" erfolgreich verknüpft!`);
      setLinkEmail('');
    } catch (error: any) {
      console.error('Fehler beim Verknüpfen:', error);
      setLinkError(
        error.message || 'Fehler beim Verknüpfen des Kindes. Bitte versuchen Sie es erneut.'
      );
    }
  };

  const handleUnlinkChild = async (childId: string) => {
    if (!confirm('Möchten Sie dieses Kind wirklich entfernen?')) {
      return;
    }

    try {
      // Entferne Kind aus Eltern-Konto
      const updatedChildren = user?.children?.filter((id) => id !== childId) || [];
      await updateDoc(doc(db, 'users', user!.uid), {
        children: updatedChildren,
      });

      // Entferne Eltern-Verknüpfung vom Kind
      await updateDoc(doc(db, 'users', childId), {
        parentId: null,
      });

      // Aktualisiere lokalen State
      setChildren(children.filter((c) => c.uid !== childId));
    } catch (error) {
      console.error('Fehler beim Entfernen:', error);
      alert('Fehler beim Entfernen des Kindes.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card>
          <LoadingSpinner text="Lade Verwaltung..." />
        </Card>
      </div>
    );
  }

  if (user?.role !== 'parent') {
    return null; // Wird umgeleitet
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Verwaltung ⚙️
            </h2>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/parent-dashboard')}
              >
                Eltern-Dashboard
              </Button>
              <Button variant="secondary" onClick={() => navigate('/home')}>
                Zur Startseite
              </Button>
            </div>
          </div>

          {/* Code-Verknüpfung */}
          <Card className="mb-6 bg-gradient-to-br from-purple-200 to-pink-200 border-2 border-purple-400 shadow-large animate-fade-in">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
              Code-Verknüpfung 🔗
            </h3>
            <p className="text-gray-700 mb-4 text-lg">
              Generieren Sie einen Code, den Ihr Kind eingeben kann, um sich mit Ihrem Konto zu verknüpfen.
            </p>
            
            {codeError && (
              <div className="mb-4 p-4 bg-gradient-to-r from-red-200 to-orange-200 text-red-900 rounded-xl border-2 border-red-400 shadow-medium">
                {codeError}
              </div>
            )}
            
            {linkSuccess && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-200 to-emerald-200 text-green-900 rounded-xl border-2 border-green-400 shadow-medium">
                {linkSuccess}
              </div>
            )}

            {linkingCode ? (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-6 border-2 border-purple-400 shadow-large">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2 font-semibold">Ihr Verknüpfungscode:</div>
                    <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 tracking-wider font-mono">
                      {linkingCode}
                    </div>
                    {codeExpiresAt && (
                      <div className="text-sm text-gray-700 mb-4 font-semibold">
                        Gültig für: <span className="text-purple-600">{getTimeRemaining()}</span>
                      </div>
                    )}
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="primary"
                        onClick={handleCopyCode}
                        className="flex items-center gap-2 shadow-colored-lime"
                      >
                        📋 Code kopieren
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleGenerateCode}
                        disabled={codeLoading}
                        className="shadow-colored-blue"
                      >
                        🔄 Neuen Code generieren
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-700 bg-white/80 p-4 rounded-xl border-2 border-purple-300 shadow-soft">
                  <div className="font-bold mb-2 text-lg">ℹ️ So funktioniert's:</div>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Geben Sie diesen Code Ihrem Kind</li>
                    <li>Das Kind geht auf "Mit Eltern verknüpfen"</li>
                    <li>Das Kind gibt den Code ein</li>
                    <li>Die Verknüpfung wird automatisch erstellt</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Button
                  variant="primary"
                  onClick={handleGenerateCode}
                  disabled={codeLoading}
                  className="text-lg px-8 py-4 shadow-colored-lime"
                >
                  {codeLoading ? '⏳ Code wird generiert...' : '🔑 Code generieren'}
                </Button>
              </div>
            )}
          </Card>

          {/* E-Mail-Verknüpfung */}
          <Card className="mb-6 shadow-large">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              E-Mail-Verknüpfung 📧
            </h3>
            <p className="text-gray-600 mb-4 text-lg">
              Geben Sie die E-Mail-Adresse des Kind-Kontos ein, um es mit Ihrem Eltern-Konto zu verknüpfen.
            </p>
            
            {linkError && (
              <div className="mb-4 p-4 bg-gradient-to-r from-red-200 to-orange-200 text-red-900 rounded-xl border-2 border-red-400 shadow-medium">
                {linkError}
              </div>
            )}
            
            {linkSuccess && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-200 to-emerald-200 text-green-900 rounded-xl border-2 border-green-400 shadow-medium">
                {linkSuccess}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="email"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="kind@email.de"
                className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 bg-white shadow-soft text-lg"
              />
              <Button variant="primary" onClick={handleLinkChild} className="shadow-colored-lime">
                Verknüpfen
              </Button>
            </div>
          </Card>

          {/* Verknüpfte Kinder */}
          <Card className="shadow-large">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Verknüpfte Kinder ({children.length})
            </h3>
            
            {children.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <div className="text-5xl mb-3">👶</div>
                <p className="text-lg font-semibold">Noch keine Kinder verknüpft</p>
                <p className="text-sm mt-2">
                  Verknüpfen Sie ein Kind-Konto oben, um dessen Fortschritt zu sehen.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {children.map((child) => (
                  <div
                    key={child.uid}
                    className="border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between bg-gradient-card shadow-medium transform hover:scale-[1.01] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-5xl transform hover:scale-110 transition-transform">{child.avatar || '👦'}</span>
                      <div>
                        <div className="font-bold text-lg text-gray-800">{child.name}</div>
                        <div className="text-sm text-gray-600">
                          {child.email}
                        </div>
                        {child.class && (
                          <div className="text-sm text-gray-600 font-semibold">
                            Klasse {child.class} • {child.totalPoints} Punkte
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleUnlinkChild(child.uid)}
                      className="shadow-lg"
                    >
                      Entfernen
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Einstellungen */}
          <Card className="mt-6 bg-gradient-card shadow-large">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Einstellungen
            </h3>
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl border-2 border-blue-300 shadow-soft">
                <div className="font-bold mb-2 text-lg text-blue-900">⏰ Zeitlimits</div>
                <p className="text-sm text-blue-800">
                  Zeitlimits für Kinder können hier in Zukunft eingestellt werden.
                </p>
              </div>
              
              <div className="p-5 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl border-2 border-pink-300 shadow-soft">
                <div className="font-bold mb-2 text-lg text-pink-900">📧 Benachrichtigungen</div>
                <p className="text-sm text-pink-800">
                  E-Mail-Benachrichtigungen über Fortschritt können hier in Zukunft aktiviert werden.
                </p>
              </div>
              
              <div className="p-5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border-2 border-green-300 shadow-soft">
                <div className="font-bold mb-2 text-lg text-green-900">📊 Berichte exportieren</div>
                <p className="text-sm text-green-800 mb-2">
                  Fortschrittsberichte können im Eltern-Dashboard exportiert werden.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/parent-dashboard')}
                  className="mt-2 shadow-colored-lime"
                >
                  Zum Dashboard →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

