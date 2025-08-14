// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import multer from "multer";
import { z as z2 } from "zod";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var questionPapers = pgTable("question_papers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  extractedText: text("extracted_text"),
  solutions: text("solutions"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertQuestionPaperSchema = createInsertSchema(questionPapers).pick({
  filename: true,
  fileType: true,
  extractedText: true
});
var processQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  filename: z.string().optional()
});

// server/services/gemini.ts
import { GoogleGenAI } from "@google/genai";
var ai;
function initializeAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
}
async function generateSolutions(questionText) {
  try {
    if (!questionText.trim()) {
      throw new Error("Question text is required");
    }
    if (!ai) {
      ai = initializeAI();
    }
    const prompt = `You are an expert tutor. Analyze the following question paper and provide detailed, step-by-step solutions for each question. Format your response in markdown with clear headings and explanations.

Question Paper:
${questionText}

Please provide:
1. Clear identification of each question
2. Step-by-step solution methodology  
3. Final answers where applicable
4. Explanations of key concepts used

Format the response professionally with proper markdown formatting.`;
    console.log("Attempting to generate solutions with Gemini API...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 8192
      }
    });
    const solution = response.text;
    if (!solution || solution.trim().length === 0) {
      throw new Error("AI model returned empty response");
    }
    console.log("Successfully generated solutions");
    return solution;
  } catch (error) {
    console.error("Detailed error in generateSolutions:", {
      message: error?.message,
      status: error?.status,
      details: error?.details,
      cause: error?.cause
    });
    if (error?.message?.includes("API_KEY_INVALID")) {
      throw new Error("Invalid API key configuration. Please check your Gemini API key.");
    }
    if (error?.message?.includes("QUOTA_EXCEEDED")) {
      throw new Error("API quota exceeded. Please try again later or check your billing.");
    }
    if (error?.message?.includes("PERMISSION_DENIED")) {
      throw new Error("Permission denied. Please verify your API key has proper permissions.");
    }
    if (error?.message?.includes("RATE_LIMIT_EXCEEDED")) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.");
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to generate solutions: ${errorMessage}`);
  }
}
async function validateApiKey() {
  try {
    if (!ai) {
      ai = initializeAI();
    }
    console.log("Testing Gemini API connection...");
    const testResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello, respond with 'API connected successfully'",
      config: {
        maxOutputTokens: 100
      }
    });
    const isValid = !!testResponse.text && testResponse.text.trim().length > 0;
    console.log("API validation result:", isValid ? "SUCCESS" : "FAILED");
    return { valid: isValid };
  } catch (error) {
    console.error("API key validation failed:", {
      message: error?.message,
      status: error?.status,
      details: error?.details
    });
    let errorMessage = "API validation failed";
    if (error?.message?.includes("API_KEY_INVALID")) {
      errorMessage = "Invalid API key";
    } else if (error?.message?.includes("QUOTA_EXCEEDED")) {
      errorMessage = "API quota exceeded";
    } else if (error?.message?.includes("PERMISSION_DENIED")) {
      errorMessage = "API permission denied";
    } else if (error?.message?.includes("RATE_LIMIT_EXCEEDED")) {
      errorMessage = "API rate limit exceeded";
    }
    return { valid: false, error: errorMessage };
  }
}

// server/services/ocr.ts
import Tesseract from "tesseract.js";
import sharp from "sharp";
async function extractTextFromImage(imageBuffer) {
  try {
    const processedImageBuffer = await sharp(imageBuffer).greyscale().normalize().sharpen().toBuffer();
    const { data: { text: text2 } } = await Tesseract.recognize(
      processedImageBuffer,
      "eng",
      {
        logger: (m) => console.log(m)
      }
    );
    if (!text2.trim()) {
      throw new Error("No text could be extracted from the image");
    }
    return text2.trim();
  } catch (error) {
    console.error("OCR extraction failed:", error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
function validateImageFile(file) {
  const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
  const maxSize = 10 * 1024 * 1024;
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error("Invalid file type. Only PNG and JPEG images are supported.");
  }
  if (file.size > maxSize) {
    throw new Error("File size too large. Maximum size is 10MB.");
  }
  return true;
}

// server/services/pdfParser.ts
async function extractTextFromPDF(pdfBuffer) {
  try {
    const pdfParse = await import("pdf-parse");
    const pdf = pdfParse.default;
    const data = await pdf(pdfBuffer);
    if (!data.text.trim()) {
      throw new Error("No text could be extracted from the PDF");
    }
    return data.text.trim();
  } catch (error) {
    console.error("PDF extraction failed:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
function validatePDFFile(file) {
  const maxSize = 10 * 1024 * 1024;
  if (file.mimetype !== "application/pdf") {
    throw new Error("Invalid file type. Only PDF files are supported.");
  }
  if (file.size > maxSize) {
    throw new Error("File size too large. Maximum size is 10MB.");
  }
  return true;
}

// server/routes.ts
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  }
});
async function registerRoutes(app2) {
  app2.get("/api/health", async (req, res) => {
    try {
      const apiValidation = await validateApiKey();
      res.json({
        status: "ok",
        geminiApiConnected: apiValidation.valid,
        apiError: apiValidation.error,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      res.status(500).json({
        message: "Service health check failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/process-text", async (req, res) => {
    try {
      console.log("Processing text request from:", req.ip);
      const { text: text2, filename } = processQuestionSchema.parse(req.body);
      const apiValidation = await validateApiKey();
      if (!apiValidation.valid) {
        return res.status(503).json({
          success: false,
          message: "AI service temporarily unavailable",
          error: apiValidation.error || "API validation failed",
          retryAfter: 60
          // seconds
        });
      }
      const solutions = await generateSolutions(text2);
      res.json({
        success: true,
        extractedText: text2,
        solutions,
        filename: filename || "Manual Input",
        processedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Text processing error:", error);
      if (error instanceof z2.ZodError) {
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
          retryAfter: statusCode === 429 ? 120 : void 0
        });
      }
    }
  });
  app2.post("/api/process-file", upload.single("file"), async (req, res) => {
    try {
      console.log("Processing file upload from:", req.ip);
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }
      const apiValidation = await validateApiKey();
      if (!apiValidation.valid) {
        return res.status(503).json({
          success: false,
          message: "AI service temporarily unavailable",
          error: apiValidation.error || "API validation failed",
          retryAfter: 60
        });
      }
      let extractedText;
      if (file.mimetype === "application/pdf") {
        validatePDFFile(file);
        extractedText = await extractTextFromPDF(file.buffer);
      } else if (file.mimetype.startsWith("image/")) {
        validateImageFile(file);
        extractedText = await extractTextFromImage(file.buffer);
      } else if (file.mimetype === "text/plain") {
        extractedText = file.buffer.toString("utf-8");
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
      const solutions = await generateSolutions(extractedText);
      res.json({
        success: true,
        filename: file.originalname,
        fileType: file.mimetype,
        extractedText,
        solutions,
        processedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("File processing error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process file";
      const statusCode = errorMessage.includes("quota") || errorMessage.includes("rate limit") ? 429 : 500;
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        retryAfter: statusCode === 429 ? 120 : void 0
      });
    }
  });
  app2.get("/api/status/:jobId", (req, res) => {
    res.json({
      jobId: req.params.jobId,
      status: "completed",
      progress: 100
    });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  base: "/VIT_AP_PYQ_PARADISE/",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import "dotenv/config";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
