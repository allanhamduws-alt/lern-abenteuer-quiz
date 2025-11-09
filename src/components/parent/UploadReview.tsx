/**
 * Upload-Review Komponente für Eltern
 * Zeigt alle Uploads und generierte Tasks, erlaubt Review und Freigabe
 */

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, onSnapshot, getDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { ref, deleteObject, getBlob, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface Upload {
  id: string;
  filename: string;
  subject: string;
  grade: number;
  status: 'pending' | 'processing' | 'ready' | 'error';
  sourceType: 'file' | 'link';
  downloadURL: string;
  storagePath?: string | null; // Firebase Storage Path für CORS-freien Zugriff
  createdAt: string;
  confidence?: number;
  pages?: number;
  tasksGenerated?: number;
  errors?: string[];
}

interface Task {
  id: string;
  uploadId: string;
  status: 'pending' | 'approved' | 'rejected';
  kidId?: string;
  stem: string; // Frage-Text (entspricht question in Question)
  options: string[]; // Antwort-Optionen
  answers: number | number[]; // Index/Indizes der richtigen Antwort(en)
  difficulty?: 'leicht' | 'mittel' | 'schwer';
  explanation?: string;
  subject: string;
  grade: number;
  type?: string;
}

interface UploadReviewProps {
  parentUid: string;
}

export function UploadReview({ parentUid }: UploadReviewProps) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({}); // uploadId -> tasks
  const [expandedUploads, setExpandedUploads] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set()); // uploadId -> loading state

  const loadUploads = () => {
    try {
      const uploadsRef = collection(db, 'users', parentUid, 'uploads');
      const q = query(uploadsRef, orderBy('createdAt', 'desc'));
      
      // Verwende onSnapshot für Echtzeit-Updates
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const uploadsData: Upload[] = [];
          snapshot.forEach((doc) => {
            uploadsData.push({ id: doc.id, ...doc.data() } as Upload);
          });
          setUploads(uploadsData);
          setLoading(false);
        },
        (error) => {
          console.error('Fehler beim Laden der Uploads:', error);
          setLoading(false);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error('Fehler beim Laden der Uploads:', error);
      setLoading(false);
      return () => {}; // Leere Cleanup-Funktion
    }
  };

  const loadTasksForUpload = async (uploadId: string) => {
    setLoadingTasks((prev) => new Set(prev).add(uploadId));
    try {
      // Tasks sind unter users/{parentId}/kids/{kidId}/tasks gespeichert
      // Wir müssen alle Kinder durchgehen und Tasks mit uploadId finden
      
      // FIX: Verwende getDoc statt getDocs für ein einzelnes Dokument
      const parentDocRef = doc(db, 'users', parentUid);
      const parentDocSnap = await getDoc(parentDocRef);
      
      if (!parentDocSnap.exists()) {
        console.error('Eltern-Dokument nicht gefunden');
        setLoadingTasks((prev) => {
          const next = new Set(prev);
          next.delete(uploadId);
          return next;
        });
        return;
      }
      
      const parentData = parentDocSnap.data();
      const kids = parentData?.children || [];
      
      const allTasks: Task[] = [];
      
      for (const kidId of kids) {
        const tasksRef = collection(db, 'users', parentUid, 'kids', kidId, 'tasks');
        const q = query(tasksRef, where('uploadId', '==', uploadId));
        const snapshot = await getDocs(q);
        
        snapshot.forEach((taskDoc) => {
          allTasks.push({
            id: taskDoc.id,
            kidId,
            ...taskDoc.data(),
          } as Task);
        });
      }
      
      setTasks((prev) => ({ ...prev, [uploadId]: allTasks }));
    } catch (error) {
      console.error('Fehler beim Laden der Tasks:', error);
    } finally {
      setLoadingTasks((prev) => {
        const next = new Set(prev);
        next.delete(uploadId);
        return next;
      });
    }
  };

  useEffect(() => {
    setLoading(true);
    // onSnapshot gibt eine Cleanup-Funktion zurück
    const unsubscribe = loadUploads();
    
    // Cleanup: unsubscribe wenn Komponente unmountet
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [parentUid]);

  const toggleUpload = async (uploadId: string) => {
    const newExpanded = new Set(expandedUploads);
    if (newExpanded.has(uploadId)) {
      newExpanded.delete(uploadId);
    } else {
      newExpanded.add(uploadId);
      // Lade Tasks wenn noch nicht geladen
      if (!tasks[uploadId]) {
        await loadTasksForUpload(uploadId);
      }
    }
    setExpandedUploads(newExpanded);
  };

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const approveTask = async (taskId: string, kidId: string) => {
    try {
      const taskRef = doc(db, 'users', parentUid, 'kids', kidId, 'tasks', taskId);
      await updateDoc(taskRef, { status: 'approved' });
      
      // Update local state
      const uploadId = tasks[Object.keys(tasks).find(k => tasks[k].some(t => t.id === taskId)) || '']?.[0]?.uploadId;
      if (uploadId) {
        setTasks((prev) => ({
          ...prev,
          [uploadId]: prev[uploadId].map((t) =>
            t.id === taskId ? { ...t, status: 'approved' } : t
          ),
        }));
      }
    } catch (error) {
      console.error('Fehler beim Freigeben der Aufgabe:', error);
      alert('Fehler beim Freigeben der Aufgabe');
    }
  };

  const rejectTask = async (taskId: string, kidId: string) => {
    try {
      const taskRef = doc(db, 'users', parentUid, 'kids', kidId, 'tasks', taskId);
      await updateDoc(taskRef, { status: 'rejected' });
      
      // Update local state
      const uploadId = Object.keys(tasks).find(k => tasks[k].some(t => t.id === taskId));
      if (uploadId) {
        setTasks((prev) => ({
          ...prev,
          [uploadId]: prev[uploadId].map((t) =>
            t.id === taskId ? { ...t, status: 'rejected' } : t
          ),
        }));
      }
    } catch (error) {
      console.error('Fehler beim Ablehnen der Aufgabe:', error);
      alert('Fehler beim Ablehnen der Aufgabe');
    }
  };

  const approveAllTasksForUpload = async (uploadId: string) => {
    const uploadTasks = tasks[uploadId] || [];
    const pendingTasks = uploadTasks.filter((t) => t.status === 'pending');
    
    for (const task of pendingTasks) {
      if (task.kidId) {
        await approveTask(task.id, task.kidId);
      }
    }
  };

  const generateMoreTasks = async (upload: Upload) => {
    if (!confirm(`Möchten Sie weitere 5 Aufgaben für "${upload.filename}" generieren?`)) {
      return;
    }

    try {
      // Lade Eltern-Daten um Kinder zu finden
      const parentDocRef = doc(db, 'users', parentUid);
      const parentDocSnap = await getDoc(parentDocRef);
      
      if (!parentDocSnap.exists()) {
        throw new Error('Eltern-Dokument nicht gefunden');
      }

      const parentData = parentDocSnap.data();
      const kids = parentData?.children || [];

      if (kids.length === 0) {
        alert('Keine Kinder gefunden. Bitte verknüpfen Sie zuerst ein Kind mit Ihrem Konto.');
        return;
      }

      // Erstelle weitere 5 Mock-Tasks
      const additionalTasks = [
        {
          stem: `Welche Art von Aufgaben könnte in diesem Material vorkommen?`,
          options: [
            'Nur Multiple-Choice Fragen',
            'Nur offene Fragen',
            'Eine Mischung aus verschiedenen Aufgabentypen',
            'Nur Rechenaufgaben',
          ],
          answers: 2,
          difficulty: 'mittel',
          explanation: 'Arbeitsblätter enthalten meist verschiedene Aufgabentypen.',
        },
        {
          stem: `Wie schwierig sind die Aufgaben in diesem Material wahrscheinlich?`,
          options: [
            'Sehr leicht',
            'Leicht bis mittel',
            'Mittel bis schwer',
            'Sehr schwer',
          ],
          answers: upload.grade <= 2 ? 1 : 2,
          difficulty: upload.grade <= 2 ? 'leicht' : 'mittel',
          explanation: 'Die Schwierigkeit passt zur Klassenstufe ' + upload.grade + '.',
        },
        {
          stem: `Was ist wichtig beim Bearbeiten dieses Materials?`,
          options: [
            'Schnell arbeiten',
            'Sorgfältig lesen und verstehen',
            'Nur die richtigen Antworten geben',
            'Alle Aufgaben auf einmal lösen',
          ],
          answers: 1,
          difficulty: 'leicht',
          explanation: 'Sorgfältiges Lesen und Verstehen ist wichtig für erfolgreiches Lernen.',
        },
        {
          stem: `Welches Thema könnte dieses Material behandeln?`,
          options: [
            'Grundlagen des Faches ' + upload.subject,
            'Fortgeschrittene Themen',
            'Wiederholung alter Themen',
            'Alle oben genannten',
          ],
          answers: 3,
          difficulty: 'mittel',
          explanation: 'Arbeitsblätter können verschiedene Themen behandeln.',
        },
        {
          stem: `Wie könnte ein Kind am besten mit diesem Material lernen?`,
          options: [
            'Schnell durcharbeiten',
            'Schritt für Schritt vorgehen',
            'Nur die leichten Aufgaben machen',
            'Die Aufgaben auswendig lernen',
          ],
          answers: 1,
          difficulty: 'leicht',
          explanation: 'Schritt für Schritt zu arbeiten hilft beim Verstehen und Lernen.',
        },
      ];

      let tasksCreated = 0;
      for (const kidId of kids) {
        for (const task of additionalTasks) {
          await addDoc(
            collection(db, 'users', parentUid, 'kids', kidId, 'tasks'),
            {
              stem: task.stem,
              options: task.options,
              answers: task.answers,
              difficulty: task.difficulty,
              explanation: task.explanation,
              type: 'multiple-choice',
              uploadId: upload.id,
              subject: upload.subject,
              grade: upload.grade,
              status: 'pending',
              createdAt: new Date().toISOString(),
            }
          );
          tasksCreated++;
        }
      }

      // Upload-Status aktualisieren
      const uploadRef = doc(db, 'users', parentUid, 'uploads', upload.id);
      const currentUpload = uploads.find(u => u.id === upload.id);
      const currentTasksGenerated = currentUpload?.tasksGenerated || 0;
      
      await updateDoc(uploadRef, {
        tasksGenerated: currentTasksGenerated + tasksCreated,
      });

      // Tasks neu laden
      await loadTasksForUpload(upload.id);

      alert(`✅ ${tasksCreated} weitere Aufgaben wurden erstellt!`);
    } catch (error: any) {
      console.error('Fehler beim Generieren weiterer Aufgaben:', error);
      alert('Fehler beim Generieren weiterer Aufgaben: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  // PDF zu Bild konvertieren (erste Seite)
  const pdfToImage = async (fileUrl: string, storagePath?: string | null): Promise<string> => {
    try {
      // Dynamisch pdfjs-dist importieren
      const pdfjsLib = await import('pdfjs-dist');
      
      // Worker lokal aus node_modules laden (funktioniert mit Vite)
      // Verwende den Worker als ES-Modul
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      
      console.log('📄 Lade PDF...');
      
      let pdfData: ArrayBuffer;
      
      // Wenn storagePath vorhanden ist, lade über Firebase Storage SDK
      // Verwende getDownloadURL statt getBlob, da die URL mit Token keine CORS benötigt
      if (storagePath) {
        console.log(`📥 Lade PDF über Firebase Storage SDK... Pfad: ${storagePath}`);
        try {
          const storageRef = ref(storage, storagePath);
          // Verwende getDownloadURL - die URL enthält ein Token und umgeht CORS
          const downloadURL = await getDownloadURL(storageRef);
          console.log(`✅ Download-URL erhalten, lade PDF...`);
          const response = await fetch(downloadURL);
          if (!response.ok) {
            throw new Error(`Fehler beim Laden der Datei: ${response.statusText}`);
          }
          pdfData = await response.arrayBuffer();
          console.log(`✅ PDF geladen: ${pdfData.byteLength} Bytes`);
        } catch (storageError: any) {
          console.warn('⚠️ Firebase Storage SDK Fehler, versuche Fallback über downloadURL:', storageError.message);
          // Fallback: Versuche direkt über downloadURL aus Firestore
          const response = await fetch(fileUrl);
          if (!response.ok) {
            throw new Error(`Fehler beim Laden der Datei: ${response.statusText}. Möglicherweise CORS-Problem. Verwende den Backend-Agent (siehe AGENT_SETUP.md).`);
          }
          pdfData = await response.arrayBuffer();
        }
      } else {
        // Fallback: Versuche direkt über URL (für Links)
        console.log('📥 Lade PDF über URL (kein storagePath vorhanden)...');
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Fehler beim Laden der Datei: ${response.statusText}`);
        }
        pdfData = await response.arrayBuffer();
      }
      
      // PDF aus ArrayBuffer laden
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      
      console.log(`📄 PDF geladen: ${pdf.numPages} Seiten`);
      
      // Erste Seite rendern
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });
      
      // Canvas erstellen
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas-Kontext nicht verfügbar');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Seite auf Canvas rendern
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      // Canvas zu Base64 konvertieren
      const imageDataUrl = canvas.toDataURL('image/png');
      console.log('✅ PDF zu Bild konvertiert');
      
      return imageDataUrl;
    } catch (error: any) {
      console.error('❌ Fehler bei PDF-Konvertierung:', error);
      throw new Error(`PDF-Konvertierung Fehler: ${error.message}`);
    }
  };

  // OCR mit GPT-4 Vision (läuft im Browser)
  // HINWEIS: Diese Funktion sollte idealerweise durch den Backend-Agent ersetzt werden
  // um API-Keys nicht im Frontend zu exponieren
  const performOCR = async (fileUrl: string, storagePath?: string | null): Promise<{ text: string; confidence: number; pages: number }> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      const errorMsg = 'OpenAI API Key nicht gefunden. Bitte setzen Sie VITE_OPENAI_API_KEY in .env.local\n\n' +
        'HINWEIS: Für Produktion sollte OCR über den Backend-Agent erfolgen, um API-Keys sicher zu halten.';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      console.log('🔍 Starte OCR mit GPT-4 Vision...');
      
      const isPDF = fileUrl.toLowerCase().endsWith('.pdf') || fileUrl.includes('pdf');
      let imageDataUrl = fileUrl;
      let pages = 1;
      
      // Für PDFs: Konvertiere zuerst zu Bild
      if (isPDF) {
        console.log('📄 PDF erkannt - konvertiere zu Bild...');
        imageDataUrl = await pdfToImage(fileUrl, storagePath);
        // Für jetzt nur erste Seite - später können wir mehrere Seiten verarbeiten
        pages = 1;
      }
      
      // GPT-4 Vision API aufrufen
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Extrahiere ALLEN Text aus diesem Dokument. Gib den kompletten Text zurück, so wie er auf dem Dokument erscheint. Erhalte die Struktur, alle Aufgaben, Fragen, Antworten, Zahlen und Details.`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageDataUrl, // Base64-encoded Bild oder Bild-URL
                  },
                },
              ],
            },
          ],
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        const errorCode = errorData.error?.code || response.status;
        
        // Spezifische Fehlerbehandlung
        if (response.status === 401) {
          throw new Error(`OpenAI API Authentifizierung fehlgeschlagen. Bitte prüfen Sie VITE_OPENAI_API_KEY in .env.local`);
        } else if (response.status === 429) {
          throw new Error(`OpenAI API Rate Limit erreicht. Bitte versuchen Sie es später erneut oder verwenden Sie den Backend-Agent.`);
        } else if (response.status === 500 || response.status === 503) {
          throw new Error(`OpenAI API temporär nicht verfügbar. Bitte versuchen Sie es später erneut.`);
        }
        
        throw new Error(`OpenAI API Fehler (${errorCode}): ${errorMessage}`);
      }

      const data = await response.json();
      const extractedText = data.choices[0]?.message?.content || '';
      
      const confidence = extractedText.length > 200 ? 0.9 : extractedText.length > 50 ? 0.8 : 0.6;

      console.log(`✅ OCR abgeschlossen: ${extractedText.length} Zeichen extrahiert, ${pages} Seite(n) verarbeitet`);
      
      return { text: extractedText, confidence, pages };
    } catch (error: any) {
      console.error('❌ Fehler bei OCR:', error);
      throw new Error(`OCR-Fehler: ${error.message}`);
    }
  };

  // Aufgaben-Generierung mit GPT-4
  // HINWEIS: Diese Funktion sollte idealerweise durch den Backend-Agent ersetzt werden
  // um API-Keys nicht im Frontend zu exponieren
  const generateTasks = async (
    extractedText: string,
    subject: string,
    grade: number
  ): Promise<Array<{
    stem: string;
    options: string[];
    answers: number;
    difficulty: 'leicht' | 'mittel' | 'schwer';
    explanation: string;
  }>> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      const errorMsg = 'OpenAI API Key nicht gefunden. Bitte setzen Sie VITE_OPENAI_API_KEY in .env.local\n\n' +
        'HINWEIS: Für Produktion sollte Aufgaben-Generierung über den Backend-Agent erfolgen, um API-Keys sicher zu halten.';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      console.log('🤖 Generiere Aufgaben mit GPT-4...');

      const subjectName = {
        mathematik: 'Mathematik',
        deutsch: 'Deutsch',
        sachunterricht: 'Sachunterricht',
        englisch: 'Englisch',
        musik: 'Musik',
      }[subject] || subject;

      const difficultyMap = {
        1: 'leicht',
        2: 'leicht bis mittel',
        3: 'mittel',
        4: 'mittel bis schwer',
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Du bist ein Experte für Grundschulbildung (Klasse 1-4) in Deutschland. 
Deine Aufgabe ist es, aus Arbeitsblättern und Lernmaterialien ähnliche Aufgaben für Kinder zu erstellen.

Wichtig:
- Aufgaben müssen altersgerecht sein (Klasse ${grade})
- Schwierigkeit: ${difficultyMap[grade as keyof typeof difficultyMap] || 'mittel'}
- Aufgaben sollen ähnlich zum Original sein, aber Varianten bieten
- Kindgerechte Sprache verwenden
- Klare, verständliche Fragen
- Realistische Antwort-Optionen`,
            },
            {
              role: 'user',
              content: `Analysiere folgenden Text aus einem Arbeitsblatt/Lernmaterial für ${subjectName}, Klasse ${grade}:

---
${extractedText.substring(0, 8000)} // Begrenze auf 8000 Zeichen
---

Erstelle genau 5 ähnliche Aufgaben basierend auf diesem Material.

Für jede Aufgabe:
1. Frage-Stem (die eigentliche Frage)
2. 4 Antwort-Optionen (bei Multiple-Choice)
3. Index der richtigen Antwort (0-3)
4. Schwierigkeit (leicht/mittel/schwer)
5. Kindgerechte Erklärung für die richtige Antwort

Antworte im folgenden JSON-Format:
{
  "tasks": [
    {
      "stem": "Wie viel ist 3 + 5?",
      "options": ["6", "7", "8", "9"],
      "answers": 2,
      "difficulty": "leicht",
      "explanation": "Bei 3 + 5 kannst du zählen: Starte bei 3 und zähle 5 weiter: 3... 4, 5, 6, 7, 8! Das Ergebnis ist 8."
    }
  ]
}

Wichtig:
- Nur valides JSON zurückgeben
- Keine Markdown-Formatierung
- Alle Aufgaben müssen zum Fach ${subjectName} passen
- Schwierigkeit an Klasse ${grade} anpassen`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        const errorCode = errorData.error?.code || response.status;
        
        // Spezifische Fehlerbehandlung
        if (response.status === 401) {
          throw new Error(`OpenAI API Authentifizierung fehlgeschlagen. Bitte prüfen Sie VITE_OPENAI_API_KEY in .env.local`);
        } else if (response.status === 429) {
          throw new Error(`OpenAI API Rate Limit erreicht. Bitte versuchen Sie es später erneut oder verwenden Sie den Backend-Agent.`);
        } else if (response.status === 500 || response.status === 503) {
          throw new Error(`OpenAI API temporär nicht verfügbar. Bitte versuchen Sie es später erneut.`);
        }
        
        throw new Error(`OpenAI API Fehler (${errorCode}): ${errorMessage}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || '{}';
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        // Fallback: Versuche JSON aus Text zu extrahieren
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Kein gültiges JSON in der Antwort');
        }
      }

      const tasks = parsedResponse.tasks || [];
      console.log(`✅ ${tasks.length} Aufgaben generiert`);

      return tasks.map((task: any) => ({
        stem: task.stem,
        options: task.options || [],
        answers: task.answers,
        difficulty: (task.difficulty || 'mittel') as 'leicht' | 'mittel' | 'schwer',
        explanation: task.explanation || '',
      }));
    } catch (error: any) {
      console.error('❌ Fehler bei Aufgaben-Generierung:', error);
      throw new Error(`Aufgaben-Generierung Fehler: ${error.message}`);
    }
  };

  const processUploadManually = async (upload: Upload) => {
    if (!confirm(`Möchten Sie "${upload.filename}" jetzt mit KI verarbeiten?\n\nDies verwendet GPT-4 Vision für OCR und GPT-4 für Aufgaben-Generierung.`)) {
      return;
    }

    try {
      // Status auf 'processing' setzen
      const uploadRef = doc(db, 'users', parentUid, 'uploads', upload.id);
      await updateDoc(uploadRef, { status: 'processing' });

      // Lade Eltern-Daten um Kinder zu finden
      const parentDocRef = doc(db, 'users', parentUid);
      const parentDocSnap = await getDoc(parentDocRef);
      
      if (!parentDocSnap.exists()) {
        throw new Error('Eltern-Dokument nicht gefunden');
      }

      const parentData = parentDocSnap.data();
      const kids = parentData?.children || [];

      if (kids.length === 0) {
        await updateDoc(uploadRef, {
          status: 'error',
          errors: ['Keine Kinder mit diesem Eltern-Konto verknüpft'],
        });
        alert('Keine Kinder gefunden. Bitte verknüpfen Sie zuerst ein Kind mit Ihrem Konto.');
        return;
      }

      // Schritt 1: OCR durchführen
      console.log('📄 Starte OCR...');
      const ocrResult = await performOCR(upload.downloadURL, upload.storagePath || null);
      console.log(`✅ OCR abgeschlossen: ${ocrResult.text.length} Zeichen extrahiert`);

      if (ocrResult.text.length < 50) {
        throw new Error('Zu wenig Text extrahiert. Bitte stellen Sie sicher, dass das Dokument Text enthält.');
      }

      // Schritt 2: Aufgaben generieren
      console.log('🤖 Generiere Aufgaben...');
      const generatedTasks = await generateTasks(ocrResult.text, upload.subject, upload.grade);
      console.log(`✅ ${generatedTasks.length} Aufgaben generiert`);

      if (generatedTasks.length === 0) {
        throw new Error('Keine Aufgaben konnten generiert werden. Bitte versuchen Sie es erneut.');
      }

      // Schritt 3: Aufgaben für jedes Kind erstellen
      let tasksCreated = 0;
      for (const kidId of kids) {
        for (const task of generatedTasks) {
          await addDoc(
            collection(db, 'users', parentUid, 'kids', kidId, 'tasks'),
            {
              stem: task.stem,
              options: task.options,
              answers: task.answers,
              difficulty: task.difficulty,
              explanation: task.explanation,
              type: 'multiple-choice',
              uploadId: upload.id,
              subject: upload.subject,
              grade: upload.grade,
              status: 'pending',
              createdAt: new Date().toISOString(),
            }
          );
          tasksCreated++;
        }
      }

      // Status auf 'ready' setzen
      await updateDoc(uploadRef, {
        status: 'ready',
        tasksGenerated: tasksCreated,
        confidence: ocrResult.confidence,
        pages: ocrResult.pages,
      });

      // Tasks neu laden
      await loadTasksForUpload(upload.id);

      alert(`✅ Verarbeitung abgeschlossen!\n\n📄 ${ocrResult.text.length} Zeichen extrahiert\n📝 ${tasksCreated} Aufgaben erstellt für ${kids.length} Kind(er)`);
    } catch (error: any) {
      console.error('❌ Fehler bei manueller Verarbeitung:', error);
      
      // Status auf 'error' setzen
      try {
        const uploadRef = doc(db, 'users', parentUid, 'uploads', upload.id);
        const errorMessage = error.message || 'Unbekannter Fehler';
        await updateDoc(uploadRef, {
          status: 'error',
          errors: [errorMessage],
        });
      } catch (updateError) {
        console.error('❌ Fehler beim Aktualisieren des Status:', updateError);
      }
      
      // Benutzerfreundliche Fehlermeldung
      let userMessage = 'Fehler bei der Verarbeitung:\n\n' + (error.message || 'Unbekannter Fehler');
      
      // Spezifische Hinweise basierend auf Fehlertyp
      if (error.message?.includes('API Key')) {
        userMessage += '\n\n💡 Tipp: Stellen Sie sicher, dass VITE_OPENAI_API_KEY in .env.local gesetzt ist.';
        userMessage += '\n\nAlternativ können Sie den Backend-Agent verwenden (siehe AGENT_SETUP.md), der API-Keys sicherer verwaltet.';
      } else if (error.message?.includes('Rate Limit')) {
        userMessage += '\n\n💡 Tipp: Versuchen Sie es in ein paar Minuten erneut oder verwenden Sie den Backend-Agent.';
      } else if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
        userMessage += '\n\n💡 Tipp: Dies könnte ein CORS-Problem sein. Prüfen Sie die CORS-Konfiguration (siehe CORS_SETUP.md) oder verwenden Sie den Backend-Agent.';
      }
      
      alert(userMessage);
    }
  };

  const deleteUpload = async (upload: Upload) => {
    // Bestätigung einholen
    if (!confirm(`Möchten Sie "${upload.filename}" wirklich löschen?`)) {
      return;
    }

    try {
      // 1. Datei aus Firebase Storage löschen (falls vorhanden)
      if (upload.storagePath) {
        try {
          const storageRef = ref(storage, upload.storagePath);
          await deleteObject(storageRef);
        } catch (storageError: any) {
          // Wenn Datei nicht gefunden wird, ist das ok - weiter mit Firestore-Löschung
          if (storageError.code !== 'storage/object-not-found') {
            console.warn('Fehler beim Löschen der Datei aus Storage:', storageError);
          }
        }
      }

      // 2. Upload-Dokument aus Firestore löschen
      const uploadRef = doc(db, 'users', parentUid, 'uploads', upload.id);
      await deleteDoc(uploadRef);

      // 3. Tasks aus dem lokalen State entfernen
      setTasks((prev) => {
        const next = { ...prev };
        delete next[upload.id];
        return next;
      });

      // 4. Upload aus expandedUploads entfernen falls erweitert
      setExpandedUploads((prev) => {
        const next = new Set(prev);
        next.delete(upload.id);
        return next;
      });
    } catch (error) {
      console.error('Fehler beim Löschen des Uploads:', error);
      alert('Fehler beim Löschen des Uploads. Bitte versuchen Sie es erneut.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Wartend',
      processing: 'Wird verarbeitet',
      ready: 'Bereit',
      error: 'Fehler',
      approved: 'Freigegeben',
      rejected: 'Abgelehnt',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return <div className="text-center py-8">Lade Uploads...</div>;
  }

  if (uploads.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">Noch keine Uploads vorhanden.</p>
        <p className="text-sm text-gray-500 mt-2">
          Lade Material hoch, um Aufgaben generieren zu lassen.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        📄 Hochgeladene Materialien & Aufgaben
      </h3>
      
      {uploads.map((upload) => {
        const uploadTasks = tasks[upload.id] || [];
        const pendingCount = uploadTasks.filter((t) => t.status === 'pending').length;
        const approvedCount = uploadTasks.filter((t) => t.status === 'approved').length;
        const isExpanded = expandedUploads.has(upload.id);

        return (
          <Card key={upload.id} className="border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">
                    {upload.sourceType === 'file' ? '📄' : '🔗'}
                  </span>
                  <div>
                    <div className="font-bold text-lg text-gray-800">
                      {upload.filename}
                    </div>
                    <div className="text-sm text-gray-600">
                      {upload.subject} • Klasse {upload.grade} •{' '}
                      {new Date(upload.createdAt).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusColor(upload.status)}>
                    {getStatusText(upload.status)}
                  </Badge>
                  {upload.confidence && (
                    <Badge className="bg-blue-100 text-blue-800">
                      {Math.round(upload.confidence * 100)}% Vertrauen
                    </Badge>
                  )}
                  {upload.tasksGenerated && (
                    <Badge className="bg-purple-100 text-purple-800">
                      {upload.tasksGenerated} Aufgaben generiert
                    </Badge>
                  )}
                  {pendingCount > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {pendingCount} wartend
                    </Badge>
                  )}
                  {approvedCount > 0 && (
                    <Badge className="bg-green-100 text-green-800">
                      {approvedCount} freigegeben
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="secondary"
                  onClick={() => toggleUpload(upload.id)}
                  className=""
                >
                  {isExpanded ? '▼' : '▶'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => deleteUpload(upload)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Upload löschen"
                >
                  🗑️
                </Button>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                {/* Loading-Indikator während Tasks geladen werden */}
                {loadingTasks.has(upload.id) && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">Lade Aufgaben...</p>
                  </div>
                )}
                
                {/* Upload noch nicht verarbeitet */}
                {!loadingTasks.has(upload.id) && upload.status === 'pending' && (
                  <div className="text-center py-8 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                    <p className="text-yellow-800 font-semibold mb-2">⏳ Material wartet auf Verarbeitung</p>
                    <p className="text-yellow-700 text-sm mb-4">
                      Klicken Sie auf den Button, um das Material mit GPT-4 Vision zu verarbeiten und Aufgaben zu generieren.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => processUploadManually(upload)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      🤖 Mit KI verarbeiten (GPT-4 Vision)
                    </Button>
                  </div>
                )}
                
                {/* Upload wird verarbeitet */}
                {!loadingTasks.has(upload.id) && upload.status === 'processing' && (
                  <div className="text-center py-8 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <p className="text-blue-800 font-semibold mb-2">🔄 Wird verarbeitet</p>
                    <p className="text-blue-700 text-sm">
                      Der Agent analysiert das Material und generiert Aufgaben...
                    </p>
                  </div>
                )}
                
                {/* Upload-Fehler */}
                {!loadingTasks.has(upload.id) && upload.status === 'error' && (
                  <div className="text-center py-8 bg-red-50 rounded-lg border-2 border-red-200">
                    <p className="text-red-800 font-semibold mb-2">❌ Fehler bei der Verarbeitung</p>
                    <p className="text-red-700 text-sm mb-2">
                      Beim Verarbeiten des Materials ist ein Fehler aufgetreten.
                    </p>
                    {upload.errors && upload.errors.length > 0 && (
                      <ul className="text-red-600 text-sm text-left mt-2 list-disc list-inside">
                        {upload.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                
                {/* Upload fertig, aber keine Tasks gefunden */}
                {!loadingTasks.has(upload.id) && upload.status === 'ready' && uploadTasks.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <p className="text-gray-800 font-semibold mb-2">📝 Noch keine Aufgaben</p>
                    <p className="text-gray-700 text-sm">
                      Für dieses Material wurden noch keine Aufgaben generiert. Der Agent könnte noch arbeiten oder es gab ein Problem bei der Verarbeitung.
                    </p>
                  </div>
                )}
                
                {/* Tasks gefunden und anzeigen */}
                {!loadingTasks.has(upload.id) && upload.status === 'ready' && uploadTasks.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-600">
                        {uploadTasks.length} Aufgabe{uploadTasks.length !== 1 ? 'n' : ''} gefunden
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => generateMoreTasks(upload)}
                          className="text-sm bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          ➕ 5 weitere Aufgaben
                        </Button>
                        {pendingCount > 0 && (
                          <Button
                            variant="primary"
                            onClick={() => approveAllTasksForUpload(upload.id)}
                            className="text-sm"
                          >
                            Alle freigeben ({pendingCount})
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {uploadTasks.map((task) => {
                        const isTaskExpanded = expandedTasks.has(task.id);
                        const correctAnswer = Array.isArray(task.answers)
                          ? task.answers.map((idx: number) => task.options[idx]).join(', ')
                          : task.options[task.answers as number];

                        return (
                          <Card
                            key={task.id}
                            className={`border-2 ${
                              task.status === 'approved'
                                ? 'border-green-300 bg-green-50'
                                : task.status === 'rejected'
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(task.status)}>
                                  {getStatusText(task.status)}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  Schwierigkeit: {task.difficulty || 'mittel'}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="secondary"
                                  onClick={() => toggleTask(task.id)}
                                  className="text-sm"
                                >
                                  {isTaskExpanded ? 'Aufgabe ausblenden' : 'Aufgabe anzeigen'}
                                </Button>
                                {task.status === 'pending' && task.kidId && (
                                  <>
                                    <Button
                                      variant="primary"
                                      onClick={() => approveTask(task.id, task.kidId!)}
                                      className="text-sm bg-green-600 hover:bg-green-700"
                                    >
                                      ✓ Freigeben
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      onClick={() => rejectTask(task.id, task.kidId!)}
                                      className="text-sm bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      ✗ Ablehnen
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            {isTaskExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <div className="font-semibold text-gray-700 mb-2">
                                    📝 Aufgabe:
                                  </div>
                                  <div className="text-gray-800 whitespace-pre-wrap">
                                    {task.stem}
                                  </div>
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <div className="font-semibold text-gray-700 mb-2">
                                    📋 Optionen:
                                  </div>
                                  <ul className="list-disc list-inside space-y-1">
                                    {task.options.map((option: string, idx: number) => (
                                      <li
                                        key={idx}
                                        className={`${
                                          Array.isArray(task.answers)
                                            ? task.answers.includes(idx)
                                              ? 'text-green-600 font-semibold'
                                              : 'text-gray-700'
                                            : task.answers === idx
                                            ? 'text-green-600 font-semibold'
                                            : 'text-gray-700'
                                        }`}
                                      >
                                        {option}
                                        {Array.isArray(task.answers)
                                          ? task.answers.includes(idx) && ' ✓'
                                          : task.answers === idx && ' ✓'}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                                  <div className="font-semibold text-green-800 mb-2">
                                    ✅ Richtige Antwort:
                                  </div>
                                  <div className="text-green-900 font-bold text-lg">
                                    {correctAnswer}
                                  </div>
                                </div>

                                {task.explanation && (
                                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="font-semibold text-blue-800 mb-2">
                                      💡 Erklärung:
                                    </div>
                                    <div className="text-blue-900 whitespace-pre-wrap">
                                      {task.explanation}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
                {upload.status === 'error' && upload.errors && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="font-semibold text-red-800 mb-2">Fehler:</div>
                    <ul className="list-disc list-inside text-red-700">
                      {upload.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

