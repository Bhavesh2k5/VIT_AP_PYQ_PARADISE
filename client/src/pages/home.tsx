import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { GraduationCap, Wand2, Eye, Brain, Shield, Upload as UploadIcon, Menu, X } from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import { ProcessingStatus } from "@/components/processing-status";
import { SolutionsDisplay } from "@/components/solutions-display";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProcessResponse {
  success: boolean;
  extractedText: string;
  solutions: string;
  filename: string;
  processedAt: string;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({
    title: "Processing your question paper...",
    message: "Extracting text and generating solutions",
    progress: 0
  });
  const [solutions, setSolutions] = useState<ProcessResponse | null>(null);
  const { toast } = useToast();

  const processTextMutation = useMutation({
    mutationFn: async (data: { text: string; filename?: string }) => {
      const response = await apiRequest("POST", "/api/process-text", data);
      return response.json() as Promise<ProcessResponse>;
    },
    onSuccess: (data) => {
      setSolutions(data);
      setProcessingStatus(prev => ({ ...prev, progress: 100 }));
      toast({
        title: "Success!",
        description: "Solutions generated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Text processing error:", error);
      
      let errorMessage = "Failed to process text. Please try again.";
      
      // Handle API response errors
      if (error?.message?.includes("quota")) {
        errorMessage = "API quota exceeded. Please try again in a few minutes.";
      } else if (error?.message?.includes("rate limit")) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error?.message?.includes("unavailable")) {
        errorMessage = "AI service temporarily unavailable. Please try again shortly.";
      } else if (error?.message?.includes("API key")) {
        errorMessage = "API configuration issue. Please contact support.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Text Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const processFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/process-file", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process file");
      }
      
      return response.json() as Promise<ProcessResponse>;
    },
    onSuccess: (data) => {
      setSolutions(data);
      setProcessingStatus(prev => ({ ...prev, progress: 100 }));
      toast({
        title: "Success!",
        description: "File processed and solutions generated successfully",
      });
    },
    onError: (error: any) => {
      console.error("File processing error:", error);
      
      let errorMessage = "Failed to process file. Please try again.";
      
      // Handle API response errors  
      if (error?.message?.includes("quota")) {
        errorMessage = "API quota exceeded. Please try again in a few minutes.";
      } else if (error?.message?.includes("rate limit")) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error?.message?.includes("unavailable")) {
        errorMessage = "AI service temporarily unavailable. Please try again shortly.";
      } else if (error?.message?.includes("API key")) {
        errorMessage = "API configuration issue. Please contact support.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "File Processing Failed", 
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const isProcessing = processTextMutation.isPending || processFileMutation.isPending;

  const handleProcess = async () => {
    if (!selectedFile && !questionText.trim()) {
      toast({
        title: "Input Required",
        description: "Please upload a file or enter text to process",
        variant: "destructive",
      });
      return;
    }

    setSolutions(null);
    
    // Simulate processing steps
    setProcessingStatus({
      title: "Starting processing...",
      message: "Preparing your request",
      progress: 10
    });

    setTimeout(() => {
      if (selectedFile) {
        setProcessingStatus({
          title: "Extracting text from file...",
          message: "Using OCR to read your document",
          progress: 30
        });
      } else {
        setProcessingStatus({
          title: "Processing text...",
          message: "Analyzing your questions",
          progress: 40
        });
      }
    }, 500);

    setTimeout(() => {
      setProcessingStatus({
        title: "Generating solutions...",
        message: "AI is creating detailed solutions",
        progress: 70
      });
    }, 1500);

    setTimeout(() => {
      setProcessingStatus({
        title: "Finalizing solutions...",
        message: "Formatting and preparing your answers",
        progress: 90
      });
    }, 2500);

    try {
      if (selectedFile) {
        await processFileMutation.mutateAsync(selectedFile);
      } else {
        await processTextMutation.mutateAsync({ 
          text: questionText,
          filename: "Manual Input"
        });
      }
    } catch (error) {
      // Error is handled in the mutation's onError callback
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden bg-transparent relative">
      
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover -z-10"
        data-testid="background-video"
      >
        <source src="/background-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="pt-4 pb-2">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="glassmorphism rounded-xl px-4 py-2 animate-float">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2" data-testid="logo">
                  <div className="w-6 h-6 glassmorphism rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" data-testid="logo-icon" />
                  </div>
                  <h1 className="text-lg font-bold" data-testid="logo-text">EduSolve</h1>
                </div>
                
                <div className="hidden md:flex items-center space-x-4">
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="text-sm hover:text-gray-200 transition-colors"
                    data-testid="nav-features"
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => scrollToSection('how-it-works')}
                    className="text-sm hover:text-gray-200 transition-colors"
                    data-testid="nav-how-it-works"
                  >
                    How it Works
                  </button>
                  <button 
                    onClick={() => scrollToSection('security')}
                    className="text-sm hover:text-gray-200 transition-colors"
                    data-testid="nav-security"
                  >
                    Security
                  </button>
                </div>
                
                <button 
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  data-testid="mobile-menu-toggle"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
              
              {/* Mobile Menu */}
              {mobileMenuOpen && (
                <div className="md:hidden mt-4 pt-4 border-t border-white border-opacity-20" data-testid="mobile-menu">
                  <div className="flex flex-col space-y-2">
                    <button 
                      onClick={() => scrollToSection('features')}
                      className="text-left hover:text-gray-200 transition-colors py-2"
                      data-testid="mobile-nav-features"
                    >
                      Features
                    </button>
                    <button 
                      onClick={() => scrollToSection('how-it-works')}
                      className="text-left hover:text-gray-200 transition-colors py-2"
                      data-testid="mobile-nav-how-it-works"
                    >
                      How it Works
                    </button>
                    <button 
                      onClick={() => scrollToSection('security')}
                      className="text-left hover:text-gray-200 transition-colors py-2"
                      data-testid="mobile-nav-security"
                    >
                      Security
                    </button>
                  </div>
                </div>
              )}
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-float" data-testid="hero-title">
                AI-Powered Question<br />
                <span className="bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Paper Solutions
                </span>
              </h2>
              <p className="text-lg text-gray-100 max-w-2xl mx-auto leading-relaxed" data-testid="hero-description">
                Upload your question papers and get instant, detailed solutions
              </p>
            </div>

            {/* Main Upload Interface */}
            <div className="max-w-2xl mx-auto">
              <div className="glassmorphism rounded-2xl p-4 mb-6 animate-float">
                <FileUpload
                  onFileSelect={setSelectedFile}
                  onFileRemove={() => setSelectedFile(null)}
                  selectedFile={selectedFile}
                  isProcessing={isProcessing}
                />

                {/* Text Input Option */}
                <div className="mt-4">
                  <div className="flex items-center justify-center mb-3">
                    <div className="flex-1 h-px bg-white bg-opacity-20"></div>
                    <span className="px-3 text-gray-200 text-xs" data-testid="divider-text">OR</span>
                    <div className="flex-1 h-px bg-white bg-opacity-20"></div>
                  </div>
                  
                  <Textarea
                    placeholder="Paste your questions here..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="w-full h-20 glassmorphism-dark rounded-xl p-3 text-white placeholder-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-white focus:ring-opacity-30 transition-all duration-300 border-0 bg-transparent text-sm"
                    disabled={isProcessing}
                    data-testid="textarea-questions"
                  />
                </div>

                {/* Process Button */}
                <div className="mt-4 text-center">
                  <Button
                    onClick={handleProcess}
                    disabled={isProcessing || (!selectedFile && !questionText.trim())}
                    className="glassmorphism hover:bg-white hover:bg-opacity-30 px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-0 bg-transparent"
                    data-testid="button-generate-solutions"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Solutions
                  </Button>
                </div>
              </div>

              <ProcessingStatus
                isVisible={isProcessing}
                status={processingStatus}
              />

              <SolutionsDisplay
                isVisible={!isProcessing && !!solutions}
                solutions={solutions?.solutions || ""}
                filename={solutions?.filename}
                extractedText={solutions?.extractedText}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6" data-testid="features-title">Powerful Features</h2>
              <p className="text-xl text-gray-200 max-w-2xl mx-auto" data-testid="features-description">
                Everything you need to solve question papers efficiently and securely
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="glassmorphism rounded-2xl p-8 text-center animate-float hover:bg-white hover:bg-opacity-30 transition-all duration-300" data-testid="feature-ocr">
                <div className="w-16 h-16 glassmorphism-dark rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Eye className="w-8 h-8 text-blue-300" />
                </div>
                <h3 className="text-xl font-semibold mb-4">OCR Technology</h3>
                <p className="text-gray-200">Advanced optical character recognition to extract text from images with high accuracy</p>
              </div>

              <div className="glassmorphism rounded-2xl p-8 text-center animate-float hover:bg-white hover:bg-opacity-30 transition-all duration-300" style={{ animationDelay: '0.2s' }} data-testid="feature-ai">
                <div className="w-16 h-16 glassmorphism-dark rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-purple-300" />
                </div>
                <h3 className="text-xl font-semibold mb-4">AI-Powered Solutions</h3>
                <p className="text-gray-200">Generate detailed, step-by-step solutions using advanced AI models</p>
              </div>

              <div className="glassmorphism rounded-2xl p-8 text-center animate-float hover:bg-white hover:bg-opacity-30 transition-all duration-300" style={{ animationDelay: '0.4s' }} data-testid="feature-security">
                <div className="w-16 h-16 glassmorphism-dark rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-green-300" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Secure & Private</h3>
                <p className="text-gray-200">Your data is encrypted and API keys are securely stored in environment variables</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6" data-testid="how-it-works-title">How It Works</h2>
              <p className="text-xl text-gray-200 max-w-2xl mx-auto" data-testid="how-it-works-description">
                Simple steps to get your solutions
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-400 opacity-30"></div>
              
              <div className="space-y-12">
                <div className="flex items-center justify-between">
                  <div className="glassmorphism rounded-2xl p-8 w-full max-w-md animate-float" data-testid="step-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 glassmorphism-dark rounded-xl flex items-center justify-center">
                        <span className="text-xl font-bold">1</span>
                      </div>
                      <h3 className="text-xl font-semibold">Upload Your Paper</h3>
                    </div>
                    <p className="text-gray-200">Upload PDF, image files, or paste text directly into the interface</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="glassmorphism rounded-2xl p-8 w-full max-w-md ml-auto animate-float" style={{ animationDelay: '0.2s' }} data-testid="step-2">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 glassmorphism-dark rounded-xl flex items-center justify-center">
                        <span className="text-xl font-bold">2</span>
                      </div>
                      <h3 className="text-xl font-semibold">AI Processing</h3>
                    </div>
                    <p className="text-gray-200">Our AI analyzes the questions and generates comprehensive solutions</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="glassmorphism rounded-2xl p-8 w-full max-w-md animate-float" style={{ animationDelay: '0.4s' }} data-testid="step-3">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 glassmorphism-dark rounded-xl flex items-center justify-center">
                        <span className="text-xl font-bold">3</span>
                      </div>
                      <h3 className="text-xl font-semibold">Get Solutions</h3>
                    </div>
                    <p className="text-gray-200">Receive detailed, formatted solutions ready for study or export</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="glassmorphism rounded-3xl p-12 text-center animate-float" data-testid="security-section">
              <div className="w-20 h-20 glassmorphism-dark rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Shield className="w-10 h-10 text-green-300" />
              </div>
              <h2 className="text-4xl font-bold mb-6" data-testid="security-title">Enterprise-Grade Security</h2>
              <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-8" data-testid="security-description">
                Your API keys and data are completely secure. We use environment variables for API key storage, 
                ensuring they never appear in frontend code or client-side requests.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center space-x-2" data-testid="security-feature-encryption">
                  <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                  <span>End-to-end encryption</span>
                </div>
                <div className="flex items-center space-x-2" data-testid="security-feature-api">
                  <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                  <span>Secure API handling</span>
                </div>
                <div className="flex items-center space-x-2" data-testid="security-feature-logging">
                  <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                  <span>No data logging</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 mt-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="glassmorphism rounded-2xl p-8" data-testid="footer">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center space-x-3 mb-4 md:mb-0" data-testid="footer-logo">
                  <div className="w-10 h-10 glassmorphism rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-bold">EduSolve</span>
                </div>
                <div className="text-center text-gray-200" data-testid="footer-copyright">
                  <p>&copy; 2024 EduSolve. Empowering students with AI-powered education.</p>
                  <p className="text-sm mt-2 opacity-75" data-testid="developer-credits">
                    Developed by Harshit and Bhavesh
                  </p>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
