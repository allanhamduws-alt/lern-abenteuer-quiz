/**
 * Login-Seite
 * Hier können sich Benutzer registrieren oder einloggen
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/auth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [classLevel, setClassLevel] = useState<1 | 2 | 3 | 4>(1);
  const [age, setAge] = useState<number | ''>('');
  const [avatar, setAvatar] = useState('👦');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<'child' | 'parent'>('child');

  const avatars = ['👦', '👧', '🧒', '👶', '🦸', '🦸‍♀️', '🧙', '🧙‍♀️', '🧚', '🧚‍♀️'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const loggedInUser = await loginUser(email, password);
        // Leite Eltern zu ihrem Dashboard um
        if (loggedInUser.role === 'parent') {
          navigate('/parent-dashboard');
        } else {
          navigate('/home');
        }
      } else {
        const newUser = await registerUser(
          email,
          password,
          name,
          userRole === 'child' ? classLevel : undefined,
          age || undefined,
          avatar,
          year,
          userRole
        );
        // Leite Eltern zu ihrem Dashboard um
        if (newUser.role === 'parent') {
          navigate('/parent-dashboard');
        } else {
          navigate('/home');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-card shadow-large animate-fade-in">
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          {isLogin ? 'Anmelden' : 'Registrieren'}
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-gradient-to-r from-red-100 to-orange-100 text-red-900 rounded-xl border-2 border-red-300 shadow-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Als registrieren
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserRole('child')}
                    className={`p-4 rounded-lg border transition-colors duration-200 ${
                      userRole === 'child'
                        ? 'border-purple-500 bg-purple-600 text-white'
                        : 'border-gray-300 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">👶</div>
                    <div className="text-sm font-semibold">Kind</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRole('parent')}
                    className={`p-4 rounded-lg border transition-colors duration-200 ${
                      userRole === 'parent'
                        ? 'border-purple-500 bg-purple-600 text-white'
                        : 'border-gray-300 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">👨‍👩‍👧‍👦</div>
                    <div className="text-sm font-semibold">Eltern</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 bg-white"
                  placeholder="Dein Name"
                />
              </div>

              {userRole === 'child' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Alter (optional)
                    </label>
                <input
                  type="number"
                  min="5"
                  max="12"
                  value={age}
                  onChange={(e) =>
                    setAge(e.target.value ? parseInt(e.target.value) : '')
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 bg-white"
                  placeholder="Dein Alter"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Avatar wählen
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`text-3xl p-3 rounded-lg border transition-colors duration-200 ${
                        avatar === av
                          ? 'border-purple-500 bg-purple-600'
                          : 'border-gray-300 hover:border-purple-300 bg-white'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Jahrgang
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 bg-white"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const yearOption = new Date().getFullYear() - i;
                    return (
                      <option key={yearOption} value={yearOption}>
                        {yearOption}
                      </option>
                    );
                  })}
                </select>
              </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Klasse
                    </label>
                    <select
                      value={classLevel}
                      onChange={(e) =>
                        setClassLevel(parseInt(e.target.value) as 1 | 2 | 3 | 4)
                      }
                      required={userRole === 'child'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 bg-white"
                    >
                      <option value={1}>Klasse 1</option>
                      <option value={2}>Klasse 2</option>
                      <option value={3}>Klasse 3</option>
                      <option value={4}>Klasse 4</option>
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 bg-white"
              placeholder="deine@email.de"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 bg-white"
              placeholder="Dein Passwort"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full shadow-colored-lime"
            disabled={loading}
          >
            {loading ? 'Lädt...' : isLogin ? 'Anmelden' : 'Registrieren'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-purple-600 hover:text-purple-700 font-semibold text-sm transition-colors"
          >
            {isLogin
              ? 'Noch kein Konto? Registrieren'
              : 'Bereits registriert? Anmelden'}
          </button>
        </div>
      </Card>
    </div>
  );
}

