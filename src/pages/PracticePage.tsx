/**
 * Übungs-Seite für schwierige Aufgaben
 * Spielerischer Stil: Bunte Gradienten, animierte Karten, motivierendes Design
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import {
  loadProgress,
  getAllDifficultQuestions,
  markQuestionAsMastered,
} from '../services/progress';
import { questions } from '../data/questions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { User, Progress, Question } from '../types';

export function PracticePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const practiceMode = searchParams.get('mode') === 'quiz'; // Quiz-Modus oder Übersicht
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    getCurrentUser().then(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userProgress = await loadProgress(currentUser.uid);
        setProgress(userProgress);

        if (practiceMode) {
          // Quiz-Modus: Lade schwierige Fragen als Quiz
          const difficultQIds = getAllDifficultQuestions(userProgress)
            .slice(0, 5)
            .map((dq) => dq.questionId);
          const practiceQ = questions.filter((q) =>
            difficultQIds.includes(q.id)
          );
          setPracticeQuestions(practiceQ);
        }
      }
    });
  }, [practiceMode]);

  const difficultQuestions = progress
    ? getAllDifficultQuestions(progress)
    : [];

  // Finde Fragen nach ID
  const getQuestionById = (questionId: string): Question | undefined => {
    return questions.find((q) => q.id === questionId);
  };

  const handleStartPractice = () => {
    navigate('/practice?mode=quiz');
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showResult) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleNextQuestion = async () => {
    if (selectedAnswer === null || !user) return;

    const currentQuestion = practiceQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    if (isCorrect && user) {
      // Frage als gemeistert markieren
      try {
        await markQuestionAsMastered(user.uid, currentQuestion.id);
        // Progress neu laden
        const updatedProgress = await loadProgress(user.uid);
        setProgress(updatedProgress);
      } catch (error) {
        console.error('Fehler beim Markieren als gemeistert:', error);
      }
    }

    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Übung beendet
      navigate('/practice');
    }
  };

  // Quiz-Modus
  if (practiceMode && practiceQuestions.length > 0) {
    const currentQuestion = practiceQuestions[currentQuestionIndex];
    if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card>
          <LoadingSpinner text="Lade Fragen..." />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Fortschrittsbalken */}
          <div className="mb-6">
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span className="text-gray-700">
                Übungsfrage {currentQuestionIndex + 1} von{' '}
                {practiceQuestions.length}
              </span>
              <Badge variant="warning" className="bg-gradient-warning text-gray-800 shadow-lg">💪 Übung</Badge>
            </div>
            <div className="w-full bg-white/60 rounded-full h-5 shadow-inner">
              <div
                className="bg-gradient-warning h-5 rounded-full transition-all duration-300 shadow-colored-lime"
                style={{
                  width: `${
                    ((currentQuestionIndex + 1) / practiceQuestions.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Frage-Karte */}
          <Card className="mb-6 animate-slide-in">
            <div className="mb-4">
              <Badge variant="warning" size="lg" className="bg-gradient-to-r from-orange-300 to-yellow-300 text-orange-900 border-orange-500 shadow-colored-lime">
                💪 Diese Aufgabe hast du vorher falsch beantwortet
              </Badge>
            </div>
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              {currentQuestion.question}
            </h2>

              <div className="space-y-3">
                {currentQuestion.options && currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showResult}
                    className={`w-full p-5 rounded-xl text-left transition-all duration-300 transform font-semibold text-lg ${
                      selectedAnswer === index
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-colored-purple scale-105'
                        : 'bg-gradient-card text-gray-800 hover:bg-white hover:shadow-large hover:scale-[1.02] border-2 border-gray-200'
                    } ${
                      showResult &&
                      index === currentQuestion.correctAnswer
                        ? 'bg-gradient-success text-white shadow-colored-lime scale-105 animate-bounce'
                        : ''
                    } ${
                      showResult &&
                      selectedAnswer === index &&
                      selectedAnswer !== currentQuestion.correctAnswer
                        ? 'bg-gradient-danger text-white shadow-lg'
                        : ''
                    }`}
                  >
                    <span className="font-bold mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              {selectedAnswer !== null && (
                <div className="mt-6">
                  {showResult ? (
                    <div
                      className={`p-5 rounded-xl mb-4 animate-fade-in ${
                        selectedAnswer === currentQuestion.correctAnswer
                          ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-900 border-2 border-green-400 shadow-medium'
                          : 'bg-gradient-to-r from-red-200 to-orange-200 text-red-900 border-2 border-red-400 shadow-medium'
                      }`}
                    >
                      {selectedAnswer === currentQuestion.correctAnswer ? (
                        <>
                          <div className="text-3xl mb-2 font-bold">🎉 Super!</div>
                          <div className="text-lg">
                            Du hast es geschafft! Diese Aufgabe hast du jetzt
                            gemeistert!
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-3xl mb-2 font-bold">💪 Nicht aufgeben!</div>
                          <div className="text-lg">
                            Die richtige Antwort ist:{' '}
                            {currentQuestion.options && 
                              typeof currentQuestion.correctAnswer === 'number' &&
                              currentQuestion.options[currentQuestion.correctAnswer]}
                            . Versuche es beim nächsten Mal nochmal!
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setShowResult(true)}
                      className="w-full"
                    >
                      Antwort prüfen
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {showResult && (
              <div className="text-center">
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleNextQuestion}
                  className="text-xl px-12 py-6 shadow-colored-lime"
                >
                  {currentQuestionIndex < practiceQuestions.length - 1
                    ? 'Nächste Übung →'
                    : 'Zurück zur Übersicht'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Übersichts-Modus
  return (
    <div className="min-h-screen bg-gradient-background">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Schwierige Aufgaben üben
            </h2>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              ← Zurück
            </Button>
          </div>

          {difficultQuestions.length === 0 ? (
            <Card className="text-center py-12 bg-gradient-to-br from-green-200 to-emerald-200 border-green-400 shadow-large animate-fade-in">
              <div className="text-7xl mb-4 animate-bounce">🎉</div>
              <h3 className="text-3xl font-bold mb-2 text-green-900">
                Super gemacht!
              </h3>
              <p className="text-green-800 mb-6 text-lg">
                Du hast aktuell keine schwierigen Aufgaben zu üben. Alle Aufgaben
                sind gemeistert!
              </p>
              <Button variant="primary" onClick={() => navigate('/dashboard')}>
                Zurück zur Startseite
              </Button>
            </Card>
          ) : (
            <>
              <Card className="mb-6 bg-gradient-to-r from-yellow-300 to-orange-300 border-2 border-yellow-500 shadow-large animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-yellow-900 mb-1">
                      Bereit zum Üben?
                    </h3>
                    <p className="text-yellow-800 text-lg">
                      Du hast {difficultQuestions.length} Aufgabe{difficultQuestions.length !== 1 ? 'n' : ''}, die
                      du noch üben kannst. Übe diese Aufgaben, um sie zu
                      meistern!
                    </p>
                  </div>
                  <Button variant="warning" onClick={handleStartPractice} className="shadow-colored-lime">
                    Jetzt üben →
                  </Button>
                </div>
              </Card>

              <Card>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                  Deine schwierigen Aufgaben
                </h3>
                <div className="space-y-3">
                  {difficultQuestions.map((difficultQ) => {
                    const question = getQuestionById(difficultQ.questionId);
                    if (!question) return null;

                    return (
                      <Card
                        key={difficultQ.questionId}
                        className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-100 to-orange-100 shadow-medium transform hover:scale-[1.01] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="warning" className="bg-gradient-warning text-gray-800 shadow-lg">
                                {difficultQ.attempts}x versucht
                              </Badge>
                              {difficultQ.nextReview && (
                                <Badge variant="info" size="sm" className="bg-gradient-secondary text-white">
                                  Wiederholung geplant
                                </Badge>
                              )}
                            </div>
                            <div className="font-bold text-gray-800 mb-1 text-lg">
                              {question.question}
                            </div>
                            <div className="text-xs text-gray-600">
                              Zuletzt geübt:{' '}
                              {new Date(
                                difficultQ.lastAttempt
                              ).toLocaleDateString('de-DE')}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

