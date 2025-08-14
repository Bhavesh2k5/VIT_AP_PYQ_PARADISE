import Tesseract from 'tesseract.js';
import sharp from 'sharp';

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  try {
    // Preprocess image for better OCR accuracy
    const processedImageBuffer = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .sharpen()
      .toBuffer();

    const { data: { text } } = await Tesseract.recognize(
      processedImageBuffer,
      'eng',
      {
        logger: m => console.log(m)
      }
    );

    if (!text.trim()) {
      throw new Error("No text could be extracted from the image");
    }

    return text.trim();
  } catch (error) {
    console.error("OCR extraction failed:", error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateImageFile(file: Express.Multer.File): boolean {
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error("Invalid file type. Only PNG and JPEG images are supported.");
  }

  if (file.size > maxSize) {
    throw new Error("File size too large. Maximum size is 10MB.");
  }

  return true;
}
