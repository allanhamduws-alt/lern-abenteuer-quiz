/**
 * Quiz-Seite
 * Spielerischer Stil: Bunte Gradienten, größere Karten, verbesserte Feedback-Animationen
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
import { InputQuestion } from '../components/quiz/InputQuestion';
import { DragDropQuestion } from '../components/quiz/DragDropQuestion';
import { FillBlankQuestion } from '../components/quiz/FillBlankQuestion';
import { WordClassificationQuestion } from '../components/quiz/WordClassificationQuestion';
import { NumberInputQuestion } from '../components/quiz/NumberInputQuestion';
import { NumberPyramidQuestion } from '../components/quiz/NumberPyramidQuestion';
import { WordProblemQuestion } from '../components/quiz/WordProblemQuestion';
import { TextInputQuestion } from '../components/quiz/TextInputQuestion';
import { SentenceBuilderQuestion } from '../components/quiz/SentenceBuilderQuestion';
import { TableFillQuestion } from '../components/quiz/TableFillQuestion';
import { HelpButton } from '../components/quiz/HelpButton';
import { CharacterMascot } from '../components/CharacterMascot';
import { getCurrentUser } from '../services/auth';
import { loadProgress, calculateSkillLevel } from '../services/progress';
import { useMascot } from '../contexts/MascotContext';
import type { Question, QuizResult, Progress } from '../types';

export function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classLevel = parseInt(searchParams.get('class') || '1') as 1 | 2 | 3 | 4;
  const subject = searchParams.get('subject') || 'mathematik';
  const { onSuccess, onError } = useMascot();

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
  const [_lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const pointsAnimationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  // Helper: Deserialisiere Antwort basierend auf Fragetyp
  const deserializeAnswer = (question: Question, serialized: number | string | null): any => {
    if (serialized === null) return null;
    
    if (question.type === 'fill-blank' || question.type === 'number-input') {
      // Array: Komma-separiert
      if (typeof serialized === 'string' && serialized.includes(',')) {
        return serialized.split(',');
      }
      return [serialized];
    } else if (question.type === 'word-classification' || question.type === 'number-pyramid' || question.type === 'table-fill') {
      // Record: JSON string
      if (typeof serialized === 'string' && serialized.startsWith('{')) {
        try {
          return JSON.parse(serialized);
        } catch {
          return null;
        }
      }
      return null;
    } else if (question.type === 'word-problem' || question.type === 'input' || question.type === 'text-input') {
      // String
      return String(serialized);
    } else if (question.type === 'sentence-builder' || question.type === 'drag-drop') {
      // Array: Komma-separiert oder JSON
      if (typeof serialized === 'string') {
        if (serialized.startsWith('[')) {
          try {
            return JSON.parse(serialized);
          } catch {
            return serialized.split(',');
          }
        }
        return serialized.split(',');
      }
      return [];
    }
    
    // Default: Multiple-Choice (number)
    return serialized;
  };

  // Lade Progress beim Start für adaptive Fragen-Auswahl
  useEffect(() => {
    const loadUserProgress = async () => {
      try {
        setIsLoadingProgress(true);
        const user = await getCurrentUser();
        if (user) {
          const userProgress = await loadProgress(user.uid);
          setProgress(userProgress);
        }
      } catch (error) {
        console.error('Fehler beim Laden des Progress:', error);
      } finally {
        setIsLoadingProgress(false);
      }
    };
    
    loadUserProgress();
  }, []);

  // Lade gespeicherte Antwort beim Wechsel der Frage
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const currentQuestion = questions[currentQuestionIndex];
      const savedResult = results.find((r) => r.questionId === currentQuestion.id);
      if (savedResult) {
        const deserialized = deserializeAnswer(currentQuestion, savedResult.selectedAnswer);
        setSelectedAnswer(deserialized);
        setShowResult(true);
      } else {
        setSelectedAnswer(null);
        setShowResult(false);
      }
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, questions, results]);

  useEffect(() => {
    // Warte bis Progress geladen ist
    if (isLoadingProgress) {
      return;
    }

    // Berechne Skill-Level für das Fach
    let skillLevel: number | undefined = undefined;
    if (progress) {
      const subjectProgress = progress.subjects[subject as keyof typeof progress.subjects];
      if (subjectProgress) {
        // Berechne Skill-Level (oder verwende gespeichertes)
        skillLevel = subjectProgress.skillLevel !== undefined 
          ? subjectProgress.skillLevel 
          : calculateSkillLevel(subjectProgress);
      }
    }

    // Fragen laden - NEUER ADAPTIVER ALGORITHMUS basierend auf Skill-Level
    const recentResults = results.map(r => ({ isCorrect: r.isCorrect }));
    const quizQuestions = getAdaptiveQuestions(
      classLevel,
      subject as Question['subject'],
      8,
      skillLevel, // NEU: Skill-Level wird übergeben
      recentResults // Fallback falls kein Skill-Level verfügbar
    );
    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0); // Reset auf erste Frage
    setSelectedAnswer(null);
    setShowResult(false);
    setResults([]);
    setShowConfetti(false);
    setShowStars(false);
    setAnimatedPoints(0);
    setLastAnswerCorrect(null);
    const now = Date.now();
    setQuizStartTime(now);
    setQuestionStartTime(now); // Startzeit für erste Frage setzen
  }, [classLevel, subject, progress, isLoadingProgress]);

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
        setLastAnswerCorrect(null);
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
        const prevQuestion = questions[currentQuestionIndex - 1];
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        // Lade gespeicherte Antwort für diese Frage
        const prevResult = results.find((r) => r.questionId === prevQuestion.id);
        const deserialized = prevResult ? deserializeAnswer(prevQuestion, prevResult.selectedAnswer) : null;
        setSelectedAnswer(deserialized);
        setShowResult(prevResult !== undefined);
        setIsTransitioning(false);
      }, 300);
    }
  };

  // Universelle Antwort-Handler-Funktion
  const handleAnswer = (answer: number | string | string[] | Record<string, string>) => {
    if (!showResult && currentQuestion) {
      // Antwort direkt setzen
      setSelectedAnswer(answer as any);
      // Ergebnis sofort anzeigen
      setShowResult(true);

      // Ergebnis prüfen basierend auf Fragetyp
      let isCorrect = false;
      
      if (currentQuestion.type === 'fill-blank') {
        // fill-blank: Array von Antworten
        const blanks = currentQuestion.blanks || [];
        const answers = Array.isArray(answer) ? answer : [];
        isCorrect = answers.length === blanks.length && 
          answers.every((a, i) => {
            const correct = blanks[i];
            return currentQuestion.caseSensitive 
              ? a === correct
              : a.toLowerCase() === correct.toLowerCase();
          });
      } else if (currentQuestion.type === 'word-classification') {
        // word-classification: Record<string, string>
        const mapping = answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {};
        const correctMapping = currentQuestion.correctMapping || {};
        isCorrect = Object.keys(correctMapping).every(word => mapping[word] === correctMapping[word]);
      } else if (currentQuestion.type === 'number-input') {
        // number-input: Array von Antworten
        const problems = currentQuestion.problems || [];
        const answers = Array.isArray(answer) ? answer : [];
        isCorrect = problems.length === answers.length &&
          problems.every((p, i) => answers[i]?.trim() === p.answer);
      } else if (currentQuestion.type === 'number-pyramid') {
        // number-pyramid: Record<string, string> mit Koordinaten
        const values = answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {};
        const structure = currentQuestion.structure || [];
        // Prüfe ob alle Felder korrekt sind (vereinfacht - könnte komplexer sein)
        isCorrect = structure.every((row, r) =>
          row.every((cell, c) => {
            if (!cell.isBlank) return true;
            const key = `${r}-${c}`;
            const answerVal = values[key];
            if (!answerVal) return false;
            // Berechne erwarteten Wert
            if (r < structure.length - 1) {
              const leftBelow = structure[r + 1]?.[c];
              const rightBelow = structure[r + 1]?.[c + 1];
              if (leftBelow && rightBelow) {
                const leftVal = leftBelow.isBlank ? Number(values[`${r + 1}-${c}`]) : leftBelow.value;
                const rightVal = rightBelow.isBlank ? Number(values[`${r + 1}-${c + 1}`]) : rightBelow.value;
                if (leftVal !== null && rightVal !== null) {
                  return Number(answerVal) === leftVal + rightVal;
                }
              }
            }
            return true;
          })
        );
      } else if (currentQuestion.type === 'word-problem') {
        // word-problem: String
        const correctAnswer = currentQuestion.correctAnswer || '';
        isCorrect = String(answer).trim() === String(correctAnswer).trim();
      } else if (currentQuestion.type === 'input' || typeof currentQuestion.correctAnswer === 'string') {
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

      // Serialisiere Antwort für Storage
      let serializedAnswer: number | string;
      if (Array.isArray(answer)) {
        serializedAnswer = answer.join(',');
      } else if (answer && typeof answer === 'object') {
        serializedAnswer = JSON.stringify(answer);
      } else {
        serializedAnswer = answer as number | string;
      }

      const newResult: QuizResult = {
        questionId: currentQuestion.id,
        selectedAnswer: serializedAnswer,
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
      setLastAnswerCorrect(isCorrect);

      // Trigger Maskottchen Events basierend auf Antwort
      if (isCorrect) {
        onSuccess();
      } else {
        onError();
      }

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

  // WICHTIG: Zeige Loading während Progress geladen wird
  // Dies verhindert die kurze "Keine Fragen gefunden"-Meldung
  if (isLoadingProgress) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card>
          <LoadingSpinner text="Lade Quiz..." />
        </Card>
      </div>
    );
  }

  // Prüfe ob Fragen gefunden wurden (nur nach dem Laden)
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Card className="text-center">
              <div className="text-6xl mb-4">😔</div>
              <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
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
                onClick={() => navigate('/dashboard')}
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
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card>
          <LoadingSpinner text="Lade Fragen..." />
        </Card>
      </div>
    );
  }

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <Confetti show={showConfetti} />
      <Stars show={showStars} />

      {/* Maskottchen als fixed Begleiter */}
      <CharacterMascot position="bottom-right" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Fortschrittsbalken */}
          <div className="mb-6">
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span
                key={animatedPoints}
                className="font-bold text-lime-600 animate-count-up inline-block text-lg bg-white/60 px-3 py-1 rounded-xl shadow-soft"
              >
                ⭐ {animatedPoints} Punkte
              </span>
            </div>
            <div className="w-full bg-white/60 rounded-full h-6 overflow-hidden shadow-medium">
              <div
                className="bg-gradient-success h-6 rounded-full transition-all duration-500 ease-out shadow-colored-lime"
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>
          </div>

          {/* Frage-Karte */}
          <Card className={`mb-6 ${isTransitioning ? 'opacity-0' : 'opacity-100 animate-slide-in'} transition-opacity duration-300`}>
            {/* Bonus-Aufgabe Badge */}
            {currentQuestion.isBonus && (
              <div className="mb-4 flex items-center gap-2 bg-gradient-to-r from-yellow-300 to-yellow-400 border-2 border-yellow-500 rounded-xl p-4 animate-fade-in shadow-colored-lime">
                <span className="text-3xl">⭐</span>
                <div>
                  <span className="font-bold text-yellow-900 text-lg">Bonus-Aufgabe!</span>
                  <span className="text-sm text-yellow-800 ml-2 font-semibold">Mehr Punkte wenn richtig!</span>
                </div>
              </div>
            )}
            
            {/* Frage mit Hilfe-Button */}
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent flex-1">
                {currentQuestion.question}
              </h2>
              {!showResult && (
                <div className="ml-4">
                  <HelpButton question={currentQuestion} />
                </div>
              )}
            </div>

            {/* Rendere verschiedene Fragetypen */}
            {currentQuestion.type === 'fill-blank' ? (
              <FillBlankQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswer(answer)}
                showResult={showResult}
                selectedAnswer={Array.isArray(selectedAnswer) ? selectedAnswer : null}
              />
            ) : currentQuestion.type === 'word-classification' ? (
              <WordClassificationQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswer(answer)}
                showResult={showResult}
                selectedAnswer={selectedAnswer && typeof selectedAnswer === 'object' && !Array.isArray(selectedAnswer) ? selectedAnswer : null}
              />
            ) : currentQuestion.type === 'number-input' ? (
              <NumberInputQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswer(answer)}
                showResult={showResult}
                selectedAnswer={Array.isArray(selectedAnswer) ? selectedAnswer : null}
              />
            ) : currentQuestion.type === 'number-pyramid' ? (
              <NumberPyramidQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswer(answer)}
                showResult={showResult}
                selectedAnswer={selectedAnswer && typeof selectedAnswer === 'object' && !Array.isArray(selectedAnswer) ? selectedAnswer : null}
              />
            ) : currentQuestion.type === 'word-problem' ? (
              <WordProblemQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswer(answer)}
                showResult={showResult}
                selectedAnswer={typeof selectedAnswer === 'string' ? selectedAnswer : null}
              />
            ) : currentQuestion.type === 'input' ? (
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
            ) : currentQuestion.type === 'text-input' ? (
              <TextInputQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswer(answer)}
                showResult={showResult}
                selectedAnswer={typeof selectedAnswer === 'string' ? selectedAnswer : null}
              />
            ) : currentQuestion.type === 'sentence-builder' ? (
              <SentenceBuilderQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswer(answer)}
                showResult={showResult}
                selectedAnswer={Array.isArray(selectedAnswer) ? selectedAnswer : null}
              />
            ) : currentQuestion.type === 'table-fill' ? (
              <TableFillQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswer(answer)}
                showResult={showResult}
                selectedAnswer={selectedAnswer && typeof selectedAnswer === 'object' && !Array.isArray(selectedAnswer) ? selectedAnswer : null}
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
                    let buttonClasses = 'w-full p-5 rounded-xl text-left transition-all duration-300 transform font-semibold text-lg ';
                    
                    if (showResult) {
                      if (isCorrectAnswer) {
                        // Richtige Antwort: DEUTLICH GRÜN mit weißem Text
                        buttonClasses += 'bg-green-500 text-white shadow-lg border-2 border-green-700 scale-105 font-bold';
                      } else if (isWrong) {
                        // Falsche ausgewählte Antwort: DEUTLICH ROT mit weißem Text
                        buttonClasses += 'bg-red-500 text-white shadow-lg border-2 border-red-700 font-bold';
                      } else {
                        // Andere Optionen: Grau ausgegraut
                        buttonClasses += 'bg-gray-200 text-gray-500 opacity-60';
                      }
                    } else {
                      // Nicht beantwortet: Bunte Karte mit Hover
                      buttonClasses += 'bg-gradient-card text-gray-800 hover:bg-white hover:shadow-large hover:scale-[1.02] border-2 border-gray-200';
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
                    <div className="p-5 rounded-xl mb-4 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-900 border-2 border-orange-300 shadow-medium">
                      <div className="text-2xl font-bold mb-2">💪 Fast richtig!</div>
                      <div className="mb-3 text-lg">
                        Die richtige Antwort ist: <strong className="text-green-600">{currentQuestion.options?.[currentQuestion.correctAnswer as number]}</strong>
                      </div>
                      {currentQuestion.explanation && (
                        <div className="bg-white/80 rounded-xl p-4 mt-3 border-2 border-purple-300 shadow-soft">
                          <div className="text-base font-bold text-purple-700 mb-2">
                            💡 So funktioniert es:
                          </div>
                          <div className="text-gray-700">
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
            <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-purple-200">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`p-3 rounded-xl transition-all duration-300 transform ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300 hover:scale-110 shadow-sm hover:shadow-md'
                }`}
                title="Zurück zur vorherigen Frage"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-base text-gray-700 font-bold bg-white/60 px-4 py-2 rounded-xl shadow-soft">
                Frage {currentQuestionIndex + 1} von {questions.length}
              </div>
              
              <button
                onClick={handleNextQuestion}
                disabled={!showResult}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 transform ${
                  !showResult
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                    : currentQuestionIndex === questions.length - 1
                    ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 hover:scale-110 shadow-sm hover:shadow-md'
                    : 'bg-green-600 text-white hover:bg-green-700 hover:scale-110 shadow-md hover:shadow-lg'
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

