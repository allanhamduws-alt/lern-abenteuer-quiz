/**
 * BaseGame-Komponente
 * Basis-Interface für alle Mini-Spiele
 * Stellt gemeinsame UI-Struktur und Callbacks bereit
 */

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Header } from '../ui/Header';

interface BaseGameWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  showExitButton?: boolean;
  onExit: () => void;
}

/**
 * BaseGame-Wrapper für alle Mini-Spiele
 * Stellt gemeinsame UI-Struktur bereit
 */
export function BaseGame({
  title,
  description,
  children,
  onExit,
  showExitButton = true,
}: BaseGameWrapperProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary-900 mb-2">{title}</h1>
          {description && (
            <p className="text-lg text-primary-700">{description}</p>
          )}
        </div>

        {showExitButton && (
          <div className="mb-4 flex justify-end">
            <Button variant="secondary" onClick={onExit}>
              Zurück
            </Button>
          </div>
        )}

        <Card className="p-6">{children}</Card>
      </div>
    </div>
  );
}

