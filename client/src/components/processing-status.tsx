import { Loader2 } from "lucide-react";

interface ProcessingStatusProps {
  isVisible: boolean;
  status: {
    title: string;
    message: string;
    progress: number;
  };
}

export function ProcessingStatus({ isVisible, status }: ProcessingStatusProps) {
  if (!isVisible) return null;

  return (
    <div className="glassmorphism rounded-2xl p-6 mb-8 animate-float" data-testid="processing-status">
      <div className="flex items-center space-x-4">
        <Loader2 className="w-6 h-6 animate-spin" data-testid="processing-spinner" />
        <div className="flex-1">
          <h4 className="font-semibold mb-1" data-testid="processing-title">
            {status.title}
          </h4>
          <p className="text-sm text-gray-200" data-testid="processing-message">
            {status.message}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className="w-full bg-white bg-opacity-20 rounded-full h-2" data-testid="progress-bar-container">
          <div
            className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${status.progress}%` }}
            data-testid="progress-bar"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-300 mt-1">
          <span data-testid="progress-text">Processing...</span>
          <span data-testid="progress-percentage">{Math.round(status.progress)}%</span>
        </div>
      </div>
    </div>
  );
}
