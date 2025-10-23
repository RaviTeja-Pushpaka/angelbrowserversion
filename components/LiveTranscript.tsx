interface LiveTranscriptProps {
  transcript: string;
  recording: boolean;
  useWebAPI?: boolean; // Keep for compatibility but not used
}

const LiveTranscript = ({
  transcript,
  recording,
}: LiveTranscriptProps) => {
  return (
    <div className="h-full bg-white rounded-lg border border-neutral-200 shadow-sm flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              recording ? 'bg-primary-500 animate-pulse' : 'bg-neutral-400'
            }`}
          />
          <span className="text-xs font-medium text-neutral-700">
            {recording ? 'Recording' : 'Transcript'}
          </span>
        </div>
        {transcript && (
          <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
            {transcript.split(' ').filter((word) => word.trim()).length} words
          </span>
        )}
      </div>

      <div className="flex-1 p-3 overflow-y-auto scrollbar-professional">
        <div className="h-full min-h-[80px] p-3 bg-neutral-50 rounded-lg text-sm">
          {transcript ? (
            <div className="text-neutral-800 leading-relaxed whitespace-pre-wrap h-full">
              {transcript}
            </div>
          ) : (
            <div className="text-neutral-500 italic h-full flex items-center justify-center">
              {recording ? 'Listening...' : 'No transcript yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTranscript;
