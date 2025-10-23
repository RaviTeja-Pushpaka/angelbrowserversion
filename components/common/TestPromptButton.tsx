import React from 'react';

interface TestPromptButtonProps {
  onTest: () => void;
}

export default function TestPromptButton({ onTest }: TestPromptButtonProps) {
  return (
    <button
      onClick={onTest}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Test Angel AI Prompt
    </button>
  );
}
