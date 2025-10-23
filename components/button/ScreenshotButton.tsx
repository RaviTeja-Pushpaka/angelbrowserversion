import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { useEffect } from 'react';

interface ScreenshotButtonProps {
  onClick: () => void;
  disabled?: boolean;
  capturing: boolean;
  isCompact?: boolean;
}

const ScreenshotButton = ({
  onClick,
  disabled = false,
  capturing,
  isCompact = false,
}: ScreenshotButtonProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.code === 'KeyS') {
        e.preventDefault();
        if (!disabled && capturing) {
          onClick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClick, disabled, capturing]);

  if (isCompact) {
    return (
      <div className="flex flex-col items-center" suppressHydrationWarning>
        <motion.button
          onClick={onClick}
          disabled={disabled || !capturing}
          className={`cursor-pointer
            relative w-14 h-14 rounded-full font-semibold text-white transition-all duration-300
            transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg
            ${
              capturing && !disabled
                ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-200'
                : 'bg-gradient-to-br from-gray-400 to-gray-500 cursor-not-allowed'
            }
          `}
          whileTap={{ scale: 0.9 }}
          title={capturing ? 'Take screenshot (S)' : 'Start screen capture first'}
        >
          <div className="relative flex items-center justify-center">
            <Camera size={24} />
          </div>
        </motion.button>
        
        <p className="text-xs text-gray-500 mt-1 text-center">
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Shot</kbd>
        </p>
      </div>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || !capturing}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${
          capturing && !disabled
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2
      `}
      whileHover={{ scale: capturing && !disabled ? 1.02 : 1 }}
      whileTap={{ scale: capturing && !disabled ? 0.98 : 1 }}
      title={capturing ? 'Take screenshot (S)' : 'Start screen capture first'}
    >
      <Camera className="w-4 h-4" />
      <span>Screenshot</span>
      <kbd className="px-2 py-1 bg-white/20 rounded text-xs">S</kbd>
    </motion.button>
  );
};

export default ScreenshotButton;
