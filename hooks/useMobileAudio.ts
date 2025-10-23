import { useEffect, useState } from 'react';

export const useMobileAudio = () => {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if getUserMedia is supported
    const checkSupport = () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setIsSupported(true);
      } else {
        setIsSupported(false);
        setError('Microphone access not supported on this device');
      }
    };

    checkSupport();
  }, []);

  const requestMicrophoneAccess = async () => {
    if (!isSupported) {
      setError('Microphone access not supported');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimized for speech recognition (reduced from 44100)
          channelCount: 1,   // Mono audio for speech
        }
      });
      
      setAudioStream(stream);
      setError(null);
      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      console.error('Error accessing microphone:', err);
      return null;
    }
  };

  const stopMicrophone = () => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  };

  return {
    audioStream,
    isSupported,
    error,
    requestMicrophoneAccess,
    stopMicrophone,
  };
};
