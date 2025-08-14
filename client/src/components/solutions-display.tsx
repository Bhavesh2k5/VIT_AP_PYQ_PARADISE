import { Download, Lightbulb, Copy, Check } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface SolutionsDisplayProps {
  isVisible: boolean;
  solutions: string;
  filename?: string;
  extractedText?: string;
}

export function SolutionsDisplay({ isVisible, solutions, filename, extractedText }: SolutionsDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!isVisible || !solutions) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(solutions);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleExport = () => {
    const blob = new Blob([solutions], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solutions-${filename || 'questions'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glassmorphism rounded-3xl p-8 animate-float" data-testid="solutions-container">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold" data-testid="solutions-title">
          <Lightbulb className="inline w-6 h-6 mr-3 text-yellow-300" />
          Generated Solutions
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="glassmorphism-dark hover:bg-white hover:bg-opacity-20 px-4 py-2 rounded-xl transition-all duration-300"
            data-testid="button-copy-solutions"
          >
            {copied ? (
              <Check className="w-4 h-4 mr-2 inline text-green-300" />
            ) : (
              <Copy className="w-4 h-4 mr-2 inline" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleExport}
            className="glassmorphism-dark hover:bg-white hover:bg-opacity-20 px-4 py-2 rounded-xl transition-all duration-300"
            data-testid="button-export-solutions"
          >
            <Download className="w-4 h-4 mr-2 inline" />
            Export
          </button>
        </div>
      </div>

      {filename && (
        <div className="mb-4 text-sm text-gray-300" data-testid="solutions-filename">
          <strong>Source:</strong> {filename}
        </div>
      )}

      {extractedText && (
        <details className="mb-6">
          <summary className="cursor-pointer text-gray-300 hover:text-white mb-2" data-testid="extracted-text-toggle">
            View Extracted Text
          </summary>
          <div className="glassmorphism-dark rounded-xl p-4 max-h-40 overflow-y-auto" data-testid="extracted-text-content">
            <pre className="text-sm text-gray-200 whitespace-pre-wrap">{extractedText}</pre>
          </div>
        </details>
      )}

      <div 
        className="prose prose-invert max-w-none"
        data-testid="solutions-content"
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-2xl font-bold text-blue-200 mb-4">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-semibold text-purple-200 mb-3">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-semibold text-blue-200 mb-2">{children}</h3>,
            p: ({ children }) => <p className="text-gray-100 mb-3 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside text-gray-100 mb-3 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside text-gray-100 mb-3 space-y-1">{children}</ol>,
            code: ({ children }) => <code className="bg-black bg-opacity-30 px-2 py-1 rounded text-blue-200">{children}</code>,
            pre: ({ children }) => <pre className="glassmorphism-dark rounded-xl p-4 overflow-x-auto mb-4">{children}</pre>,
            blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-200 mb-4">{children}</blockquote>,
          }}
        >
          {solutions}
        </ReactMarkdown>
      </div>
    </div>
  );
}
