import { useRef, useState, useCallback, useEffect } from 'react';

export const useScreenCapture = (
  // eslint-disable-next-line no-unused-vars
  onStreamAvailable: (stream: MediaStream | null) => void
) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const meetStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const [capturing, setCapturing] = useState(false);
  const [loading, setLoading] = useState(false);

  const startCapture = useCallback(async () => {
    setLoading(true);
    try {
      const meet = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      let mic: MediaStream | null = null;
      try {
        mic = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000, // Optimized for speech recognition
            channelCount: 1,   // Mono audio for speech
          }
        });
      } catch (e) {
        // Mic might be blocked; continue with tab/system audio only
        console.warn('Microphone not available, proceeding with tab audio only');
      }

      // Mix system + mic audio (when available)
      const ctx = new AudioContext();
      await ctx.resume();
      const dest = ctx.createMediaStreamDestination();

      // Connect mic if present
      if (mic && mic.getAudioTracks().length > 0) {
        ctx.createMediaStreamSource(mic).connect(dest);
      }

      // Connect meet/tab audio if present
      const meetAudioTracks = meet.getAudioTracks();
      if (meetAudioTracks.length > 0) {
        ctx.createMediaStreamSource(new MediaStream(meetAudioTracks)).connect(dest);
      }

      // If no audio tracks at all, surface a helpful error
      if (!mic?.getAudioTracks().length && meetAudioTracks.length === 0) {
        throw new Error('No audio tracks available from tab or microphone. Ensure "Share tab audio" is checked.');
      }

      const preview = new MediaStream([
        ...meet.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      if (videoRef.current) {
        videoRef.current.srcObject = preview;
        await videoRef.current.play();
      }

      onStreamAvailable(dest.stream);

      meetStreamRef.current = meet;
      micStreamRef.current = mic;
      setCapturing(true);
    } catch (err) {
      console.error('Screen capture error:', err);
    } finally {
      setLoading(false);
    }
  }, [onStreamAvailable]);

  const stopCapture = useCallback(() => {
    meetStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());

    if (videoRef.current) videoRef.current.srcObject = null;

    onStreamAvailable(null);
    setCapturing(false);
  }, [onStreamAvailable]);

  // Handle stream end events
  useEffect(() => {
    const handleStreamEnd = () => {
      if (capturing) stopCapture();
    };

    const tracks = meetStreamRef.current?.getVideoTracks() ?? [];
    tracks.forEach((track) => track.addEventListener('ended', handleStreamEnd));

    return () => {
      tracks.forEach((track) =>
        track.removeEventListener('ended', handleStreamEnd)
      );
    };
  }, [capturing, stopCapture]);

  return {
    videoRef,
    capturing,
    loading,
    startCapture,
    stopCapture,
  };
};
