/**
 * Übungs-Seite für schwierige Aufgaben
 * Zeigt Aufgaben, die das Kind noch üben sollte
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
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
          <Card>
            <p className="text-xl">Lade Fragen...</p>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
        <Header user={user || undefined} />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {/* Fortschrittsbalken */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  Übungsfrage {currentQuestionIndex + 1} von{' '}
                  {practiceQuestions.length}
                </span>
                <Badge variant="warning">💪 Übung</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-warning-500 h-3 rounded-full transition-all duration-300"
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
            <Card className="mb-6">
              <div className="mb-4">
                <Badge variant="warning" size="lg">
                  💪 Diese Aufgabe hast du vorher falsch beantwortet
                </Badge>
              </div>
              <h2 className="text-3xl font-bold mb-6 text-gray-800">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      selectedAnswer === index
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${
                      showResult &&
                      index === currentQuestion.correctAnswer
                        ? 'bg-success-500 text-white'
                        : ''
                    } ${
                      showResult &&
                      selectedAnswer === index &&
                      selectedAnswer !== currentQuestion.correctAnswer
                        ? 'bg-error-500 text-white'
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
                      className={`p-4 rounded-lg mb-4 ${
                        selectedAnswer === currentQuestion.correctAnswer
                          ? 'bg-success-50 text-success-800'
                          : 'bg-error-50 text-error-800'
                      }`}
                    >
                      {selectedAnswer === currentQuestion.correctAnswer ? (
                        <>
                          <div className="text-2xl mb-2">🎉 Super!</div>
                          <div>
                            Du hast es geschafft! Diese Aufgabe hast du jetzt
                            gemeistert!
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl mb-2">💪 Nicht aufgeben!</div>
                          <div>
                            Die richtige Antwort ist:{' '}
                            {
                              currentQuestion.options[
                                currentQuestion.correctAnswer
                              ]
                            }
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
                  className="text-xl px-12 py-6"
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold text-gray-800">
              💪 Schwierige Aufgaben üben
            </h2>
            <Button variant="secondary" onClick={() => navigate('/home')}>
              ← Zurück
            </Button>
          </div>

          {difficultQuestions.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold mb-2 text-gray-800">
                Super gemacht!
              </h3>
              <p className="text-gray-600 mb-6">
                Du hast aktuell keine schwierigen Aufgaben zu üben. Alle Aufgaben
                sind gemeistert!
              </p>
              <Button variant="primary" onClick={() => navigate('/home')}>
                Zurück zur Startseite
              </Button>
            </Card>
          ) : (
            <>
              <Card className="mb-6 bg-warning-50 border-2 border-warning-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      Bereit zum Üben?
                    </h3>
                    <p className="text-gray-600">
                      Du hast {difficultQuestions.length} Aufgabe{difficultQuestions.length !== 1 ? 'n' : ''}, die
                      du noch üben kannst. Übe diese Aufgaben, um sie zu
                      meistern!
                    </p>
                  </div>
                  <Button variant="warning" onClick={handleStartPractice}>
                    Jetzt üben →
                  </Button>
                </div>
              </Card>

              <Card>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  Deine schwierigen Aufgaben
                </h3>
                <div className="space-y-3">
                  {difficultQuestions.map((difficultQ) => {
                    const question = getQuestionById(difficultQ.questionId);
                    if (!question) return null;

                    return (
                      <div
                        key={difficultQ.questionId}
                        className="border-2 border-warning-200 rounded-lg p-4 bg-warning-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="warning">
                                {difficultQ.attempts}x versucht
                              </Badge>
                              {difficultQ.nextReview && (
                                <Badge variant="info" size="sm">
                                  Wiederholung geplant
                                </Badge>
                              )}
                            </div>
                            <div className="font-semibold text-gray-800 mb-1">
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
                      </div>
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

