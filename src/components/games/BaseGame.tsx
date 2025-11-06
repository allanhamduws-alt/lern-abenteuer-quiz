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
 * Spielerischer Stil: Bunte Gradienten, animierte Überschriften
 */
export function BaseGame({
  title,
  description,
  children,
  onExit,
  showExitButton = true,
}: BaseGameWrapperProps) {
  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">{title}</h1>
          {description && (
            <p className="text-lg text-gray-700 font-medium">{description}</p>
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

