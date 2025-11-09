/**
 * Upload-Form für Eltern
 * Erlaubt das Hochladen von PDFs, Bildern oder Links für Aufgaben-Generierung
 */

import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { storage, db } from '../../services/firebase';
import { Button } from '../ui/Button';

interface UploadFormProps {
  parentUid: string;
}

export function UploadForm({ parentUid }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [subject, setSubject] = useState('mathematik');
  const [grade, setGrade] = useState<1 | 2 | 3 | 4>(1);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjects = [
    { id: 'mathematik', name: 'Mathematik' },
    { id: 'deutsch', name: 'Deutsch' },
    { id: 'sachunterricht', name: 'Sachunterricht' },
    { id: 'englisch', name: 'Englisch' },
    { id: 'musik', name: 'Musik' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Prüfe Dateityp
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Nur PDF, JPG oder PNG Dateien erlaubt');
        return;
      }
      // Prüfe Größe (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Datei zu groß (max 10MB)');
        return;
      }
      setFile(selectedFile);
      setError('');
      setLink(''); // Link zurücksetzen wenn Datei ausgewählt
    }
  };

  const handleUpload = async () => {
    if (!file && !link.trim()) {
      setError('Bitte wähle eine Datei oder gib einen Link ein');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setProgress(0);

    try {
      let storagePath = '';
      let downloadURL = '';

      if (file) {
        // Datei hochladen
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        storagePath = `users/${parentUid}/uploads/${timestamp}/${fileName}`;
        const storageRef = ref(storage, storagePath);
        
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(prog);
            },
            (error) => reject(error),
            async () => {
              downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      } else {
        // Link verwenden
        downloadURL = link.trim();
      }

      // Upload-Dokument in Firestore erstellen
      const uploadDoc = {
        parentId: parentUid,
        filename: file?.name || 'Link',
        subject,
        grade,
        status: 'pending', // Wird vom Agent verarbeitet
        sourceType: file ? 'file' : 'link',
        storagePath: file ? storagePath : null,
        downloadURL,
        createdAt: new Date().toISOString(),
        confidence: null,
        pages: null,
        errors: [],
      };

      await addDoc(collection(db, 'users', parentUid, 'uploads'), uploadDoc);

      setSuccess('Upload erfolgreich! Der Agent verarbeitet das Material jetzt.');
      setFile(null);
      setLink('');
      setProgress(0);
      
      // File-Input zurücksetzen
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reset nach 3 Sekunden
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Upload-Fehler:', err);
      setError(err.message || 'Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded-xl border-2 border-red-300">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-100 text-green-800 rounded-xl border-2 border-green-300">
          {success}
        </div>
      )}

      {/* Fach-Auswahl */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Fach
        </label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-300 focus:border-emerald-500"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Klassenstufe */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Klassenstufe
        </label>
        <select
          value={grade}
          onChange={(e) => setGrade(parseInt(e.target.value) as 1 | 2 | 3 | 4)}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-300 focus:border-emerald-500"
        >
          <option value={1}>Klasse 1</option>
          <option value={2}>Klasse 2</option>
          <option value={3}>Klasse 3</option>
          <option value={4}>Klasse 4</option>
        </select>
      </div>

      {/* Datei-Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Datei hochladen (PDF, JPG, PNG - max 10MB)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          disabled={uploading || !!link}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-300 focus:border-emerald-500"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            Ausgewählt: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Oder Link */}
      <div className="text-center text-gray-500">oder</div>

      {/* Link-Eingabe */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Link zu Arbeitsblatt/Material
        </label>
        <input
          type="url"
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setFile(null); // Datei zurücksetzen wenn Link eingegeben
          }}
          placeholder="https://..."
          disabled={uploading || !!file}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-300 focus:border-emerald-500"
        />
      </div>

      {/* Upload-Button */}
      <Button
        variant="primary"
        onClick={handleUpload}
        disabled={uploading || (!file && !link.trim())}
        className="w-full"
      >
        {uploading ? (
          <>
            {progress > 0 ? `Hochladen... ${Math.round(progress)}%` : 'Vorbereiten...'}
          </>
        ) : (
          '📤 Hochladen & Verarbeiten'
        )}
      </Button>

      {uploading && progress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

