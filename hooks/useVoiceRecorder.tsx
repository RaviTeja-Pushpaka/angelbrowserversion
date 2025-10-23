/* eslint-disable no-unused-vars */
import { ErrorToast } from '@/components/Toast';
import { useCallback, useEffect, useRef, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function useVoiceRecorder({
  audioStream,
  onAddUserTurn,
  onLiveTranscript,
  onTranscribingChange,
}: {
  audioStream: MediaStream | null;
  onAddUserTurn: (txt: string) => void;
  onLiveTranscript: (txt: string) => void;
  onTranscribingChange: (isTranscribing: boolean) => void;
}) {
  const { refreshSubscription } = useAuth();
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const resetStopRef = useRef(false);
  type QueueItem = { blob: Blob; isFinal: boolean };
  const queueRef = useRef<QueueItem[]>([]);
  const busyRef = useRef(false);
  const recordingRef = useRef(false);
  const recognitionRef = useRef<any | null>(null);
  const nativeBufferRef = useRef<string>('');
  const interimRef = useRef<string>('');
  const requestIntervalRef = useRef<any>(null);
  const interimChunksRef = useRef<Blob[]>([]);
  const lastInterimSentRef = useRef<number>(0);

  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const formatTime = (s: number) =>
    new Date(s * 1000).toISOString().substring(14, 19);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  const startTimer = () => {
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((p) => p + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setSeconds(0);
  };

  const streamBufferRef = useRef<string>('');

  const processNext = useCallback(async () => {
    if (busyRef.current || queueRef.current.length === 0) return;
    busyRef.current = true;

    const item = queueRef.current.shift()!;
    const blob = item.blob;
    try {
      // Only show transcribing indicator for the final pass to avoid flicker
      if (item.isFinal) {
        onTranscribingChange(true);
      }
      
      // Use the new Angel AI API endpoint for transcription
        const formData = new FormData();
        formData.append('type', 'transcribe');
        formData.append('audio', blob, `qa-${Date.now()}.webm`);
        const token = await auth.currentUser?.getIdToken();
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        // Mark interim requests to optimize credit deduction
        if (!item.isFinal) headers['x-interim'] = 'true';

        const transcribeResponse = await fetch('/api/angel-ai', {
          method: 'POST',
          body: formData, // Send as FormData, not JSON
          headers,
        });
        
        if (!transcribeResponse.ok) {
          throw new Error('Transcription failed');
        }
        
        const { transcript } = await transcribeResponse.json();
        const text = transcript.trim();

      if (item.isFinal) {
        // Finalize: show last transcript and send to chat
        onLiveTranscript(text);
        onTranscribingChange(false);
        onAddUserTurn(text);
        // Reset buffer for next session
        streamBufferRef.current = '';
      } else {
        // Streaming live transcript: append to buffer and update UI
        if (text) {
          streamBufferRef.current = (streamBufferRef.current + ' ' + text).trim();
          onLiveTranscript(streamBufferRef.current);
        }
      }
      
    } catch (error) {
      console.error('❌ Processing error:', error);
      if (item.isFinal) {
        onTranscribingChange(false);
      }
      ErrorToast('Processing failed. Please try again.');
    } finally {
      busyRef.current = false;
      // Skip refresh for interim requests to improve speed - only refresh on final
      if (item.isFinal) {
        try {
          // Delay refresh slightly to batch with other operations
          setTimeout(() => refreshSubscription().catch(() => {}), 100);
        } catch {}
      }
      processNext();
    }
  }, [onAddUserTurn, onLiveTranscript, onTranscribingChange]);

  const enqueue = useCallback(
    (item: QueueItem) => {
      // Keep the queue lean for interims: drop older interims and keep only the latest
      if (!item.isFinal) {
        queueRef.current = queueRef.current.filter(q => q.isFinal);
      }
      queueRef.current.push(item);
      processNext();
    },
    [processNext]
  );

  // Native (browser) speech recognition path for instant, streaming transcript
  const isNativeAvailable = typeof window !== 'undefined' &&
    (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));

  const startNative = useCallback(() => {
    try {
      // Initialize recognition
      const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) return;
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      nativeBufferRef.current = '';
      onTranscribingChange(true);
      setRecording(true);

      rec.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) {
            nativeBufferRef.current += res[0].transcript + ' ';
          } else {
            interim += res[0].transcript;
          }
        }
        interimRef.current = interim;
        const liveText = (nativeBufferRef.current + ' ' + interim).trim();
        onLiveTranscript(liveText);
      };

      rec.onerror = () => {
        // Fallback to server transcription if native fails
        try { rec.stop(); } catch {}
        recognitionRef.current = null;
        setRecording(false);
        onTranscribingChange(false);
      };

      rec.onend = () => {
        // If user stopped, finalize
        if (!recordingRef.current) {
          onTranscribingChange(false);
          setRecording(false);
          return;
        }
        // Auto-restart to keep continuous
        try { rec.start(); } catch {}
      };

      recognitionRef.current = rec;
      recordingRef.current = true;
      rec.start();
      startTimer();
    } catch {
      // ignore; fallback will be used
    }
  }, [onAddUserTurn, onLiveTranscript, onTranscribingChange]);

  const stopNative = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    recordingRef.current = false;
    onTranscribingChange(false);
    stopTimer();
    setRecording(false);
    // On manual stop, send the accumulated transcript once
    const finalText = (nativeBufferRef.current + ' ' + (interimRef.current || '')).trim();
    nativeBufferRef.current = '';
    interimRef.current = '';
    if (finalText) onAddUserTurn(finalText);
    // Clear live transcript display after finishing
    onLiveTranscript('');
    // Reset streaming buffers
    streamBufferRef.current = '';
  }, [onTranscribingChange]);

  const startRecorder = useCallback(() => {
    if (!audioStream || audioStream.getAudioTracks().length === 0) {
      ErrorToast('No tab audio – did you pick "Share tab audio"?');
      return;
    }

    chunksRef.current = [];
    const stream = new MediaStream(audioStream.getAudioTracks());
    // Reset UI/live buffer at start
    streamBufferRef.current = '';
    onLiveTranscript('');

    // Optimized audio formats for transcription speed - prioritize smaller, faster formats
    const candidateTypes = [
      'audio/webm;codecs=opus', // Best for transcription - small size, good quality
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2', // AAC - widely supported, efficient
      'audio/ogg;codecs=opus',  // Alternative opus format
      'audio/mp4',
    ];
    let selectedMimeType: string | undefined = undefined;
    for (const t of candidateTypes) {
      // @ts-ignore - isTypeSupported exists in browsers
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
        selectedMimeType = t;
        break;
      }
    }

    let rec: MediaRecorder;
    try {
      // Optimize for speech recognition with lower bitrate and sample rate
      const options = selectedMimeType ? {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 32000, // Lower bitrate for faster processing
      } : undefined;
      rec = new MediaRecorder(stream, options);
    } catch {
      // Fallback with no options
      rec = new MediaRecorder(stream);
      selectedMimeType = rec.mimeType || selectedMimeType;
    }

    rec.ondataavailable = (e) => {
      if (!e.data.size) return;
      // Accumulate for final transcript
      chunksRef.current.push(e.data);
      // Maintain a rolling window for better interim recognition (≈3s)
      interimChunksRef.current.push(e.data);
      if (interimChunksRef.current.length > 3) {
        interimChunksRef.current.shift();
      }
      // Reduced interim transcripts for better performance - increased intervals
      if (rec.state === 'recording') {
        const now = Date.now();
        const enoughWindow = interimChunksRef.current.length >= 6; // at least ~6s for better accuracy and less API calls
        const cooldownPassed = now - (lastInterimSentRef.current || 0) > 5000; // 5s cooldown (reduced from 2s)
        if (enoughWindow && cooldownPassed) {
          const rolling = new Blob(interimChunksRef.current, { type: selectedMimeType || 'audio/webm' });
          lastInterimSentRef.current = now;
          enqueue({ blob: rolling, isFinal: false });
        }
      }
    };

    rec.onstop = () => {
      stopTimer();     
      setRecording(false);

      if (resetStopRef.current) {
        resetStopRef.current = false;
        chunksRef.current = [];
        startRecorder();
        setRecording(true);
        return;
      }

      // Clear periodic request interval
      if (requestIntervalRef.current) {
        clearInterval(requestIntervalRef.current);
        requestIntervalRef.current = null;
      }

      const segment = chunksRef.current;
      chunksRef.current = [];
      // Reset interim buffers immediately and clear live transcript
      interimChunksRef.current = [];
      lastInterimSentRef.current = 0;
      streamBufferRef.current = '';
      onLiveTranscript('');

      // Auto-process audio when stopping with a final, full segment
      if (segment.length) {
        const blob = new Blob(segment, { type: 'audio/webm' });
        enqueue({ blob, isFinal: true });
      }
    };

    // Optimized timeslice for better transcription performance - larger chunks for efficiency
    try {
      rec.start(3000); // 3s chunks for better efficiency and reduced API calls
    } catch {
      // Fallback to no timeslice
      rec.start();
    }
    mediaRecorderRef.current = rec;
    setRecording(true);
    startTimer(); 
  }, [audioStream, enqueue]);

  const stopRecorder = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (requestIntervalRef.current) {
      clearInterval(requestIntervalRef.current);
      requestIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (recording && !audioStream) {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      stopTimer();
      setRecording(false);

      resetStopRef.current = false;

      onTranscribingChange(false);
    }
  }, [audioStream, recording, onTranscribingChange]);

  const toggleRecorder = useCallback(() => {
    const hasProvidedStream = !!(audioStream && audioStream.getAudioTracks().length > 0);
    const isNativeActive = !!recognitionRef.current;
    const isCustomActive = mediaRecorderRef.current?.state === 'recording';

    // If something is active, stop that specific mode
    if (isNativeActive) {
      stopNative();
      return;
    }
    if (isCustomActive) {
      stopRecorder();
      return;
    }

    // Prioritize native speech recognition for better performance when available
    if (isNativeAvailable && !hasProvidedStream) {
      startNative();
      return;
    }

    // Use custom recorder for tab/screen audio or when native is not available
    if (hasProvidedStream) {
      startRecorder();
      return;
    }

    // Last resort
    startRecorder();
  }, [audioStream, isNativeAvailable, startNative, stopNative, startRecorder, stopRecorder]);

  // quickAnswer function removed - now auto-processes when stopping

  const clearContext = () => {
    if (!recordingRef.current) {
      ErrorToast('Start listening first.');
      return;
    }
    resetStopRef.current = true;
    stopRecorder();
  };

  return {
    recording,
    formattedTime: formatTime(seconds),
    toggleRecorder,
    clearContext,
  };
}
