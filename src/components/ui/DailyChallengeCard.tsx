/**
 * Daily Challenge Komponente
 * Zeigt die tägliche Challenge mit Fortschritt an
 */

import { Card } from './Card';
import type { DailyChallenge } from '../../types';

interface DailyChallengeCardProps {
  challenge: DailyChallenge;
  className?: string;
}

export function DailyChallengeCard({ challenge, className = '' }: DailyChallengeCardProps) {
  const progressPercentage = Math.min((challenge.progress / challenge.target) * 100, 100);
  const isCompleted = challenge.completed;

  return (
    <Card className={`bg-gradient-to-br from-yellow-100 to-orange-100 border-2 ${isCompleted ? 'border-green-400' : 'border-yellow-400'} shadow-large ${className}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="text-4xl flex-shrink-0">
          {isCompleted ? '🎉' : '🎯'}
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-gray-800">
              Tägliche Challenge
            </h3>
            {isCompleted && (
              <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                Erfüllt!
              </span>
            )}
          </div>
          
          <p className="text-gray-700 mb-4 font-semibold">
            {challenge.description}
          </p>
          
          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm font-bold mb-1">
              <span className="text-gray-700">
                Fortschritt: {challenge.progress} / {challenge.target}
              </span>
              <span className="text-orange-600">
                +{challenge.bonusPoints} Bonus-Punkte
              </span>
            </div>
            <div className="w-full bg-white/60 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-yellow-400 to-orange-400'
                } shadow-colored-lime`}
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>
          </div>
          
          {/* Completion Message */}
          {isCompleted && (
            <div className="mt-3 p-3 bg-green-200 rounded-lg border-2 border-green-400 animate-fade-in">
              <p className="text-green-800 font-bold text-sm text-center">
                🎊 Großartig! Du hast die tägliche Challenge geschafft! 🎊
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

