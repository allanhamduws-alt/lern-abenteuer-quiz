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
import { TaskPreview } from './TaskPreview';

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

  // PDF-Extraktion mit Gemini 2.5 Pro (wie Backend)
  // Direkte PDF-Verarbeitung ohne JPEG-Konvertierung
  const performOCRWithGemini = async (fileUrl: string): Promise<{ text: string; confidence: number; pages: number }> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY nicht gefunden. Bitte setzen Sie VITE_GEMINI_API_KEY in .env.local');
    }

    try {
      console.log('🔍 Starte PDF-Extraktion mit Gemini 2.5 Pro...');
      
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Fehler beim Laden der Datei: ${fileResponse.statusText}`);
      }

      const contentType = fileResponse.headers.get('content-type') || '';
      const isPDF = contentType.includes('pdf') || fileUrl.toLowerCase().endsWith('.pdf');
      
      const fileBuffer = await fileResponse.arrayBuffer();
      // Konvertiere ArrayBuffer zu Base64
      const bytes = new Uint8Array(fileBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const fileBase64 = btoa(binary);
      
      // Versuche Gemini 2.5 Pro, fallback auf andere Modelle
      const modelsToTry = [
        'gemini-2.5-pro',
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro',
      ];

      let extractedText = '';
      let pages = 1;
      let lastError: Error | null = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`📄 Versuche Modell: ${modelName}...`);
          
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
          
          const mimeType = isPDF ? 'application/pdf' : contentType || 'image/jpeg';
          
          const prompt = `Analysiere dieses Dokument vollständig und extrahiere ALLEN Text, alle Aufgaben, Fragen, Antworten und Zahlen.

WICHTIG:
- Extrahiere den Text genau so, wie er im Dokument erscheint
- Behalte die Struktur bei (Überschriften, Absätze, Listen)
- Erkenne alle Lernaufgaben und Übungen
- Erkenne die Art des Arbeitsblatts (z.B. Mathematik-Übungen, Deutsch-Aufgaben, etc.)
- Erkenne die Aufgabenformate (Multiple-Choice, Lückentext, Zuordnung, etc.)
- Erkenne Lösungen und Antworten wenn vorhanden

Gib den vollständigen Text zurück, strukturiert und vollständig.`;

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    inlineData: {
                      data: fileBase64,
                      mimeType: mimeType,
                    },
                  },
                  { text: prompt },
                ],
              }],
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`⚠️ Modell ${modelName} nicht verfügbar:`, response.status);
            lastError = new Error(`Gemini API Fehler: ${response.status}`);
            continue;
          }

          const data = await response.json();
          extractedText = data.candidates[0]?.content?.parts[0]?.text || '';
          
          pages = Math.max(1, Math.ceil(extractedText.length / 2000));
          
          console.log(`✅ Gemini ${modelName} Text extrahiert: ${extractedText.length} Zeichen`);
          break; // Erfolg
        } catch (modelError: any) {
          console.warn(`⚠️ Fehler mit Modell ${modelName}:`, modelError);
          lastError = modelError;
          continue;
        }
      }

      if (!extractedText) {
        throw lastError || new Error('Alle Gemini-Modelle fehlgeschlagen');
      }

      const confidence = extractedText.length > 200 ? 0.95 : extractedText.length > 50 ? 0.85 : 0.7;

      console.log(`✅ Gemini OCR abgeschlossen: ${extractedText.length} Zeichen extrahiert, ${pages} Seiten`);
      
      return {
        text: extractedText,
        confidence,
        pages,
      };
    } catch (error: any) {
      console.error('❌ Fehler bei Gemini OCR:', error);
      throw new Error(`Gemini OCR-Fehler: ${error.message}`);
    }
  };

  // OCR mit Gemini 2.5 Pro (primär) oder GPT-4 Vision (Fallback)
  // Verwendet die gleiche Logik wie das Backend
  const performOCR = async (fileUrl: string, storagePath?: string | null): Promise<{ text: string; confidence: number; pages: number }> => {
    // Versuche zuerst Gemini (wie Backend)
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        return await performOCRWithGemini(fileUrl);
      } catch (geminiError: any) {
        console.warn('⚠️ Gemini OCR fehlgeschlagen, versuche OpenAI Fallback:', geminiError.message);
        // Fallback auf OpenAI
      }
    }

    // Fallback: OpenAI GPT-4 Vision (alte Implementierung)
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      const errorMsg = 'Weder GEMINI_API_KEY noch OPENAI_API_KEY gefunden. Bitte setzen Sie VITE_GEMINI_API_KEY oder VITE_OPENAI_API_KEY in .env.local';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      console.log('🔍 Starte OCR mit GPT-4 Vision (Fallback)...');
      
      const isPDF = fileUrl.toLowerCase().endsWith('.pdf') || fileUrl.includes('pdf');
      let imageDataUrl = fileUrl;
      let pages = 1;
      
      // Für PDFs: Konvertiere zuerst zu Bild
      if (isPDF) {
        console.log('📄 PDF erkannt - konvertiere zu Bild...');
        imageDataUrl = await pdfToImage(fileUrl, storagePath);
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
                    url: imageDataUrl,
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
        
        if (response.status === 401) {
          throw new Error(`OpenAI API Authentifizierung fehlgeschlagen. Bitte prüfen Sie VITE_OPENAI_API_KEY in .env.local`);
        } else if (response.status === 429) {
          throw new Error(`OpenAI API Rate Limit erreicht. Bitte versuchen Sie es später erneut.`);
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

  // Validierung und Normalisierung der generierten Task-Daten
  const validateAndNormalizeTask = (task: any): any => {
    const normalized = { ...task };
    
    // TYP-VALIDIERUNG UND AUTO-KORREKTUR
    const validTypes = ['word-classification', 'fill-blank', 'number-input', 
                        'multiple-choice', 'word-problem', 'number-pyramid',
                        'text-input', 'sentence-builder', 'table-fill'];
    
    // Auto-Korrektur für falsche Typen
    if (normalized.type === 'matching' || normalized.type === 'drag-drop') {
      console.warn(`⚠️ Typ "${normalized.type}" → konvertiere zu "word-classification"`);
      normalized.type = 'word-classification';
    } else if (normalized.type === 'input') {
      // Prüfe ob es ein fill-blank oder number-input sein sollte
      if (normalized.blanks || normalized.blankOptions) {
        console.warn(`⚠️ Typ "input" mit blanks → konvertiere zu "fill-blank"`);
        normalized.type = 'fill-blank';
      } else if (normalized.problems) {
        console.warn(`⚠️ Typ "input" mit problems → konvertiere zu "number-input"`);
        normalized.type = 'number-input';
      } else {
        // Fallback zu multiple-choice wenn unklar
        console.warn(`⚠️ Typ "input" unklar → konvertiere zu "multiple-choice"`);
        normalized.type = 'multiple-choice';
      }
    } else if (!normalized.type || !validTypes.includes(normalized.type)) {
      console.warn(`⚠️ Unbekannter Typ "${normalized.type}" → konvertiere zu "multiple-choice"`);
      normalized.type = 'multiple-choice';
    }
    
    // blankOptions muss ein Array von Arrays sein
    if (normalized.blankOptions) {
      normalized.blankOptions = normalized.blankOptions.map((opt: any) => 
        Array.isArray(opt) ? opt : [String(opt)]
      );
    }
    
    // words muss ein Array von Strings sein
    if (normalized.words && !Array.isArray(normalized.words)) {
      normalized.words = [];
    }
    
    // categories muss ein Array von Strings sein
    if (normalized.categories && !Array.isArray(normalized.categories)) {
      normalized.categories = [];
    }
    
    // correctMapping muss ein Objekt sein
    if (normalized.correctMapping && typeof normalized.correctMapping !== 'object') {
      normalized.correctMapping = {};
    }
    
    // problems muss ein Array sein
    if (normalized.problems && !Array.isArray(normalized.problems)) {
      normalized.problems = [];
    }
    
    // blanks muss ein Array sein
    if (normalized.blanks && !Array.isArray(normalized.blanks)) {
      normalized.blanks = [];
    }
    
    // Neue Typen validieren
    if (normalized.type === 'text-input') {
      normalized.expectedAnswer = normalized.expectedAnswer || normalized.answers || '';
      normalized.placeholder = normalized.placeholder || 'Deine Antwort...';
      normalized.maxLength = normalized.maxLength || 50;
    }
    
    if (normalized.type === 'sentence-builder') {
      if (!Array.isArray(normalized.sentenceParts)) {
        normalized.sentenceParts = [];
      }
      if (!Array.isArray(normalized.correctOrder)) {
        normalized.correctOrder = [];
      }
      // Falls correctOrder fehlt, versuche es aus correctAnswer zu extrahieren
      if (normalized.correctOrder.length === 0 && normalized.correctAnswer) {
        if (Array.isArray(normalized.correctAnswer)) {
          normalized.correctOrder = normalized.correctAnswer;
        }
      }
    }
    
    if (normalized.type === 'table-fill') {
      if (!Array.isArray(normalized.tableHeaders)) {
        normalized.tableHeaders = [];
      }
      if (!Array.isArray(normalized.tableRows)) {
        normalized.tableRows = [];
      }
      if (!normalized.correctValues || typeof normalized.correctValues !== 'object') {
        normalized.correctValues = {};
      }
    }
    
    return normalized;
  };

  // Aufgaben-Generierung mit Gemini (kostenlos)
  const generateTasksWithGemini = async (
    extractedText: string,
    subject: string,
    grade: number
  ): Promise<Array<{
    stem: string;
    options: string[];
    answers: number | string | string[];
    difficulty: 'leicht' | 'mittel' | 'schwer';
    explanation: string;
    type: string;
    [key: string]: any; // Für neue Felder
  }>> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY nicht gefunden. Bitte setzen Sie VITE_GEMINI_API_KEY in .env.local');
    }

    try {
      console.log('🤖 Generiere Aufgaben mit Gemini...');

      const subjectName = {
        mathematik: 'Mathematik',
        deutsch: 'Deutsch',
        sachunterricht: 'Sachunterricht',
        naturwissenschaften: 'Naturwissenschaften',
        englisch: 'Englisch',
        musik: 'Musik',
        logik: 'Logik',
      }[subject] || subject;

      const textToProcess = extractedText.substring(0, 50000);

      const prompt = `Du bist Experte für deutsche Grundschul-Arbeitsblätter.

**WICHTIG:** Du musst Aufgaben in einem unserer vordefinierten Aufgabentypen erstellen. Kopiere NICHT das Original-Format!

**SCHRITT 1: ANALYSE**
Analysiere dieses Arbeitsblatt für ${subjectName}, Klasse ${grade}:
- Welches Thema wird behandelt?
- Was sind die Lernziele?
- Welche Schwierigkeit hat es?

---
${textToProcess}
---

**SCHRITT 2: TYP-ANALYSE**
Analysiere die verschiedenen Aufgabentypen in der PDF.
Erstelle eine MISCHUNG von Aufgaben in verschiedenen Typen!

Verfügbare Typen (wähle 2-4 verschiedene für die Aufgaben):

1. **word-classification**: Wörter müssen Kategorien zugeordnet werden
   - Beispiel: Wörter → Nomen, Verben, Adjektive, Pronomen
   - Benötigt: words[], categories[], correctMapping{}

2. **fill-blank**: Lückentexte mit vorgegebenen Optionen pro Lücke
   - Beispiel: "Der H__nd" mit Optionen ["u", "ü"]
   - Benötigt: blanks[], blankOptions[[]]

3. **text-input**: Freie Eingabe von Wörtern oder kurzen Sätzen
   - Beispiel: "Schreibe das Wort richtig: Bli__" → Antwort: "Blitz"
   - Benötigt: expectedAnswer, placeholder

4. **sentence-builder**: Sätze aus Wortbausteinen bilden
   - Beispiel: ["der", "Hund", "läuft", "schnell"] → "Der Hund läuft schnell."
   - Benötigt: sentenceParts[], correctOrder[]

5. **table-fill**: Tabellen ausfüllen (z.B. Verb-Konjugation)
   - Beispiel: Tabelle mit "ich", "du", "er" und Zeitformen
   - Benötigt: tableHeaders[], tableRows[], correctValues{}

6. **multiple-choice**: Standard-Fragen mit 4 Antwort-Optionen
   - Beispiel: "Was ist 2+2?" → Optionen: ["3", "4", "5", "6"]
   - Benötigt: options[], answers (Index)

7. **number-input**: Mehrere Rechenaufgaben mit numerischer Eingabe
   - Beispiel: "5 + 3 = ?", "7 - 2 = ?"
   - Benötigt: problems[{question, answer}]

8. **word-problem**: Textaufgabe mit Berechnung (ein Ergebnis)
   - Beispiel: "Max hat 5 Äpfel, gibt 2 weg. Wie viele bleiben?"
   - Benötigt: context, calculation, correctAnswer

9. **number-pyramid**: Zahlenmauern (für Mathe)
   - Benötigt: levels, structure[[]]

**SCHRITT 3: AUFGABEN ERSTELLEN**
Erstelle 5-8 Aufgaben mit VERSCHIEDENEN Typen:
- 2-3x Typ A (z.B. fill-blank)
- 2x Typ B (z.B. word-classification)
- 1-2x Typ C (z.B. text-input oder sentence-builder)
- Optional: 1x weitere Typen

Alle Aufgaben müssen:
- Für Klasse ${grade} verständlich sein
- Klare, einfache Anweisungen haben
- Logisch und spielbar sein
- Kindgerechte Sprache verwenden

**SCHRITT 4: VALIDIERUNG**
Prüfe jede Aufgabe:
- Ist die Anweisung klar verständlich?
- Weiß ein Kind genau, was zu tun ist?
- Sind alle benötigten Felder vorhanden?

Antworte NUR als JSON:
{
  "worksheetType": "Beschreibung des Themas",
  "selectedType": "word-classification",  // Der gewählte Typ
  "tasks": [
    {
      "type": "word-classification",  // MUSS einer der 6 Typen sein!
      "stem": "Ordne die Wörter den Wortarten zu.",
      "words": ["Haus", "laufen", "schön"],
      "categories": ["Nomen", "Verben", "Adjektive"],
      "correctMapping": {"Haus": "Nomen", "laufen": "Verben", "schön": "Adjektive"},
      "difficulty": "mittel",
      "explanation": "Kindgerechte Erklärung..."
    }
  ]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4000,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API Fehler: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.candidates[0]?.content?.parts[0]?.text || '{}';
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Kein gültiges JSON in der Antwort');
        }
      }

      const tasks = parsedResponse.tasks || [];
      console.log(`✅ ${tasks.length} Aufgaben generiert (Gemini)`);

      return tasks.map((task: any) => validateAndNormalizeTask({
        stem: task.stem,
        options: task.options || [],
        answers: task.answers,
        difficulty: (task.difficulty || 'mittel') as 'leicht' | 'mittel' | 'schwer',
        explanation: task.explanation || '',
        type: task.type || 'multiple-choice',
        // Neue Felder
        blanks: task.blanks,
        blankOptions: task.blankOptions,
        caseSensitive: task.caseSensitive,
        words: task.words,
        categories: task.categories,
        correctMapping: task.correctMapping,
        problems: task.problems,
        operation: task.operation,
        numberRange: task.numberRange,
        levels: task.levels,
        structure: task.structure,
        context: task.context,
        calculation: task.calculation,
        unit: task.unit,
      }));
    } catch (error: any) {
      console.error('❌ Fehler bei Gemini Aufgaben-Generierung:', error);
      throw new Error(`Gemini Aufgaben-Generierung Fehler: ${error.message}`);
    }
  };

  // Aufgaben-Generierung mit OpenAI (kostet ~$0.02)
  const generateTasksWithOpenAI = async (
    extractedText: string,
    subject: string,
    grade: number
  ): Promise<Array<{
    stem: string;
    options: string[];
    answers: number | string | string[];
    difficulty: 'leicht' | 'mittel' | 'schwer';
    explanation: string;
    type: string;
  }>> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      const errorMsg = 'OpenAI API Key nicht gefunden. Bitte setzen Sie VITE_OPENAI_API_KEY in .env.local';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      console.log('🤖 Generiere Aufgaben mit verbesserten Prompts...');

      const subjectName = {
        mathematik: 'Mathematik',
        deutsch: 'Deutsch',
        sachunterricht: 'Sachunterricht',
        naturwissenschaften: 'Naturwissenschaften',
        englisch: 'Englisch',
        musik: 'Musik',
        logik: 'Logik',
      }[subject] || subject;

      const difficultyMap = {
        1: 'leicht',
        2: 'leicht bis mittel',
        3: 'mittel',
        4: 'mittel bis schwer',
      };

      const systemPrompt = `Du bist ein Experte für Grundschulbildung (Klasse 1-4) in Deutschland. 
Deine Aufgabe ist es, aus Arbeitsblättern passende Lernaufgaben für Kinder zu erstellen.

**KRITISCH WICHTIG:** Du musst Aufgaben in einem unserer vordefinierten Aufgabentypen erstellen. 
Kopiere NICHT das Original-Format! Analysiere den INHALT und wähle dann den passenden Typ.

**ERLAUBTE AUFGABENTYPEN (NUR diese 6 Typen sind erlaubt):**

1. **word-classification**: Wörter müssen Kategorien zugeordnet werden
   - Beispiel: Wörter → Nomen, Verben, Adjektive, Pronomen
   - Benötigt: words[], categories[], correctMapping{}
   - NICHT "matching" verwenden! Immer "word-classification"!

2. **fill-blank**: Lückentexte mit vorgegebenen Optionen pro Lücke
   - Beispiel: "Der H__nd" mit Optionen ["u", "ü"] für die Lücke
   - Benötigt: blanks[], blankOptions[[]]
   - NICHT "input" verwenden! Immer "fill-blank"!

3. **number-input**: Mehrere Rechenaufgaben mit numerischer Eingabe
   - Beispiel: "5 + 3 = ?", "7 - 2 = ?"
   - Benötigt: problems[{question, answer}]

4. **multiple-choice**: Standard-Fragen mit 4 Antwort-Optionen
   - Beispiel: "Was ist 2+2?" → Optionen: ["3", "4", "5", "6"]
   - Benötigt: options[], answers (Index)

5. **word-problem**: Textaufgabe mit Berechnung (ein Ergebnis)
   - Beispiel: "Max hat 5 Äpfel, gibt 2 weg. Wie viele bleiben?"
   - Benötigt: context, calculation, correctAnswer

6. **number-pyramid**: Zahlenmauern (für Mathe)
   - Benötigt: levels, structure[[]]

**VERBOTEN:**
- ❌ "matching" → verwende "word-classification"
- ❌ "input" → verwende "fill-blank" oder "number-input"
- ❌ "drag-drop" → verwende "word-classification"
- ❌ Eigene Typen erfinden!

**QUALITÄTSKRITERIEN:**
- Aufgaben müssen für Klasse ${grade} verständlich sein
- Kindgerechte, einfache Sprache
- Klare Anweisungen - Kinder müssen genau wissen, was zu tun ist
- Logisch und spielbar
- Schwierigkeit: ${difficultyMap[grade as keyof typeof difficultyMap] || 'mittel'}`;

      const userPrompt = `Analysiere folgenden Text aus einem Arbeitsblatt für ${subjectName}, Klasse ${grade}:

---
${extractedText.substring(0, 12000)}
---

**SCHRITT 1: INHALTS-ANALYSE**
Analysiere den INHALT des Arbeitsblatts:
- Welches Thema wird behandelt? (z.B. Wortarten, Addition, Rechtschreibung)
- Was sind die Lernziele? (Was sollen die Kinder lernen?)
- Welche Schwierigkeit hat es?

**SCHRITT 2: TYP-ANALYSE**
Analysiere die verschiedenen Aufgabentypen in der PDF.
Erstelle eine MISCHUNG von Aufgaben in verschiedenen Typen!

Verfügbare Typen (wähle 2-4 verschiedene für die Aufgaben):

1. **word-classification**: Wörter Kategorien zuordnen (z.B. Wortarten)
2. **fill-blank**: Lückentexte mit Optionen pro Lücke (z.B. tz/z, ä/e)
3. **text-input**: Freie Eingabe von Wörtern/Sätzen (z.B. Rechtschreibung)
4. **sentence-builder**: Sätze aus Wortbausteinen bilden
5. **table-fill**: Tabellen ausfüllen (z.B. Verb-Konjugation)
6. **multiple-choice**: Standard 4-Optionen-Fragen
7. **number-input**: Rechenaufgaben (für Mathe)
8. **word-problem**: Textaufgaben (für Mathe)
9. **number-pyramid**: Zahlenmauern (für Mathe)

**SCHRITT 3: AUFGABEN ERSTELLEN**
Erstelle 5-8 Aufgaben mit VERSCHIEDENEN Typen:
- 2-3x Typ A (z.B. fill-blank)
- 2x Typ B (z.B. word-classification)
- 1-2x Typ C (z.B. text-input oder sentence-builder)
- Optional: 1x weitere Typen

Alle Aufgaben müssen:
- Für Klasse ${grade} verständlich sein
- Klare, einfache Anweisungen haben (Kinder müssen genau wissen, was zu tun ist)
- Logisch und spielbar sein
- Kindgerechte Sprache verwenden

**SCHRITT 4: VALIDIERUNG**
Prüfe jede Aufgabe:
- Ist die Anweisung klar verständlich?
- Weiß ein Kind genau, was zu tun ist?
- Sind alle benötigten Felder vorhanden?
- Ist der Typ korrekt (kein "matching" oder "input")?

Antworte im folgenden JSON-Format:
{
  "worksheetType": "Beschreibung des Themas",
  "selectedType": "word-classification",  // Der gewählte Typ (MUSS einer der 6 sein!)
  "tasks": [
    {
      "type": "word-classification",  // MUSS einer der 6 erlaubten Typen sein!
      "stem": "Ordne die Wörter den Wortarten zu.",
      "words": ["Haus", "laufen", "schön", "ich"],
      "categories": ["Nomen", "Verben", "Adjektive", "Pronomen"],
      "correctMapping": {"Haus": "Nomen", "laufen": "Verben", "schön": "Adjektive", "ich": "Pronomen"},
      "difficulty": "mittel",
      "explanation": "Nomen sind Hauptwörter wie 'Haus'. Verben sind Tätigkeitswörter wie 'laufen'. Adjektive beschreiben Eigenschaften wie 'schön'. Pronomen ersetzen Nomen wie 'ich'."
    },
    {
      "type": "fill-blank",
      "stem": "Setze richtig ein: ä oder e?",
      "blanks": ["ä", "e", "ä"],
      "blankOptions": [["ä", "e"], ["ä", "e"], ["ä", "e"]],
      "difficulty": "mittel",
      "explanation": "Überlege, ob das Wort mit ä oder e geschrieben wird."
    },
    {
      "type": "multiple-choice",
      "stem": "Wie viel ist 3 + 5?",
      "options": ["6", "7", "8", "9"],
      "answers": 2,
      "difficulty": "leicht",
      "explanation": "Bei 3 + 5 kannst du zählen: Starte bei 3 und zähle 5 weiter: 3... 4, 5, 6, 7, 8! Das Ergebnis ist 8."
    }
  ]
}

**WICHTIG:**
- Nur valides JSON zurückgeben
- Keine Markdown-Formatierung
- Alle Aufgaben müssen zum Fach ${subjectName} passen
- Schwierigkeit an Klasse ${grade} anpassen
- NUR die 6 erlaubten Typen verwenden!
- NICHT "matching", "input" oder andere Typen erfinden!`;

      // Beste verfügbare Modelle (in Reihenfolge: neueste zuerst)
      // GPT-4.1 ist neuer als GPT-4o und bietet bessere Qualität
      const modelsToTry = [
        'gpt-4.1',         // Primär - neueste GPT-4 Variante (besser als gpt-4o)
        'gpt-4.1-mini',    // Fallback - kostengünstigere Variante
        'gpt-4o',          // Fallback - aktueller Standard
        'gpt-4o-mini',     // Fallback - kostengünstige Variante
      ];
      let response = null;
      let lastError: Error | null = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`🤖 Versuche Modell ${modelName} für Task-Generierung...`);
          
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              temperature: 0.7,
              max_tokens: 3000,
              response_format: { type: 'json_object' },
            }),
          });

          if (response.ok) {
            console.log(`✅ Modell ${modelName} erfolgreich verwendet`);
            break;
          } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || response.statusText;
            lastError = new Error(`Modell ${modelName}: ${errorMessage}`);
            console.warn(`⚠️ Modell ${modelName} nicht verfügbar (${response.status}):`, errorMessage);
            continue;
          }
        } catch (modelError: any) {
          console.warn(`⚠️ Fehler mit Modell ${modelName}:`, modelError);
          lastError = modelError;
          continue;
        }
      }

      if (!response || !response.ok) {
        // Nur im Fehlerfall die Response lesen
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        const errorCode = errorData.error?.code || response.status;
        
        // Spezifische Fehlerbehandlung
        if (response.status === 401) {
          throw new Error(`OpenAI API Authentifizierung fehlgeschlagen. Bitte prüfen Sie VITE_OPENAI_API_KEY in .env.local`);
        } else if (response.status === 429) {
          throw new Error(`OpenAI API Rate Limit erreicht. Bitte versuchen Sie es später erneut.`);
        } else if (response.status === 500 || response.status === 503) {
          throw new Error(`OpenAI API temporär nicht verfügbar. Bitte versuchen Sie es später erneut.`);
        }
        
        throw lastError || new Error(`OpenAI API Fehler (${errorCode}): ${errorMessage}`);
      }

      // Nur im Erfolgsfall die Response lesen
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
      const worksheetType = parsedResponse.worksheetType || 'Unbekannt';
      const taskFormats = parsedResponse.taskFormats || [];

      console.log(`📋 Arbeitsblatt-Typ erkannt: ${worksheetType}`);
      console.log(`📝 Aufgabenformate: ${taskFormats.join(', ')}`);
      console.log(`✅ ${tasks.length} Aufgaben generiert`);

      return tasks.map((task: any) => {
        // Normalisiere answers - keine verschachtelten Arrays erlauben
        let normalizedAnswers = task.answers;
        
        // Wenn answers ein verschachteltes Array ist, flache es
        if (Array.isArray(normalizedAnswers) && normalizedAnswers.length > 0) {
          if (Array.isArray(normalizedAnswers[0])) {
            // Verschachteltes Array - konvertiere zu flachem Array
            normalizedAnswers = normalizedAnswers.flat();
          }
        }
        
        // Normalisiere options - keine verschachtelten Arrays erlauben
        let normalizedOptions = task.options || [];
        if (Array.isArray(normalizedOptions) && normalizedOptions.length > 0) {
          if (Array.isArray(normalizedOptions[0])) {
            // Verschachteltes Array - konvertiere zu flachem Array
            normalizedOptions = normalizedOptions.flat();
          }
        }
        
        return validateAndNormalizeTask({
          stem: task.stem,
          options: normalizedOptions,
          answers: normalizedAnswers,
          difficulty: (task.difficulty || 'mittel') as 'leicht' | 'mittel' | 'schwer',
          explanation: task.explanation || '',
          type: task.type || 'multiple-choice',
          // Neue Felder für Phase 1A Typen
          blanks: task.blanks,
          blankOptions: task.blankOptions,
          caseSensitive: task.caseSensitive,
          words: task.words,
          categories: task.categories,
          correctMapping: task.correctMapping,
          problems: task.problems,
          operation: task.operation,
          numberRange: task.numberRange,
          levels: task.levels,
          structure: task.structure,
          context: task.context,
          calculation: task.calculation,
          unit: task.unit,
        });
      });
    } catch (error: any) {
      console.error('❌ Fehler bei OpenAI Aufgaben-Generierung:', error);
      throw new Error(`OpenAI Aufgaben-Generierung Fehler: ${error.message}`);
    }
  };

  // Gemeinsame Funktion zum Speichern von Tasks
  const saveTasksToFirestore = async (
    upload: Upload,
    generatedTasks: any[],
    provider: 'gemini' | 'openai'
  ): Promise<number> => {
    const uploadRef = doc(db, 'users', parentUid, 'uploads', upload.id);
    
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
      throw new Error('Keine Kinder gefunden. Bitte verknüpfen Sie zuerst ein Kind mit Ihrem Konto.');
    }

    // Aufgaben für jedes Kind erstellen
    let tasksCreated = 0;
    for (const kidId of kids) {
      for (const task of generatedTasks) {
        // Sicherstellen, dass answers kein verschachteltes Array ist
        let safeAnswers = task.answers;
        if (Array.isArray(safeAnswers) && safeAnswers.length > 0 && Array.isArray(safeAnswers[0])) {
          safeAnswers = safeAnswers.flat();
        }
        
        // Sicherstellen, dass options kein verschachteltes Array ist
        let safeOptions = task.options || [];
        if (Array.isArray(safeOptions) && safeOptions.length > 0 && Array.isArray(safeOptions[0])) {
          safeOptions = safeOptions.flat();
        }
        
        // Für neue Typen: answers kann undefined sein - Fallback erstellen
        let safeAnswersForFirestore = safeAnswers;
        if (safeAnswersForFirestore === undefined || safeAnswersForFirestore === null) {
          // Fallback basierend auf Typ
          if (task.type === 'fill-blank' && task.blanks) {
            safeAnswersForFirestore = task.blanks.join(',');
          } else if (task.type === 'word-classification' && task.correctMapping) {
            safeAnswersForFirestore = JSON.stringify(task.correctMapping);
          } else if (task.type === 'number-input' && task.problems) {
            safeAnswersForFirestore = task.problems.map((p: any) => p.answer || '').join(',');
          } else if (task.type === 'number-pyramid' && task.structure) {
            safeAnswersForFirestore = JSON.stringify(task.structure);
          } else if (task.type === 'word-problem' && task.correctAnswer) {
            safeAnswersForFirestore = String(task.correctAnswer);
          } else {
            safeAnswersForFirestore = ''; // Leerer String statt undefined
          }
        }
        
        // Erstelle Task-Dokument ohne undefined Werte
        const taskDoc: any = {
          stem: task.stem || '',
          options: safeOptions,
          answers: safeAnswersForFirestore,
          difficulty: task.difficulty || 'mittel',
          explanation: task.explanation || '',
          type: task.type || 'multiple-choice',
          uploadId: upload.id,
          subject: upload.subject,
          grade: upload.grade,
          status: 'pending',
          createdAt: new Date().toISOString(),
          provider: provider,
        };
        
        // Füge neue Felder nur hinzu wenn sie definiert sind
        if (task.blanks) taskDoc.blanks = task.blanks;
        if (task.blankOptions) taskDoc.blankOptions = task.blankOptions;
        if (task.caseSensitive !== undefined) taskDoc.caseSensitive = task.caseSensitive;
        if (task.words) taskDoc.words = task.words;
        if (task.categories) taskDoc.categories = task.categories;
        if (task.correctMapping) taskDoc.correctMapping = task.correctMapping;
        if (task.problems) taskDoc.problems = task.problems;
        if (task.operation) taskDoc.operation = task.operation;
        if (task.numberRange) taskDoc.numberRange = task.numberRange;
        if (task.levels) taskDoc.levels = task.levels;
        if (task.structure) taskDoc.structure = task.structure;
        if (task.context) taskDoc.context = task.context;
        if (task.calculation) taskDoc.calculation = task.calculation;
        if (task.unit) taskDoc.unit = task.unit;
        
        await addDoc(
          collection(db, 'users', parentUid, 'kids', kidId, 'tasks'),
          taskDoc
        );
        tasksCreated++;
      }
    }

    return tasksCreated;
  };

  // Verarbeitung mit Gemini
  const processWithGemini = async (upload: Upload) => {
    try {
      const uploadRef = doc(db, 'users', parentUid, 'uploads', upload.id);
      await updateDoc(uploadRef, { status: 'processing' });

      // OCR
      const ocrResult = await performOCR(upload.downloadURL, upload.storagePath || null);
      if (ocrResult.text.length < 50) {
        throw new Error('Zu wenig Text extrahiert.');
      }

      // Tasks mit Gemini generieren
      const generatedTasks = await generateTasksWithGemini(ocrResult.text, upload.subject, upload.grade);
      if (generatedTasks.length === 0) {
        throw new Error('Keine Aufgaben konnten generiert werden.');
      }

      // Speichern
      const tasksCreated = await saveTasksToFirestore(upload, generatedTasks, 'gemini');

      await updateDoc(uploadRef, {
        status: 'ready',
        tasksGenerated: tasksCreated,
        confidence: ocrResult.confidence,
        pages: ocrResult.pages,
        provider: 'gemini',
      });

      await loadTasksForUpload(upload.id);
      alert(`✅ Verarbeitung abgeschlossen (Gemini)!\n\n📄 ${ocrResult.text.length} Zeichen\n📝 ${tasksCreated} Aufgaben erstellt`);
    } catch (error: any) {
      console.error('❌ Fehler bei Gemini-Verarbeitung:', error);
      const uploadRef = doc(db, 'users', parentUid, 'uploads', upload.id);
      await updateDoc(uploadRef, {
        status: 'error',
        errors: [error.message || 'Unbekannter Fehler'],
      });
      alert(`Fehler: ${error.message}`);
    }
  };

  // Verarbeitung mit OpenAI
  const processWithOpenAI = async (upload: Upload) => {
    try {
      const uploadRef = doc(db, 'users', parentUid, 'uploads', upload.id);
      await updateDoc(uploadRef, { status: 'processing' });

      // OCR
      const ocrResult = await performOCR(upload.downloadURL, upload.storagePath || null);
      if (ocrResult.text.length < 50) {
        throw new Error('Zu wenig Text extrahiert.');
      }

      // Tasks mit OpenAI generieren
      const generatedTasks = await generateTasksWithOpenAI(ocrResult.text, upload.subject, upload.grade);
      if (generatedTasks.length === 0) {
        throw new Error('Keine Aufgaben konnten generiert werden.');
      }

      // Speichern
      const tasksCreated = await saveTasksToFirestore(upload, generatedTasks, 'openai');

      await updateDoc(uploadRef, {
        status: 'ready',
        tasksGenerated: tasksCreated,
        confidence: ocrResult.confidence,
        pages: ocrResult.pages,
        provider: 'openai',
      });

      await loadTasksForUpload(upload.id);
      alert(`✅ Verarbeitung abgeschlossen (OpenAI)!\n\n📄 ${ocrResult.text.length} Zeichen\n📝 ${tasksCreated} Aufgaben erstellt\n💰 Kosten: ~$0.02`);
    } catch (error: any) {
      console.error('❌ Fehler bei OpenAI-Verarbeitung:', error);
      const uploadRef = doc(db, 'users', parentUid, 'uploads', upload.id);
      await updateDoc(uploadRef, {
        status: 'error',
        errors: [error.message || 'Unbekannter Fehler'],
      });
      alert(`Fehler: ${error.message}`);
    }
  };

  // Verarbeitung mit BEIDEN (Vergleich)
  const [comparisonResults, setComparisonResults] = useState<{
    gemini: any[];
    openai: any[];
    uploadId: string | null;
  }>({ gemini: [], openai: [], uploadId: null });
  const [expandedComparisonTasks, setExpandedComparisonTasks] = useState<Set<string>>(new Set());
  
  const toggleComparisonTask = (provider: 'gemini' | 'openai', index: number) => {
    const key = `${provider}-${index}`;
    setExpandedComparisonTasks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const processWithBoth = async (upload: Upload) => {
    try {
      const uploadRef = doc(db, 'users', parentUid, 'uploads', upload.id);
      await updateDoc(uploadRef, { status: 'processing' });

      // OCR (einmal für beide)
      const ocrResult = await performOCR(upload.downloadURL, upload.storagePath || null);
      if (ocrResult.text.length < 50) {
        throw new Error('Zu wenig Text extrahiert.');
      }

      // Beide parallel generieren
      const [geminiTasks, openaiTasks] = await Promise.all([
        generateTasksWithGemini(ocrResult.text, upload.subject, upload.grade).catch(e => {
          console.error('Gemini Fehler:', e);
          return [];
        }),
        generateTasksWithOpenAI(ocrResult.text, upload.subject, upload.grade).catch(e => {
          console.error('OpenAI Fehler:', e);
          return [];
        }),
      ]);

      // Vergleichs-Ergebnisse speichern
      setComparisonResults({
        gemini: geminiTasks,
        openai: openaiTasks,
        uploadId: upload.id,
      });

      await updateDoc(uploadRef, {
        status: 'ready',
        confidence: ocrResult.confidence,
        pages: ocrResult.pages,
      });

      // Zeige Vergleichs-UI (wird unten gerendert)
    } catch (error: any) {
      console.error('❌ Fehler bei Vergleichs-Verarbeitung:', error);
      const uploadRef = doc(db, 'users', parentUid, 'uploads', upload.id);
      await updateDoc(uploadRef, {
        status: 'error',
        errors: [error.message || 'Unbekannter Fehler'],
      });
      alert(`Fehler: ${error.message}`);
    }
  };

  const selectProviderTasks = async (upload: Upload, provider: 'gemini' | 'openai', tasks: any[]) => {
    try {
      const tasksCreated = await saveTasksToFirestore(upload, tasks, provider);
      
      const uploadRef = doc(db, 'users', parentUid, 'uploads', upload.id);
      await updateDoc(uploadRef, {
        tasksGenerated: tasksCreated,
        provider: provider,
      });

      await loadTasksForUpload(upload.id);
      setComparisonResults({ gemini: [], openai: [], uploadId: null });
      
      alert(`✅ ${tasksCreated} Aufgaben von ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} übernommen!`);
    } catch (error: any) {
      alert(`Fehler beim Speichern: ${error.message}`);
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
                      Wählen Sie eine KI für die Aufgaben-Generierung:
                    </p>
                    <div className="flex flex-col gap-3 max-w-md mx-auto">
                      <Button
                        variant="primary"
                        onClick={() => processWithGemini(upload)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        🤖 Mit Gemini generieren (kostenlos)
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => processWithOpenAI(upload)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        🤖 Mit OpenAI generieren (~$0.02)
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => processWithBoth(upload)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        🔬 Mit BEIDEN vergleichen (Test)
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Vergleichs-Ergebnisse anzeigen - Detaillierte Ansicht */}
                {comparisonResults.uploadId === upload.id && 
                 (comparisonResults.gemini.length > 0 || comparisonResults.openai.length > 0) && (
                  <div className="mb-6 p-6 bg-purple-50 rounded-lg border-2 border-purple-300">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-purple-800">
                        🔬 Vergleich: Gemini vs. OpenAI
                      </h4>
                      <Button
                        variant="secondary"
                        onClick={() => setComparisonResults({ gemini: [], openai: [], uploadId: null })}
                        className="bg-gray-400 hover:bg-gray-500 text-white"
                      >
                        ✕ Vergleich schließen
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Beide Modelle haben Aufgaben generiert. Klicke auf eine Aufgabe, um Details zu sehen. 
                      Unten kannst du dich für eine Version entscheiden.
                    </p>
                    
                    {/* Gemini Aufgaben */}
                    {comparisonResults.gemini.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-lg font-bold text-green-800 flex items-center gap-2">
                            🤖 Gemini ({comparisonResults.gemini.length} Aufgaben)
                            <Badge className="bg-green-100 text-green-800">Kostenlos</Badge>
                          </h5>
                          <Button
                            variant="primary"
                            onClick={() => selectProviderTasks(upload, 'gemini', comparisonResults.gemini)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            ✅ Diese Version nehmen
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {comparisonResults.gemini.map((task, idx) => {
                            const taskKey = `gemini-${idx}`;
                            const isExpanded = expandedComparisonTasks.has(taskKey);
                            
                            return (
                              <Card
                                key={idx}
                                className="border-2 border-green-300 bg-white"
                              >
                                <div className="flex items-center justify-between p-3">
                                  <div className="flex items-center gap-3">
                                    <Badge className="bg-green-200 text-green-800">
                                      {task.type || 'unbekannt'}
                                    </Badge>
                                    <span className="text-sm font-semibold text-gray-700">
                                      Aufgabe #{idx + 1}
                                    </span>
                                    {task.difficulty && (
                                      <span className="text-xs text-gray-500">
                                        Schwierigkeit: {task.difficulty}
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    variant="secondary"
                                    onClick={() => toggleComparisonTask('gemini', idx)}
                                    className="text-sm"
                                  >
                                    {isExpanded ? '▼ Ausblenden' : '▶ Details anzeigen'}
                                  </Button>
                                </div>
                                
                                {isExpanded && (
                                  <div className="p-4 bg-green-50 border-t border-green-200">
                                    <div className="space-y-4">
                                      {/* Vorschau: So sieht das Kind die Aufgabe */}
                                      <div className="mb-4">
                                        <TaskPreview 
                                          task={task} 
                                          grade={upload.grade} 
                                          subject={upload.subject} 
                                        />
                                      </div>
                                      
                                      {/* Rohdaten für Debugging */}
                                      <div className="border-t border-green-300 pt-4">
                                        <div className="text-xs font-semibold text-gray-500 mb-2">
                                          📋 Rohdaten (für Debugging):
                                        </div>
                                        <div className="space-y-3">
                                          <div>
                                            <div className="text-sm font-semibold text-gray-700 mb-1">
                                              Aufgabe:
                                            </div>
                                            <div className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded border">
                                              {task.stem || task.question || 'Keine Aufgabe'}
                                            </div>
                                          </div>
                                          
                                          {/* Typ-spezifische Details */}
                                      {task.type === 'fill-blank' && (
                                        <>
                                          {task.blanks && (
                                            <div>
                                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                                Richtige Antworten:
                                              </div>
                                              <div className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {task.blanks.join(', ')}
                                              </div>
                                            </div>
                                          )}
                                          {task.blankOptions && (
                                            <div>
                                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                                Optionen pro Lücke:
                                              </div>
                                              <div className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {task.blankOptions.map((opts: any, i: number) => {
                                                  // Sichere Validierung: Prüfe ob opts ein Array ist
                                                  const optionsArray = Array.isArray(opts) ? opts : [String(opts || '')];
                                                  return `Lücke ${i + 1}: ${optionsArray.join(' / ')}`;
                                                }).join(', ')}
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                      
                                      {task.type === 'word-classification' && (
                                        <>
                                          {task.words && (
                                            <div>
                                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                                Wörter:
                                              </div>
                                              <div className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {task.words.join(', ')}
                                              </div>
                                            </div>
                                          )}
                                          {task.categories && (
                                            <div>
                                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                                Kategorien:
                                              </div>
                                              <div className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {task.categories.join(', ')}
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                      
                                      {task.type === 'number-input' && task.problems && (
                                        <div>
                                          <div className="text-sm font-semibold text-gray-700 mb-1">
                                            Rechenaufgaben:
                                          </div>
                                          <div className="space-y-1">
                                            {task.problems.map((p: any, pIdx: number) => (
                                              <div key={pIdx} className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {p.question} = {p.answer}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {task.type === 'word-problem' && (
                                        <>
                                          {task.correctAnswer && (
                                            <div>
                                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                                Richtige Antwort:
                                              </div>
                                              <div className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {task.correctAnswer}
                                              </div>
                                            </div>
                                          )}
                                          {task.calculation && (
                                            <div>
                                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                                Rechnung:
                                              </div>
                                              <div className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {task.calculation}
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                      
                                      {task.options && task.options.length > 0 && (
                                        <div>
                                          <div className="text-sm font-semibold text-gray-700 mb-1">
                                            Optionen:
                                          </div>
                                          <div className="text-sm text-gray-800 bg-white p-2 rounded">
                                            {task.options.map((opt: string, optIdx: number) => 
                                              `${optIdx + 1}. ${opt}`
                                            ).join('\n')}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {task.explanation && (
                                        <div>
                                          <div className="text-sm font-semibold text-gray-700 mb-1">
                                            💡 Erklärung:
                                          </div>
                                          <div className="text-sm text-gray-700 bg-white p-3 rounded border-l-4 border-green-400">
                                            {task.explanation}
                                          </div>
                                        </div>
                                      )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* OpenAI Aufgaben */}
                    {comparisonResults.openai.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                            🤖 OpenAI ({comparisonResults.openai.length} Aufgaben)
                            <Badge className="bg-blue-100 text-blue-800">~$0.02</Badge>
                          </h5>
                          <Button
                            variant="primary"
                            onClick={() => selectProviderTasks(upload, 'openai', comparisonResults.openai)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            ✅ Diese Version nehmen
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {comparisonResults.openai.map((task, idx) => {
                            const taskKey = `openai-${idx}`;
                            const isExpanded = expandedComparisonTasks.has(taskKey);
                            
                            return (
                              <Card
                                key={idx}
                                className="border-2 border-blue-300 bg-white"
                              >
                                <div className="flex items-center justify-between p-3">
                                  <div className="flex items-center gap-3">
                                    <Badge className="bg-blue-200 text-blue-800">
                                      {task.type || 'unbekannt'}
                                    </Badge>
                                    <span className="text-sm font-semibold text-gray-700">
                                      Aufgabe #{idx + 1}
                                    </span>
                                    {task.difficulty && (
                                      <span className="text-xs text-gray-500">
                                        Schwierigkeit: {task.difficulty}
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    variant="secondary"
                                    onClick={() => toggleComparisonTask('openai', idx)}
                                    className="text-sm"
                                  >
                                    {isExpanded ? '▼ Ausblenden' : '▶ Details anzeigen'}
                                  </Button>
                                </div>
                                
                                {isExpanded && (
                                  <div className="p-4 bg-blue-50 border-t border-blue-200">
                                    <div className="space-y-4">
                                      {/* Vorschau: So sieht das Kind die Aufgabe */}
                                      <div className="mb-4">
                                        <TaskPreview 
                                          task={task} 
                                          grade={upload.grade} 
                                          subject={upload.subject} 
                                        />
                                      </div>
                                      
                                      {/* Rohdaten für Debugging */}
                                      <div className="border-t border-blue-300 pt-4">
                                        <div className="text-xs font-semibold text-gray-500 mb-2">
                                          📋 Rohdaten (für Debugging):
                                        </div>
                                        <div className="space-y-3">
                                          <div>
                                            <div className="text-sm font-semibold text-gray-700 mb-1">
                                              Aufgabe:
                                            </div>
                                            <div className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded border">
                                              {task.stem || task.question || 'Keine Aufgabe'}
                                            </div>
                                          </div>
                                          
                                          {/* Typ-spezifische Details */}
                                      {task.type === 'fill-blank' && (
                                        <>
                                          {task.blanks && (
                                            <div>
                                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                                Richtige Antworten:
                                              </div>
                                              <div className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {task.blanks.join(', ')}
                                              </div>
                                            </div>
                                          )}
                                          {task.blankOptions && (
                                            <div>
                                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                                Optionen pro Lücke:
                                              </div>
                                              <div className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {task.blankOptions.map((opts: any, i: number) => {
                                                  // Sichere Validierung: Prüfe ob opts ein Array ist
                                                  const optionsArray = Array.isArray(opts) ? opts : [String(opts || '')];
                                                  return `Lücke ${i + 1}: ${optionsArray.join(' / ')}`;
                                                }).join(', ')}
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                      
                                      {task.type === 'word-classification' && (
                                        <>
                                          {task.words && (
                                            <div>
                                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                                Wörter:
                                              </div>
                                              <div className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {task.words.join(', ')}
                                              </div>
                                            </div>
                                          )}
                                          {task.categories && (
                                            <div>
                                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                                Kategorien:
                                              </div>
                                              <div className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {task.categories.join(', ')}
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                      
                                      {task.type === 'number-input' && task.problems && (
                                        <div>
                                          <div className="text-sm font-semibold text-gray-700 mb-1">
                                            Rechenaufgaben:
                                          </div>
                                          <div className="space-y-1">
                                            {task.problems.map((p: any, pIdx: number) => (
                                              <div key={pIdx} className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {p.question} = {p.answer}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {task.type === 'word-problem' && (
                                        <>
                                          {task.correctAnswer && (
                                            <div>
                                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                                Richtige Antwort:
                                              </div>
                                              <div className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {task.correctAnswer}
                                              </div>
                                            </div>
                                          )}
                                          {task.calculation && (
                                            <div>
                                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                                Rechnung:
                                              </div>
                                              <div className="text-sm text-gray-800 bg-white p-2 rounded">
                                                {task.calculation}
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                      
                                      {task.options && task.options.length > 0 && (
                                        <div>
                                          <div className="text-sm font-semibold text-gray-700 mb-1">
                                            Optionen:
                                          </div>
                                          <div className="text-sm text-gray-800 bg-white p-2 rounded whitespace-pre-wrap">
                                            {task.options.map((opt: string, optIdx: number) => 
                                              `${optIdx + 1}. ${opt}`
                                            ).join('\n')}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {task.explanation && (
                                        <div>
                                          <div className="text-sm font-semibold text-gray-700 mb-1">
                                            💡 Erklärung:
                                          </div>
                                          <div className="text-sm text-gray-700 bg-white p-3 rounded border-l-4 border-blue-400">
                                            {task.explanation}
                                          </div>
                                        </div>
                                      )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
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

