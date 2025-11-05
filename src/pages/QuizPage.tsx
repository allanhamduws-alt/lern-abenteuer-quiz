/**
 * Quiz-Seite
 * Hier werden die Quiz-Fragen angezeigt und beantwortet
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getRandomQuestions } from '../data/questions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Confetti } from '../components/ui/Confetti';
import { Stars } from '../components/ui/Stars';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
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
  const [quizStartTime, setQuizStartTime] = useState(Date.now());
  const [showConfetti, setShowConfetti] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoNextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pointsAnimationRef = useRef<NodeJS.Timeout | null>(null);

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
    setShowConfetti(false);
    setShowStars(false);
    setAnimatedPoints(0);
    const now = Date.now();
    setQuizStartTime(now);
    setQuestionStartTime(now); // Startzeit für erste Frage setzen
  }, [classLevel, subject]);

  const currentQuestion = questions[currentQuestionIndex];
  const resultsRef = useRef(results);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const questionsRef = useRef(questions);
  const quizStartTimeRef = useRef(quizStartTime);

  // Aktualisiere Refs wenn sich Werte ändern
  useEffect(() => {
    resultsRef.current = results;
    currentQuestionIndexRef.current = currentQuestionIndex;
    questionsRef.current = questions;
    quizStartTimeRef.current = quizStartTime;
  }, [results, currentQuestionIndex, questions, quizStartTime]);

  // Automatisch zur nächsten Frage nach 2-3 Sekunden
  useEffect(() => {
    if (showResult && selectedAnswer !== null && currentQuestion && questions.length > 0) {
      // Alten Timeout löschen falls vorhanden
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
      }

      // Neue Frage nach 2.5 Sekunden
      autoNextTimeoutRef.current = setTimeout(() => {
        const currentIdx = currentQuestionIndexRef.current;
        const currentQuestions = questionsRef.current;
        const currentResults = resultsRef.current;

        if (currentIdx < currentQuestions.length - 1) {
          // Zur nächsten Frage mit Transition
          setIsTransitioning(true);
          setTimeout(() => {
            setCurrentQuestionIndex(currentIdx + 1);
            setSelectedAnswer(null);
            setShowResult(false);
            setQuestionStartTime(Date.now());
            setIsTransitioning(false);
          }, 300);
        } else {
          // Quiz beendet
          const totalPoints = currentResults.reduce(
            (sum, r) => sum + r.points,
            0
          );
          // Berechne Quiz-Dauer (Gesamtzeit)
          const quizDurationSeconds = Math.round((Date.now() - quizStartTimeRef.current) / 1000);
      
      navigate('/results', {
        state: {
          results: currentResults,
          totalPoints,
          questions: currentQuestions,
          subject: subject as Question['subject'],
          classLevel,
          quizDurationSeconds,
        },
      });
        }
      }, 2500);
    }

    // Cleanup beim Unmount oder wenn sich showResult ändert
    return () => {
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
      }
    };
  }, [showResult, selectedAnswer, navigate, subject, classLevel, currentQuestion, questions.length]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showResult && currentQuestion) {
      // Antwort direkt setzen
      setSelectedAnswer(answerIndex);
      // Ergebnis sofort anzeigen
      setShowResult(true);

      // Ergebnis sofort speichern
      const isCorrect = answerIndex === currentQuestion.correctAnswer;
      const points = isCorrect ? currentQuestion.points : 0;
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

      const newResult: QuizResult = {
        questionId: currentQuestion.id,
        selectedAnswer: answerIndex,
        isCorrect,
        points,
        timeSpent,
      };

      const updatedResults = [...results, newResult];
      setResults(updatedResults);

      // Animationen bei richtiger Antwort
      if (isCorrect) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);

        // Punktzähler animieren
        const currentPoints = results.reduce((sum, r) => sum + r.points, 0);
        const newTotalPoints = currentPoints + points;
        animatePoints(currentPoints, newTotalPoints);
      }

      // Prüfe ob 100% erreicht wurde (alle Fragen richtig beantwortet)
      const totalCorrect = updatedResults.filter((r) => r.isCorrect).length;
      const totalQuestions = updatedResults.length;
      if (totalCorrect === totalQuestions && totalQuestions === questions.length) {
        // Verzögere Sterne-Animation bis nach Konfetti
        setTimeout(() => {
          setShowStars(true);
          setTimeout(() => setShowStars(false), 2000);
        }, 500);
      }
    }
  };

  // Animiert den Punktzähler hochzählen
  const animatePoints = (start: number, end: number) => {
    if (pointsAnimationRef.current) {
      clearInterval(pointsAnimationRef.current);
    }

    const duration = 400; // 400ms
    const steps = 20;
    const stepTime = duration / steps;
    const stepValue = (end - start) / steps;
    let current = start;

    pointsAnimationRef.current = setInterval(() => {
      current += stepValue;
      if (current >= end) {
        setAnimatedPoints(end);
        if (pointsAnimationRef.current) {
          clearInterval(pointsAnimationRef.current);
        }
      } else {
        setAnimatedPoints(Math.floor(current));
      }
    }, stepTime);
  };

  // Aktualisiere animierte Punkte wenn sich Results ändern
  useEffect(() => {
    const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
    if (totalPoints !== animatedPoints && !showResult) {
      setAnimatedPoints(totalPoints);
    }
  }, [results, animatedPoints, showResult]);

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
          <LoadingSpinner text="Lade Fragen..." />
        </Card>
      </div>
    );
  }

  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Header />
      <Confetti show={showConfetti} />
      <Stars show={showStars} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Fortschrittsbalken */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Frage {currentQuestionIndex + 1} von {questions.length}
              </span>
              <span
                key={animatedPoints}
                className="font-bold text-primary-600 animate-count-up inline-block"
              >
                {animatedPoints} Punkte
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 ease-out shadow-md animate-pulse-glow"
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>
          </div>

          {/* Frage-Karte */}
          <Card className={`mb-6 ${isTransitioning ? 'opacity-0' : 'opacity-100 animate-slide-in'} transition-opacity duration-300`}>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                  className={`w-full p-4 rounded-lg text-left transition-all duration-300 ${
                    showResult
                      ? index === currentQuestion.correctAnswer
                        ? 'bg-success-500 text-white shadow-lg scale-105'
                        : selectedAnswer === index && selectedAnswer !== currentQuestion.correctAnswer
                        ? 'bg-error-500 text-white'
                        : 'bg-gray-100 text-gray-700 opacity-60'
                      : selectedAnswer === index
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md hover:scale-[1.02]'
                  }`}
                >
                  <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>

            {showResult && selectedAnswer !== null && (
              <div className="mt-6 animate-fade-in">
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    selectedAnswer === currentQuestion.correctAnswer
                      ? 'bg-success-50 text-success-800 border-2 border-success-300'
                      : 'bg-error-50 text-error-800 border-2 border-error-300'
                  }`}
                >
                  {selectedAnswer === currentQuestion.correctAnswer ? (
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎉</div>
                      <div className="text-xl font-bold">Richtig! Sehr gut gemacht!</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xl font-bold mb-2">💪 Fast richtig!</div>
                      <div className="mb-3">
                        Die richtige Antwort ist: <strong>{currentQuestion.options[currentQuestion.correctAnswer]}</strong>
                      </div>
                      {currentQuestion.explanation && (
                        <div className="bg-white bg-opacity-50 rounded-lg p-3 mt-3 border-l-4 border-primary-400">
                          <div className="text-sm font-semibold text-gray-700 mb-1">
                            💡 So funktioniert es:
                          </div>
                          <div className="text-sm text-gray-700">
                            {currentQuestion.explanation}
                          </div>
                        </div>
                      )}
                      <div className="text-sm mt-3 opacity-80">
                        Weiter geht's automatisch in Kürze...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

