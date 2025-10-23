import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Square } from 'lucide-react';
import { useEffect } from 'react';

interface RecordButtonProps {
  onClick: () => void;
  disabled?: boolean;
  recording: boolean;
  isCompact?: boolean;
}

const RecordButton = ({
  onClick,
  disabled,
  recording,
  isCompact = false,
}: RecordButtonProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        onClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClick]);

  if (isCompact) {
    return (
      <div className="flex flex-col items-center" suppressHydrationWarning>
        <motion.button
          onClick={onClick}
          disabled={disabled}
          className={`cursor-pointer
            relative w-14 h-14 rounded-full font-semibold text-white transition-all duration-300
            transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg
            ${
              recording
                ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-200'
                : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:ring-purple-200'
            }
          `}
          whileTap={{ scale: 0.9 }}
          title={recording ? 'Stop recording & get answer (Space)' : 'Start recording (Space)'}
        >
          <div className="relative flex items-center justify-center">
            {recording && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white/30"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  ease: 'easeOut',
                  repeat: Infinity,
                }}
              />
            )}
            {recording ? (
              <Square size={18} className="fill-current" />
            ) : (
              <Mic size={20} />
            )}
          </div>
        </motion.button>
        <p className="text-xs text-neutral-500 mt-1">
           <kbd className="px-1 py-0.5 bg-neutral-100 rounded text-xs">Rec</kbd>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:flex justify-center lg:mb-4">
        <motion.button
          onClick={onClick}
          disabled={disabled}
          className={`
                relative cursor-pointer w-14 h-14 rounded-full font-semibold text-white transition-all duration-300 
                transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-4 focus:ring-offset-2
                ${
                  recording
                    ? 'bg-red-500 hover:bg-red-600 focus:ring-red-200 shadow-lg shadow-red-200'
                    : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-200 shadow-lg shadow-blue-200'
                }
              `}
          whileTap={{ scale: 0.95 }}
          aria-label={recording ? 'Stop recording & get answer (Space)' : 'Start recording (Space)'}
          title={recording ? 'Stop recording & get answer (Space)' : 'Start recording (Space)'}
        >
          <div className="relative flex items-center justify-center">
            {recording && (
              <AnimatePresence>
                {[0, 0.3, 0.6].map((delay) => (
                  <motion.div
                    key={delay}
                    className="absolute inset-0 rounded-full bg-white/20"
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{
                      delay,
                      duration: 1.5,
                      ease: 'easeOut',
                      repeat: Infinity,
                    }}
                  />
                ))}
              </AnimatePresence>
            )}
            {recording ? (
              <div className="w-6 h-6 bg-white rounded-sm" />
            ) : (
              <Mic size={32} />
            )}
          </div>
        </motion.button>
      </div>

      <div className="flex lg:hidden justify-center lg:mb-4">
        <motion.button
          onClick={onClick}
          disabled={disabled}
          className={`
                relative w-12 h-12 rounded-full font-semibold text-white transition-all duration-300 
                disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1
                ${
                  recording
                    ? 'bg-red-500 hover:bg-red-600 focus:ring-red-200'
                    : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-200'
                }
              `}
          whileTap={{ scale: 0.95 }}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
        >
          <div className="relative flex items-center justify-center">
            {recording && (
              <AnimatePresence>
                {[0, 0.4].map((delay) => (
                  <motion.div
                    key={delay}
                    className="absolute inset-0 rounded-full bg-white/20"
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{
                      delay,
                      duration: 1.2,
                      ease: 'easeOut',
                      repeat: Infinity,
                    }}
                  />
                ))}
              </AnimatePresence>
            )}
            {recording ? (
              <div className="w-3 h-3 bg-white rounded-sm" />
            ) : (
              <Mic size={18} />
            )}
          </div>
        </motion.button>
      </div>

      <div className="hidden lg:block text-center mb-8">
        <p className="text-gray-600 font-medium text-sm">
          {recording ? 'Click to stop recording' : 'Click to start recording'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Use <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Space</kbd>{' '}
          for quick access
        </p>
        <p className="text-xs text-primary-600 mt-1">
          Powered by Whisper AI
        </p>
      </div>
    </>
  );
};

export default RecordButton;
