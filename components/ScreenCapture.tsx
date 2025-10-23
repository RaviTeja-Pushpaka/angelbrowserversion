'use client';

import {
  Loader2,
  Monitor,
  MonitorPlay,
} from 'lucide-react';
import { useExternalStop } from '@/hooks/useExternalStop';
import { useMediaRecording } from '@/hooks/useMediaRecording';
import { useScreenCapture } from '@/hooks/useScreenCapture';

type Props = {
  // eslint-disable-next-line no-unused-vars
  onStreamAvailable: (stream: MediaStream | null) => void;
  externalStop?: boolean;
  onExternalStopHandled?: () => void;
  // eslint-disable-next-line no-unused-vars
  handleScreenshot?: (dataUrl: string, fileName: string) => void;
};

const ScreenCapture = ({
      onStreamAvailable,
      externalStop = false,
      onExternalStopHandled,
  }: Props) => {
    const { videoRef, capturing, loading, startCapture, stopCapture } =
      useScreenCapture(onStreamAvailable);
  
    const { stopRecording } = useMediaRecording();

    useExternalStop(
      externalStop,
      capturing,
      () => {
        stopCapture();
        stopRecording();
      },
      onExternalStopHandled
    );

    const handleStartCapture = async () => {
      try {
        await startCapture();
      } catch (error) {
        // Error handling
      }
    };

    const handleStopCapture = () => {
      stopCapture();
      stopRecording();
    };



    return (
      <div className="relative w-full h-full flex items-center justify-center bg-white rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          className={`w-full h-full object-contain rounded-xl transition-opacity duration-300 ${
            capturing ? 'opacity-100' : 'opacity-0 absolute'
          }`}
          muted
          playsInline
        />

        {!capturing && (
          <div className="flex flex-col items-center justify-center space-y-2 lg:space-y-6 text-center p-8 pb-20 transition-opacity duration-300 z-10 relative">
            <div className="relative">
              <div className="w-10 h-10 lg:w-20 lg:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Monitor className="w-6 h-6 lg:w-10 lg:h-10 text-white" />
              </div>
              {loading && (
                <div className="absolute inset-0 bg-purple-600 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-neutral-800">
                {loading ? 'Connecting...' : 'Welcome to Angel Browser Version'}
              </h3>
              <p className="text-neutral-600 max-w-lg text-sm leading-relaxed">
                {loading
                  ? 'Setting up your screen share and microphone...'
                  : 'Share your screen, then start recording. Make sure to allow audio while selecting screen for best transcription results.'}
              </p>
              
              {/* Start Screen Capture Button */}
              <button
                onClick={handleStartCapture}
                disabled={loading}
                className={`mt-6 px-8 py-4 font-semibold text-lg rounded-2xl shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 border-2 border-white/20 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:shadow-2xl'
                } text-white`}
              >
                <div className="flex items-center gap-3">
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <MonitorPlay className="w-6 h-6" />
                  )}
                  <span>
                    {loading ? 'Starting...' : 'Start Screen Capture'}
                  </span>
                </div>
              </button>
            </div>


          </div>
        )}



        <div className="absolute top-2 left-2">
          <button
            className={`group relative cursor-pointer w-8 h-8 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 shadow-md hover:shadow-lg flex items-center justify-center ${
              capturing
                ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500'
                : loading
                ? 'hidden'
                : 'hidden'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (!loading && capturing) {
                handleStopCapture();
              }
            }}
            disabled={loading}
          >
            {capturing && <span className="text-white text-xs font-bold">✕</span>}
          </button>
        </div>


      </div>
    );
  }

ScreenCapture.displayName = 'ScreenCapture';

export default ScreenCapture;
