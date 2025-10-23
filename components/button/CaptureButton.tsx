import { Loader2, MonitorPlay } from 'lucide-react';
import React from 'react';

interface CaptureButtonProps {
  capturing?: boolean;
  loading?: boolean;
  onStartCapture?: () => void;
  onTakeScreenshot?: () => void;
  className?: string;
}

const CaptureButton: React.FC<CaptureButtonProps> = ({ 
  capturing = false, 
  loading = false, 
  onStartCapture, 
  onTakeScreenshot,
  className = ''
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!loading) {
      capturing ? onTakeScreenshot?.() : onStartCapture?.();
    }
  };

  return (
    <button
      className={`
        relative flex items-center gap-2 px-4 py-3
        font-medium text-white rounded-xl
        bg-gradient-to-r from-purple-500 to-pink-500
        hover:from-purple-600 hover:to-pink-600
        focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
        shadow-lg hover:shadow-xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
        ${!capturing && !loading ? 'hover:scale-105 active:scale-95' : ''}
        ${!capturing && !loading ? 'animate-pulse' : ''}
        ${className}
      `}
      onClick={handleClick}
      disabled={loading}
      type="button"
    >
      {/* Icon */}
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : capturing ? (
        ''
      ) : (
        <MonitorPlay className="w-5 h-5" />
      )}

      {/* Text Content */}
      <span className="flex items-center gap-1">
        {loading ? (
          'Connecting...'
        ) : capturing ? (
          <>
            <kbd className="px-1.5 mr-2 py-0.5 text-xs font-mono bg-white/20 text-white rounded border border-white/30">
              X
            </kbd>
            Angel Screenshot
          </>
        ) : (
          'Start Recording'
        )}
      </span>
    </button>
  );
};

export default CaptureButton;