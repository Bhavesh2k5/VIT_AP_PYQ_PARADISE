import { GoogleGenAI } from "@google/genai";

// Initialize AI with better error handling
let ai: GoogleGenAI;

function initializeAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  
  return new GoogleGenAI({ apiKey });
}

export async function generateSolutions(questionText: string): Promise<string> {
  try {
    if (!questionText.trim()) {
      throw new Error("Question text is required");
    }

    // Initialize AI if not already done
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
        maxOutputTokens: 8192,
      }
    });

    const solution = response.text;
    
    if (!solution || solution.trim().length === 0) {
      throw new Error("AI model returned empty response");
    }

    console.log("Successfully generated solutions");
    return solution;
    
  } catch (error: any) {
    console.error("Detailed error in generateSolutions:", {
      message: error?.message,
      status: error?.status,
      details: error?.details,
      cause: error?.cause
    });
    
    // Handle specific API errors
    if (error?.message?.includes('API_KEY_INVALID')) {
      throw new Error("Invalid API key configuration. Please check your Gemini API key.");
    }
    
    if (error?.message?.includes('QUOTA_EXCEEDED')) {
      throw new Error("API quota exceeded. Please try again later or check your billing.");
    }
    
    if (error?.message?.includes('PERMISSION_DENIED')) {
      throw new Error("Permission denied. Please verify your API key has proper permissions.");
    }
    
    if (error?.message?.includes('RATE_LIMIT_EXCEEDED')) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.");
    }
    
    // Generic error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to generate solutions: ${errorMessage}`);
  }
}

export async function validateApiKey(): Promise<{ valid: boolean; error?: string }> {
  try {
    // Initialize AI if not already done
    if (!ai) {
      ai = initializeAI();
    }
    
    console.log("Testing Gemini API connection...");
    
    const testResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello, respond with 'API connected successfully'",
      config: {
        maxOutputTokens: 100,
      }
    });
    
    const isValid = !!testResponse.text && testResponse.text.trim().length > 0;
    console.log("API validation result:", isValid ? "SUCCESS" : "FAILED");
    
    return { valid: isValid };
    
  } catch (error: any) {
    console.error("API key validation failed:", {
      message: error?.message,
      status: error?.status,
      details: error?.details
    });
    
    let errorMessage = "API validation failed";
    
    if (error?.message?.includes('API_KEY_INVALID')) {
      errorMessage = "Invalid API key";
    } else if (error?.message?.includes('QUOTA_EXCEEDED')) {
      errorMessage = "API quota exceeded";
    } else if (error?.message?.includes('PERMISSION_DENIED')) {
      errorMessage = "API permission denied";
    } else if (error?.message?.includes('RATE_LIMIT_EXCEEDED')) {
      errorMessage = "API rate limit exceeded";
    }
    
    return { valid: false, error: errorMessage };
  }
}
