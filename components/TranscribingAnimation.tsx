import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

const TranscribingAnimation = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-end space-x-3 px-4 py-3"
    >
      {/* Audio Wave Animation */}
      <div className="flex items-center space-x-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.div
            key={index}
            className="w-1 bg-primary-500 rounded-full"
            animate={{
              height: [8, 16, 12, 20, 8],
              opacity: [0.4, 1, 0.6, 1, 0.4],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Transcribing Text and Icon */}
      <div className="flex items-center space-x-2">
        <motion.span
          className="text-neutral-600 text-sm font-medium"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Transcribing
        </motion.span>

        <motion.div
          className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-xl"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Mic className="w-4 h-4 text-white" />
        </motion.div>
      </div>

      {/* Sound Wave Effect */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-primary-100/50 to-transparent rounded-xl -z-10"
        animate={{
          opacity: [0, 0.5, 0],
          scaleX: [0.8, 1.1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
};

export default TranscribingAnimation;
