import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { processQuestionSchema } from "@shared/schema";
import { generateSolutions, validateApiKey } from "./services/gemini";
import { extractTextFromImage, validateImageFile } from "./services/ocr";
import { extractTextFromPDF, validatePDFFile } from "./services/pdfParser";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const apiValidation = await validateApiKey();
      res.json({ 
        status: "ok", 
        geminiApiConnected: apiValidation.valid,
        apiError: apiValidation.error,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Service health check failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Process text questions directly
  app.post("/api/process-text", async (req, res) => {
    try {
      console.log("Processing text request from:", req.ip);
      const { text, filename } = processQuestionSchema.parse(req.body);
      
      // Validate API before processing
      const apiValidation = await validateApiKey();
      if (!apiValidation.valid) {
        return res.status(503).json({
          success: false,
          message: "AI service temporarily unavailable",
          error: apiValidation.error || "API validation failed",
          retryAfter: 60 // seconds
        });
      }
      
      const solutions = await generateSolutions(text);
      
      res.json({
        success: true,
        extractedText: text,
        solutions,
        filename: filename || "Manual Input",
        processedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Text processing error:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: error.errors
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : "Failed to process text";
        const statusCode = errorMessage.includes("quota") || errorMessage.includes("rate limit") ? 429 : 500;
        
        res.status(statusCode).json({
          success: false,
          message: errorMessage,
          retryAfter: statusCode === 429 ? 120 : undefined
        });
      }
    }
  });

  // Process uploaded files
  app.post("/api/process-file", upload.single("file"), async (req, res) => {
    try {
      console.log("Processing file upload from:", req.ip);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ 
          success: false,
          message: "No file uploaded" 
        });
      }

      // Validate API before processing
      const apiValidation = await validateApiKey();
      if (!apiValidation.valid) {
        return res.status(503).json({
          success: false,
          message: "AI service temporarily unavailable",
          error: apiValidation.error || "API validation failed",
          retryAfter: 60
        });
      }

      let extractedText: string;

      // Handle different file types
      if (file.mimetype === 'application/pdf') {
        validatePDFFile(file);
        extractedText = await extractTextFromPDF(file.buffer);
      } else if (file.mimetype.startsWith('image/')) {
        validateImageFile(file);
        extractedText = await extractTextFromImage(file.buffer);
      } else if (file.mimetype === 'text/plain') {
        extractedText = file.buffer.toString('utf-8');
      } else {
        return res.status(400).json({
          success: false,
          message: "Unsupported file type. Please upload PDF, PNG, JPG, or TXT files."
        });
      }

      if (!extractedText.trim()) {
        return res.status(400).json({
          success: false,
          message: "No text could be extracted from the uploaded file"
        });
      }

      // Generate solutions using Gemini AI
      const solutions = await generateSolutions(extractedText);

      res.json({
        success: true,
        filename: file.originalname,
        fileType: file.mimetype,
        extractedText,
        solutions,
        processedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error("File processing error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to process file";
      const statusCode = errorMessage.includes("quota") || errorMessage.includes("rate limit") ? 429 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        retryAfter: statusCode === 429 ? 120 : undefined
      });
    }
  });

  // Get processing status (for future WebSocket implementation)
  app.get("/api/status/:jobId", (req, res) => {
    // Placeholder for future job tracking implementation
    res.json({
      jobId: req.params.jobId,
      status: "completed",
      progress: 100
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
