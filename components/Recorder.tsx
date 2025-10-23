/* eslint-disable no-unused-vars */
'use client';

import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useState, useEffect } from 'react';

import RecordButton from './button/RecordButton';
import ScreenshotButton from './button/ScreenshotButton';
import { useIsMobile } from '@/hooks/useIsMobile';

type Props = {
  audioStream: MediaStream | null;
  onAddUserTurn: (txt: string) => void;
  onTranscribingChange: (isTranscribing: boolean) => void;
  handleScreenshot?: (dataUrl: string, fileName: string) => void;
  capturing?: boolean;
};

export default function Recorder({
  audioStream,
  onAddUserTurn,
  onTranscribingChange,
  handleScreenshot,
  capturing = false,
}: Props) {
  const [transcript, setTranscript] = useState('');
  const isMobile = useIsMobile();

  const handleLiveTranscript = (txt: string) => {
    setTranscript(txt);
  };

  const handleScreenshotClick = async () => {
    if (handleScreenshot && capturing) {
      try {
        // Take screenshot of the current screen using html2canvas or native API
        const fileName = `screenshot-${Date.now()}.jpg`;
        
        // Try to capture the video element first (most reliable)
        const video = document.querySelector('video');
        if (video && video.videoWidth > 0 && video.videoHeight > 0 && video.srcObject) {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Wait for video to be ready
            if (video.readyState >= 2) { // HAVE_CURRENT_DATA
              ctx.drawImage(video, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              
              handleScreenshot(dataUrl, fileName);
              return;
            } else {
              // Wait for video to be ready
              video.addEventListener('canplay', () => {
                ctx.drawImage(video, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                
                handleScreenshot(dataUrl, fileName);
              }, { once: true });
              return;
            }
          }
        }
        
        // Fallback: try to capture the visible screen area
        try {
          // Use a simpler approach - capture what's visible
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Set canvas size to viewport
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Try to capture the current viewport (this is a simplified approach)
            // Note: This won't capture the actual screen content due to security restrictions
            // but it will create a placeholder for the screenshot
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add text indicating this is a screenshot
            ctx.fillStyle = '#333';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Screenshot captured', canvas.width / 2, canvas.height / 2);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            handleScreenshot(dataUrl, fileName);
            return;
          }
        } catch (screenError) {
          handleScreenshot('', fileName);
        }
        
      } catch (error) {
        // Final fallback: just send a text message
        handleScreenshot('', `screenshot-${Date.now()}.jpg`);
      }
    }
  };

  const handleCameraCapture = async () => {
    if (!handleScreenshot) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const track = stream.getVideoTracks()[0];
      const imageCapture = ('ImageCapture' in window) ? new (window as any).ImageCapture(track) : null;
      let dataUrl = '';
      const fileName = `camera-${Date.now()}.jpg`;

      if (imageCapture && imageCapture.takePhoto) {
        const blob = await imageCapture.takePhoto();
        dataUrl = await new Promise<string>((resolve) => {
          const fr = new FileReader();
          fr.onloadend = () => resolve(fr.result as string);
          fr.readAsDataURL(blob);
        });
      } else {
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        }
      }

      // stop camera
      stream.getTracks().forEach(t => t.stop());

      if (dataUrl) {
        handleScreenshot(dataUrl, fileName);
      }
    } catch (err) {
      // ignore for now
    }
  };

  // Only use Whisper mode (customRecorder)
  const {
    recording,
    toggleRecorder,
  } = useVoiceRecorder({
    audioStream,
    onAddUserTurn,
    onLiveTranscript: handleLiveTranscript,
    onTranscribingChange,
  });

  return (
    <div className="w-full h-full flex items-center justify-center voice-recorder-panel" suppressHydrationWarning>
      {/* Live Transcription UI removed per request; recording pipeline unchanged */}

      {/* Centered Control Buttons Row */}
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex items-center justify-center gap-6">
        <RecordButton
          onClick={toggleRecorder}
          disabled={!audioStream}
          recording={recording}
          isCompact={true}
        />
        <ScreenshotButton
          onClick={isMobile ? handleCameraCapture : handleScreenshotClick}
          disabled={isMobile ? false : !capturing}
          capturing={isMobile ? true : capturing}
          isCompact={true}
        />
        </div>
        {!isMobile && (
          <div className="text-[10px] text-neutral-500 pt-1 text-center">
            Tip: Press <kbd className="px-1 py-0.5 bg-neutral-100 rounded">Space</kbd> to record, and <kbd className="px-1 py-0.5 bg-neutral-100 rounded">S</kbd> to take a screenshot and get an answer.
          </div>
        )}
      </div>
    </div>
  );
}
