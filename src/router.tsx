/**
 * Router-Konfiguration
 * Definiert alle Routen der App
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { ResultsPage } from './pages/ResultsPage';
import { ProgressPage } from './pages/ProgressPage';
import { PracticePage } from './pages/PracticePage';
import { GamePage } from './pages/GamePage';
import { GamesPage } from './pages/GamesPage';
import { ProfilePage } from './pages/ProfilePage';
import { ParentDashboardPage } from './pages/ParentDashboardPage';
import { AdminPage } from './pages/AdminPage';
import { ParentSettingsPage } from './pages/ParentSettingsPage';
import { LinkParentPage } from './pages/LinkParentPage';
import { LearnPage } from './pages/LearnPage';
import { onAuthChange } from './services/auth';
import { useState, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';

// Protected Route Komponente
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user: FirebaseUser | null) => {
      setIsAuthenticated(!!user);
    });

    return unsubscribe;
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-gray-700">Lädt...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Router erstellen
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/learn',
    element: (
      <ProtectedRoute>
        <LearnPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/play',
    element: (
      <ProtectedRoute>
        <GamesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/quiz',
    element: (
      <ProtectedRoute>
        <QuizPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/results',
    element: (
      <ProtectedRoute>
        <ResultsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/progress',
    element: (
      <ProtectedRoute>
        <ProgressPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/practice',
    element: (
      <ProtectedRoute>
        <PracticePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/game',
    element: (
      <ProtectedRoute>
        <GamePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/parent-dashboard',
    element: (
      <ProtectedRoute>
        <ParentDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <ParentSettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/link-parent',
    element: (
      <ProtectedRoute>
        <LinkParentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/home',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
]);

