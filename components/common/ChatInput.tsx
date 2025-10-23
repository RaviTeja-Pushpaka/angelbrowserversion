import React, { useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface ChatInputProps {
  // eslint-disable-next-line no-unused-vars
  onSend: (question: string) => Promise<void>;
  isLoading?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput = ({
  onSend,
  isLoading = false,
  isStreaming = false,
  placeholder = 'Type or edit your question here…',
  disabled = false,
}: ChatInputProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const blurTimeoutRef = useRef(null);
  const [value, setValue] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    blurTimeoutRef.current = setTimeout(() => {
      inputRef.current?.blur();
    }, 2000);
  };

  const handleSend = () => {
    if (value.trim() && !disabled && !isLoading && !isStreaming) {
      onSend(value);
      setValue('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = '1.5rem';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const canSend = value.trim() && !disabled && !isLoading && !isStreaming;

  return (
    <div className="relative">
      <div className="relative flex items-end gap-2 p-3 bg-neutral-50 rounded-xl border-2 border-neutral-200 focus-within:border-primary-400 focus-within:bg-white transition-all duration-200 shadow-sm focus-within:shadow-md">
        {/* AI Indicator */}
        <div className="flex items-center justify-center w-6 h-6 bg-gradient-primary rounded-lg flex-shrink-0 mb-1">
          <Sparkles className="w-3 h-3 text-white" />
        </div>

        {/* Input Area */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent border-none outline-none resize-none text-neutral-800 placeholder-neutral-500 text-sm leading-relaxed max-h-24 scrollbar-professional"
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 96) + 'px';
            }}
          />

          {/* Helper Text - Only show on larger screens */}
          <div className="hidden lg:flex items-center justify-between mt-1">
            <span className="text-xs text-neutral-400">
              {disabled ? 'Transcribing...' : 'Enter to send'}
            </span>
            {value.length > 0 && (
              <span className="text-xs text-neutral-400">
                {value.length}
              </span>
            )}
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 mb-1 ${
            canSend
              ? 'bg-gradient-primary text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
        >
          {isLoading || isStreaming ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Status Indicator removed to avoid duplicate thinking text */}
    </div>
  );
};

export default ChatInput;
