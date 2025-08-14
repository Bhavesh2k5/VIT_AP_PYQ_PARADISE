export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdfParse = await import('pdf-parse');
    const pdf = pdfParse.default;
    const data = await pdf(pdfBuffer);
    
    if (!data.text.trim()) {
      throw new Error("No text could be extracted from the PDF");
    }

    return data.text.trim();
  } catch (error) {
    console.error("PDF extraction failed:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validatePDFFile(file: Express.Multer.File): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (file.mimetype !== 'application/pdf') {
    throw new Error("Invalid file type. Only PDF files are supported.");
  }

  if (file.size > maxSize) {
    throw new Error("File size too large. Maximum size is 10MB.");
  }

  return true;
}
