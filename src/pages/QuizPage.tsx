/**
 * Quiz-Seite
 * Hier werden die Quiz-Fragen angezeigt und beantwortet
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getRandomQuestions } from '../data/questions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import type { Question, QuizResult } from '../types';

export function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classLevel = parseInt(searchParams.get('class') || '1') as 1 | 2 | 3 | 4;
  const subject = searchParams.get('subject') || 'mathematik';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    // Fragen laden - jetzt 8 Fragen statt 5
    const quizQuestions = getRandomQuestions(
      classLevel,
      subject as Question['subject'],
      8
    );
    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0); // Reset auf erste Frage
    setSelectedAnswer(null);
    setShowResult(false);
    setResults([]);
    setQuestionStartTime(Date.now()); // Startzeit für erste Frage setzen
  }, [classLevel, subject]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showResult) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const points = isCorrect ? currentQuestion.points : 0;
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000); // Sekunden

    const newResult: QuizResult = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
      points,
      timeSpent,
    };

    const updatedResults = [...results, newResult];

    if (currentQuestionIndex < questions.length - 1) {
      setResults(updatedResults);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuestionStartTime(Date.now()); // Neue Frage startet
    } else {
      // Quiz beendet
      const totalPoints = updatedResults.reduce(
        (sum, r) => sum + r.points,
        0
      );
      navigate('/results', {
        state: {
          results: updatedResults,
          totalPoints,
          questions: questions, // Fragen auch weitergeben für Progress-Update
          subject: subject as Question['subject'],
          classLevel,
        },
      });
    }
  };

  // Prüfe ob Fragen gefunden wurden
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Card className="text-center">
              <div className="text-6xl mb-4">😔</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Keine Fragen gefunden
              </h2>
              <p className="text-gray-600 mb-6">
                Für das Fach "{subject}" in Klasse {classLevel} wurden keine Fragen gefunden.
                <br />
                Bitte wähle ein anderes Fach aus oder füge Fragen hinzu.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/home')}
              >
                Zurück zur Startseite
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Fortschrittsbalken */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Frage {currentQuestionIndex + 1} von {questions.length}
              </span>
              <span>
                {results.reduce((sum, r) => sum + r.points, 0)} Punkte
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Frage-Karte */}
          <Card className="mb-6">
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
                  <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
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
                    {selectedAnswer === currentQuestion.correctAnswer
                      ? '🎉 Richtig! Sehr gut gemacht!'
                      : `💪 Nicht aufgeben! Die richtige Antwort ist: ${
                          currentQuestion.options[currentQuestion.correctAnswer]
                        } - Du kannst es beim nächsten Mal schaffen!`}
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
                {currentQuestionIndex < questions.length - 1
                  ? 'Nächste Frage →'
                  : 'Ergebnis anzeigen 🎯'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

