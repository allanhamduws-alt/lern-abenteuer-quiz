/**
 * Einstellungsseite für Eltern
 * Kinder-Verwaltung und Einstellungen
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { UploadForm } from '../components/parent/UploadForm';
import { UploadReview } from '../components/parent/UploadReview';
import type { User } from '../types';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  generateLinkingCode,
  getCurrentLinkingCode,
  createParentInvite,
  fetchInvitesForParent,
  cancelParentInvite,
  type ParentInvite
} from '../services/linking';

interface ChildAccount {
  uid: string;
  name: string;
  email: string;
  class?: number;
  avatar?: string;
  totalPoints: number;
}

export function ParentSettingsPage() {
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
  const [invites, setInvites] = useState<ParentInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

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

  const loadChildrenForParent = async (parentUser: User): Promise<ChildAccount[]> => {
    const childrenData: ChildAccount[] = [];

    if (parentUser.children && parentUser.children.length > 0) {
      for (const childId of parentUser.children) {
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
    }

    return childrenData;
  };

  const refreshInvites = async (parentId: string) => {
    try {
      setInvitesLoading(true);
      const inviteList = await fetchInvitesForParent(parentId);
      setInvites(inviteList);

      const parentDoc = await getDoc(doc(db, 'users', parentId));
      if (parentDoc.exists()) {
        const parentData = { ...(parentDoc.data() as User), uid: parentId };
        setUser(parentData);
        const childrenData = await loadChildrenForParent(parentData);
        setChildren(childrenData);
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Einladungen:', error);
    } finally {
      setInvitesLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (cancelled) return;
        
        if (!currentUser) {
          setLoading(false);
          navigate('/dashboard');
          return;
        }
        
        setUser(currentUser);

        if (currentUser.role !== 'parent') {
          // Nicht-Eltern umleiten
          setLoading(false);
          navigate('/dashboard');
          return;
        }

        const childrenData = await loadChildrenForParent(currentUser);
        if (cancelled) return;
        setChildren(childrenData);

        try {
          setInvitesLoading(true);
          const inviteList = await fetchInvitesForParent(currentUser.uid);
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
        console.error('Fehler beim Laden der Daten:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      cancelled = true;
    };
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

      if (!user) {
        setLinkError('Benutzerdaten konnten nicht geladen werden.');
        return;
      }

      await createParentInvite(
        { ...user, uid: user.uid } as User,
        { ...childData, uid: childId } as User
      );

      await refreshInvites(user.uid);

      setLinkSuccess(`Einladung für "${childData.name}" wurde versendet. Das Kind kann sie nun bestätigen.`);
      setLinkEmail('');
    } catch (error: any) {
      console.error('Fehler beim Versenden der Einladung:', error);
      setLinkError(
        error.message || 'Fehler beim Versenden der Einladung. Bitte versuchen Sie es erneut.'
      );
    }
  };

  const handleUnlinkChild = async (childId: string, childName: string) => {
    if (!confirm(`Möchten Sie ${childName} wirklich von Ihrem Konto entfernen?\n\nDas Kind kann sich weiterhin anmelden, aber Sie haben keinen Zugriff mehr auf dessen Fortschritt.`)) {
      return;
    }

    if (!user?.uid) return;

    try {
      // Entferne Kind aus Eltern-Konto
      const updatedChildren = user.children?.filter((id) => id !== childId) || [];
      await updateDoc(doc(db, 'users', user.uid), {
        children: updatedChildren,
      });

      // Entferne Eltern-Verknüpfung vom Kind (verwende deleteField statt null)
      await updateDoc(doc(db, 'users', childId), {
        parentId: deleteField(),
      });

      // Aktualisiere lokalen State
      setChildren(children.filter((c) => c.uid !== childId));
      
      // Aktualisiere user state
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
      if (updatedUser?.uid) {
        await refreshInvites(updatedUser.uid);
      }
      
      // Zeige Erfolgsmeldung
      setLinkSuccess(`${childName} wurde erfolgreich entfernt.`);
      setTimeout(() => setLinkSuccess(''), 3000);
    } catch (error: any) {
      console.error('Fehler beim Entfernen:', error);
      setLinkError(error.message || 'Fehler beim Entfernen des Kindes. Bitte versuchen Sie es erneut.');
      setTimeout(() => setLinkError(''), 5000);
    }
  };

  const handleCancelInvite = async (invite: ParentInvite) => {
    if (!user?.uid) {
      return;
    }

    try {
      await cancelParentInvite(user.uid, invite.childId);
      await refreshInvites(user.uid);
      setLinkSuccess(`Einladung für ${invite.childName} wurde zurückgezogen.`);
      setTimeout(() => setLinkSuccess(''), 3000);
    } catch (error: any) {
      console.error('Fehler beim Zurückziehen der Einladung:', error);
      setLinkError(error.message || 'Einladung konnte nicht zurückgezogen werden.');
      setTimeout(() => setLinkError(''), 5000);
    }
  };

  const handleResendInvite = async (invite: ParentInvite) => {
    if (!user) return;

    try {
      const childSnap = await getDoc(doc(db, 'users', invite.childId));
      if (!childSnap.exists()) {
        throw new Error('Kind-Konto nicht gefunden.');
      }
      const childData = childSnap.data() as User;

      await createParentInvite(
        { ...user, uid: user.uid } as User,
        { ...childData, uid: invite.childId } as User
      );

      await refreshInvites(user.uid);
      setLinkSuccess(`Einladung an "${invite.childName}" wurde erneut versendet.`);
      setTimeout(() => setLinkSuccess(''), 3000);
    } catch (error: any) {
      console.error('Fehler beim erneuten Versenden der Einladung:', error);
      setLinkError(error.message || 'Einladung konnte nicht erneut versendet werden.');
      setTimeout(() => setLinkError(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card>
          <LoadingSpinner text="Lade Einstellungen..." />
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
              Einstellungen ⚙️
            </h2>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/parent-dashboard')}
              >
                Dashboard
              </Button>
            </div>
          </div>

          {/* Kinder-Verwaltung */}
          <Card className="mb-6 bg-gradient-to-br from-purple-200 to-pink-200 border-2 border-purple-400 shadow-large animate-fade-in">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
              Kinder verwalten 👨‍👩‍👧‍👦
            </h3>
            
            {/* Code-Verknüpfung */}
            <div className="mb-6">
              <h4 className="text-xl font-bold mb-3 text-gray-800">Code-Verknüpfung 🔗</h4>
              <p className="text-gray-700 mb-4 text-sm">
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
            </div>

            {/* E-Mail-Verknüpfung */}
            <div className="mb-6">
              <h4 className="text-xl font-bold mb-3 text-gray-800">E-Mail-Verknüpfung 📧</h4>
              <p className="text-gray-600 mb-4 text-sm">
                Geben Sie die E-Mail-Adresse des Kind-Kontos ein, um eine Einladung zu senden. Das Kind muss die Einladung bestätigen.
              </p>
              
              {linkError && (
                <div className="mb-4 p-4 bg-gradient-to-r from-red-200 to-orange-200 text-red-900 rounded-xl border-2 border-red-400 shadow-medium">
                  {linkError}
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
                  Einladung senden
                </Button>
              </div>
            </div>

            {/* Einladungen */}
            <div className="mb-6">
              <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                📬 Einladungen
                {invitesLoading && (
                  <span className="text-sm font-semibold text-purple-600">Lädt...</span>
                )}
              </h4>
              
              {invites.length === 0 ? (
                <div className="text-center py-6 text-gray-600 bg-white/60 rounded-xl border-2 border-purple-300">
                  <p className="text-sm">
                    Keine Einladungen vorhanden. Senden Sie eine Einladung per E-Mail oder teilen Sie einen Code.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invites.map((invite) => {
                    const statusBadge =
                      invite.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        : invite.status === 'accepted'
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : invite.status === 'declined'
                        ? 'bg-red-100 text-red-700 border-red-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300';

                    const statusLabel =
                      invite.status === 'pending'
                        ? 'Ausstehend'
                        : invite.status === 'accepted'
                        ? 'Akzeptiert'
                        : invite.status === 'declined'
                        ? 'Abgelehnt'
                        : 'Zurückgezogen';

                    return (
                      <div
                        key={invite.id}
                        className="border-2 border-purple-200 rounded-xl p-4 bg-white shadow-soft"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <div className="font-bold text-lg text-gray-800">{invite.childName}</div>
                            <div className="text-sm text-gray-600">{invite.childEmail}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Eingeladen am {formatDate(invite.createdAt)}
                              {invite.respondedAt && (
                                <>
                                  {' • '}
                                  {invite.status === 'accepted' ? 'Bestätigt' : 'Reaktion'} am {formatDate(invite.respondedAt)}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${statusBadge}`}>
                              {statusLabel}
                            </span>
                            {invite.status === 'pending' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCancelInvite(invite)}
                                className="shadow-soft"
                              >
                                Zurückziehen
                              </Button>
                            )}
                            {(invite.status === 'declined' || invite.status === 'cancelled') && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleResendInvite(invite)}
                                className="shadow-soft"
                              >
                                Erneut senden
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Verknüpfte Kinder */}
            <div>
              <h4 className="text-xl font-bold mb-4 text-gray-800">
                Verknüpfte Kinder ({children.length})
              </h4>
              
              {children.length === 0 ? (
                <div className="text-center py-8 text-gray-600 bg-white/60 rounded-xl border-2 border-purple-300">
                  <div className="text-5xl mb-3">👶</div>
                  <p className="text-lg font-semibold">Noch keine Kinder verknüpft</p>
                  <p className="text-sm mt-2">
                    Verknüpfen Sie ein Kind-Konto oben, um dessen Fortschritt zu sehen.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map((child) => (
                    <div
                      key={child.uid}
                      className="border-2 border-purple-300 rounded-xl p-4 flex items-center justify-between bg-white shadow-medium transform hover:scale-[1.01] transition-all"
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
                        onClick={() => handleUnlinkChild(child.uid, child.name)}
                        className="shadow-lg"
                      >
                        Entfernen
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Eltern-Uploads (MVP) */}
          <Card className="mb-6 bg-white shadow-large border-2 border-emerald-300">
            <h3 className="text-2xl font-bold mb-4 text-emerald-800">
              Arbeitsblätter/Material hochladen 📄
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Lade ein PDF oder Bild hoch, ordne es einem Fach und einer Klassenstufe zu. Der Agent verarbeitet es und macht passende Aufgaben daraus.
            </p>
            {user?.uid && <UploadForm parentUid={user.uid} />}
          </Card>

          {/* Upload-Review & Freigabe */}
          {user?.uid && (
            <Card className="mb-6 bg-white shadow-large border-2 border-blue-300">
              <UploadReview parentUid={user.uid} />
            </Card>
          )}

          {/* Weitere Einstellungen */}
          <Card className="bg-gradient-card shadow-large">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Weitere Einstellungen
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

