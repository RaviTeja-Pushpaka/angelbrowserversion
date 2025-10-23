import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

const ThinkingAnimation = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex items-center space-x-3 px-4 py-3"
    >
      {/* AI Avatar */}
      <motion.div
        className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-xl flex-shrink-0"
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 1, -1, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Brain className="w-4 h-4 text-white" />
      </motion.div>

      {/* Thinking Text and Dots */}
      <div className="flex items-center space-x-2">
        <motion.span
          className="text-neutral-600 text-sm font-medium"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          AI is thinking
        </motion.span>

        <div className="flex items-center space-x-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-primary-500 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      {/* Pulse Effect */}
      <motion.div
        className="absolute inset-0 bg-primary-100 rounded-xl -z-10"
        animate={{
          opacity: [0, 0.3, 0],
          scale: [0.95, 1.02, 0.95],
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

export default ThinkingAnimation;
