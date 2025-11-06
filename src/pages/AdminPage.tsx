/**
 * Verwaltungsseite für Eltern
 * Verwaltung von Kinder-Konten, Einstellungen, Zeitlimits
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
      <div className="min-h-screen bg-gradient-to-br from-pastel-blue-100 via-pastel-green-100 to-pastel-blue-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-pastel-blue-100 via-pastel-green-100 to-pastel-blue-50">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold text-gray-800">
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
          <Card className="mb-6 bg-gradient-to-br from-pastel-purple-50 to-pastel-pink-50 border-2 border-pastel-purple-300">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              Code-Verknüpfung 🔗
            </h3>
            <p className="text-gray-600 mb-4">
              Generieren Sie einen Code, den Ihr Kind eingeben kann, um sich mit Ihrem Konto zu verknüpfen.
            </p>
            
            {codeError && (
              <div className="mb-4 p-3 bg-error-50 text-error-600 rounded-lg">
                {codeError}
              </div>
            )}
            
            {linkSuccess && (
              <div className="mb-4 p-3 bg-success-50 text-success-600 rounded-lg">
                {linkSuccess}
              </div>
            )}

            {linkingCode ? (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-6 border-2 border-pastel-purple-400 shadow-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Ihr Verknüpfungscode:</div>
                    <div className="text-5xl font-bold text-pastel-purple-600 mb-4 tracking-wider font-mono">
                      {linkingCode}
                    </div>
                    {codeExpiresAt && (
                      <div className="text-sm text-gray-600 mb-4">
                        Gültig für: <span className="font-semibold">{getTimeRemaining()}</span>
                      </div>
                    )}
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="primary"
                        onClick={handleCopyCode}
                        className="flex items-center gap-2"
                      >
                        📋 Code kopieren
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleGenerateCode}
                        disabled={codeLoading}
                      >
                        🔄 Neuen Code generieren
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 bg-info-50 p-3 rounded-lg">
                  <div className="font-semibold mb-1">ℹ️ So funktioniert's:</div>
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
                  className="text-lg px-8 py-4"
                >
                  {codeLoading ? '⏳ Code wird generiert...' : '🔑 Code generieren'}
                </Button>
              </div>
            )}
          </Card>

          {/* E-Mail-Verknüpfung */}
          <Card className="mb-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              E-Mail-Verknüpfung 📧
            </h3>
            <p className="text-gray-600 mb-4">
              Geben Sie die E-Mail-Adresse des Kind-Kontos ein, um es mit Ihrem Eltern-Konto zu verknüpfen.
            </p>
            
            {linkError && (
              <div className="mb-4 p-3 bg-error-50 text-error-600 rounded-lg">
                {linkError}
              </div>
            )}
            
            {linkSuccess && (
              <div className="mb-4 p-3 bg-success-50 text-success-600 rounded-lg">
                {linkSuccess}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="email"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="kind@email.de"
                className="flex-1 px-4 py-2 border-2 border-pastel-blue-300 rounded-lg focus:ring-2 focus:ring-pastel-purple-300 focus:border-pastel-purple-400 bg-white shadow-sm"
              />
              <Button variant="primary" onClick={handleLinkChild}>
                Verknüpfen
              </Button>
            </div>
          </Card>

          {/* Verknüpfte Kinder */}
          <Card>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              Verknüpfte Kinder ({children.length})
            </h3>
            
            {children.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👶</div>
                <p>Noch keine Kinder verknüpft</p>
                <p className="text-sm mt-2">
                  Verknüpfen Sie ein Kind-Konto oben, um dessen Fortschritt zu sehen.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {children.map((child) => (
                  <div
                    key={child.uid}
                    className="border-2 border-gray-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{child.avatar || '👦'}</span>
                      <div>
                        <div className="font-bold text-lg">{child.name}</div>
                        <div className="text-sm text-gray-600">
                          {child.email}
                        </div>
                        {child.class && (
                          <div className="text-sm text-gray-600">
                            Klasse {child.class} • {child.totalPoints} Punkte
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => handleUnlinkChild(child.uid)}
                    >
                      Entfernen
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Einstellungen */}
          <Card className="mt-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              Einstellungen
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-info-50 rounded-lg">
                <div className="font-semibold mb-2">⏰ Zeitlimits</div>
                <p className="text-sm text-gray-600 mb-2">
                  Zeitlimits für Kinder können hier in Zukunft eingestellt werden.
                </p>
              </div>
              
              <div className="p-4 bg-info-50 rounded-lg">
                <div className="font-semibold mb-2">📧 Benachrichtigungen</div>
                <p className="text-sm text-gray-600 mb-2">
                  E-Mail-Benachrichtigungen über Fortschritt können hier in Zukunft aktiviert werden.
                </p>
              </div>
              
              <div className="p-4 bg-info-50 rounded-lg">
                <div className="font-semibold mb-2">📊 Berichte exportieren</div>
                <p className="text-sm text-gray-600 mb-2">
                  Fortschrittsberichte können im Eltern-Dashboard exportiert werden.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/parent-dashboard')}
                  className="mt-2"
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

