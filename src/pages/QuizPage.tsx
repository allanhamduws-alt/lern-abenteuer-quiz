/**
 * Quiz-Seite
 * Hier werden die Quiz-Fragen angezeigt und beantwortet
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAdaptiveQuestions } from '../data/questions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Confetti } from '../components/ui/Confetti';
import { Stars } from '../components/ui/Stars';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StoryCard } from '../components/story/StoryCard';
import { InputQuestion } from '../components/quiz/InputQuestion';
import { DragDropQuestion } from '../components/quiz/DragDropQuestion';
import { HelpButton } from '../components/quiz/HelpButton';
import type { Question, QuizResult } from '../types';

export function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classLevel = parseInt(searchParams.get('class') || '1') as 1 | 2 | 3 | 4;
  const subject = searchParams.get('subject') || 'mathematik';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | string[] | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [quizStartTime, setQuizStartTime] = useState(Date.now());
  const [showConfetti, setShowConfetti] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pointsAnimationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Fragen laden - adaptive Auswahl für bessere Anpassung
    const recentResults = results.map(r => ({ isCorrect: r.isCorrect }));
    const quizQuestions = getAdaptiveQuestions(
      classLevel,
      subject as Question['subject'],
      8,
      recentResults
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

  // Navigation zur nächsten Frage (manuell per Pfeil)
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setQuestionStartTime(Date.now());
        setIsTransitioning(false);
      }, 300);
    } else {
      // Quiz beendet
      const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
      const quizDurationSeconds = Math.round((Date.now() - quizStartTime) / 1000);
      
      navigate('/results', {
        state: {
          results,
          totalPoints,
          questions,
          subject: subject as Question['subject'],
          classLevel,
          quizDurationSeconds,
        },
      });
    }
  };

  // Navigation zur vorherigen Frage
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        // Lade gespeicherte Antwort für diese Frage
        const prevResult = results.find((r) => r.questionId === questions[currentQuestionIndex - 1].id);
        setSelectedAnswer(prevResult?.selectedAnswer || null);
        setShowResult(prevResult !== undefined);
        setIsTransitioning(false);
      }, 300);
    }
  };

  // Universelle Antwort-Handler-Funktion
  const handleAnswer = (answer: number | string | string[]) => {
    if (!showResult && currentQuestion) {
      // Antwort direkt setzen
      setSelectedAnswer(answer);
      // Ergebnis sofort anzeigen
      setShowResult(true);

      // Ergebnis prüfen basierend auf Fragetyp
      let isCorrect = false;
      if (currentQuestion.type === 'input' || typeof currentQuestion.correctAnswer === 'string') {
        // String-Vergleich für Input-Fragen
        isCorrect = String(answer).toLowerCase().trim() === String(currentQuestion.correctAnswer).toLowerCase().trim();
      } else if (currentQuestion.type === 'drag-drop' || Array.isArray(answer)) {
        // Array-Vergleich für Drag & Drop
        isCorrect = JSON.stringify(answer) === JSON.stringify(currentQuestion.correctAnswer);
      } else {
        // Number-Vergleich für Multiple-Choice
        isCorrect = answer === currentQuestion.correctAnswer;
      }

      const points = isCorrect 
        ? (currentQuestion.isBonus 
            ? Math.round(currentQuestion.points * (currentQuestion.bonusMultiplier || 1.5))
            : currentQuestion.points)
        : 0;
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

      const newResult: QuizResult = {
        questionId: currentQuestion.id,
        selectedAnswer: Array.isArray(answer) ? answer.join(',') : answer,
        isCorrect,
        points,
        timeSpent,
      };

      // Prüfe ob bereits ein Result für diese Frage existiert und überschreibe es
      const existingResultIndex = results.findIndex((r) => r.questionId === currentQuestion.id);
      let updatedResults: QuizResult[];
      if (existingResultIndex >= 0) {
        updatedResults = [...results];
        updatedResults[existingResultIndex] = newResult;
      } else {
        updatedResults = [...results, newResult];
      }
      setResults(updatedResults);

      // Punktzähler animieren
      const currentPoints = results.reduce((sum, r) => sum + r.points, 0);
      const newTotalPoints = updatedResults.reduce((sum, r) => sum + r.points, 0);
      animatePoints(currentPoints, newTotalPoints);

      // Konfetti nur bei größeren Erfolgen, nicht bei jeder richtigen Antwort
      const pointMilestones = [50, 100, 200, 500, 1000];
      const crossedMilestone = pointMilestones.some(
        (milestone) => currentPoints < milestone && newTotalPoints >= milestone
      );

      // Prüfe ob 100% erreicht wurde (alle Fragen richtig beantwortet)
      const totalCorrect = updatedResults.filter((r) => r.isCorrect).length;
      const totalQuestions = updatedResults.length;
      const isPerfectQuiz = totalCorrect === totalQuestions && totalQuestions === questions.length;

      // Konfetti nur bei Milestones oder perfektem Quiz
      if (isCorrect && (crossedMilestone || isPerfectQuiz)) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }

      // Sterne bei perfektem Quiz
      if (isPerfectQuiz) {
        setTimeout(() => {
          setShowStars(true);
          setTimeout(() => setShowStars(false), 2000);
        }, 500);
      }
    }
  };

  // Handler für Multiple-Choice (rückwärtskompatibel)
  const handleAnswerSelect = (answerIndex: number) => {
    handleAnswer(answerIndex);
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
              <span
                key={animatedPoints}
                className="font-bold text-primary-600 animate-count-up inline-block"
              >
                {animatedPoints} Punkte
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 ease-out shadow-md"
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>
          </div>

          {/* Frage-Karte */}
          <Card className={`mb-6 ${isTransitioning ? 'opacity-0' : 'opacity-100 animate-slide-in'} transition-opacity duration-300`}>
            {/* Story-Card anzeigen, falls vorhanden */}
            <StoryCard
              character={currentQuestion.character}
              storyText={currentQuestion.storyText}
              world={currentQuestion.world}
            />
            
            {/* Bonus-Aufgabe Badge */}
            {currentQuestion.isBonus && (
              <div className="mb-4 flex items-center gap-2 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 animate-fade-in">
                <span className="text-2xl">⭐</span>
                <div>
                  <span className="font-bold text-yellow-700">Bonus-Aufgabe!</span>
                  <span className="text-sm text-yellow-600 ml-2">Mehr Punkte wenn richtig!</span>
                </div>
              </div>
            )}
            
            {/* Frage mit Hilfe-Button */}
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800 flex-1">
                {currentQuestion.question}
              </h2>
              {!showResult && (
                <div className="ml-4">
                  <HelpButton question={currentQuestion} />
                </div>
              )}
            </div>

            {/* Rendere verschiedene Fragetypen */}
            {currentQuestion.type === 'input' ? (
              <InputQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswer(answer)}
                showResult={showResult}
                selectedAnswer={typeof selectedAnswer === 'string' ? selectedAnswer : null}
              />
            ) : currentQuestion.type === 'drag-drop' ? (
              <DragDropQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswer(answer)}
                showResult={showResult}
                selectedAnswer={Array.isArray(selectedAnswer) ? selectedAnswer : null}
              />
            ) : (
              /* Multiple-Choice (Standard) */
              <>
                <div className="space-y-3">
                  {(currentQuestion.options || []).map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrectAnswer = index === currentQuestion.correctAnswer;
                    const isWrong = isSelected && !isCorrectAnswer;
                    
                    // Bestimme die Button-Farbe basierend auf dem Ergebnis
                    let buttonClasses = 'w-full p-4 rounded-lg text-left transition-all duration-300 ';
                    
                    if (showResult) {
                      if (isCorrectAnswer) {
                        // Richtige Antwort: GRÜN
                        buttonClasses += 'bg-green-500 text-white shadow-lg scale-105 font-semibold';
                      } else if (isWrong) {
                        // Falsche ausgewählte Antwort: ROT
                        buttonClasses += 'bg-red-500 text-white font-semibold';
                      } else {
                        // Andere Optionen: Grau ausgegraut
                        buttonClasses += 'bg-gray-200 text-gray-600 opacity-70';
                      }
                    } else {
                      // Nicht beantwortet: Standard grau mit besserem Kontrast
                      buttonClasses += 'bg-gray-200 text-gray-800 hover:bg-gray-300 hover:shadow-md hover:scale-[1.02] border border-gray-300';
                    }
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={showResult}
                        className={buttonClasses}
                      >
                        <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </button>
                    );
                  })}
                </div>

                {/* Erfolgs-Box nur bei falschen Antworten (für Erklärung) */}
                {showResult && selectedAnswer !== null && typeof selectedAnswer === 'number' && 
                 selectedAnswer !== currentQuestion.correctAnswer && (
                  <div className="mt-6 animate-fade-in">
                    <div className="p-4 rounded-lg mb-4 bg-error-50 text-error-800 border-2 border-error-300">
                      <div className="text-xl font-bold mb-2">💪 Fast richtig!</div>
                      <div className="mb-3">
                        Die richtige Antwort ist: <strong>{currentQuestion.options?.[currentQuestion.correctAnswer as number]}</strong>
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
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Navigation-Pfeile unten */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-primary-100 text-primary-700 hover:bg-primary-200 shadow-md hover:shadow-lg'
                }`}
                title="Zurück zur vorherigen Frage"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-sm text-gray-600 font-semibold">
                Frage {currentQuestionIndex + 1} von {questions.length}
              </div>
              
              <button
                onClick={handleNextQuestion}
                disabled={!showResult}
                className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 flex items-center gap-2 ${
                  !showResult
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                    : currentQuestionIndex === questions.length - 1
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
                    : 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
                }`}
                title={currentQuestionIndex === questions.length - 1 ? "Zur Auswertung" : "Zur nächsten Frage"}
              >
                <span className="text-base">
                  {currentQuestionIndex === questions.length - 1 ? 'Auswertung' : 'Weiter'}
                </span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

