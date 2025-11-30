import { GoogleGenAI } from "@google/genai";
import { GeneratedImage } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a single image based on prompt and optional reference image.
 * Uses gemini-2.5-flash-image for speed and efficiency.
 */
async function generateSingleImage(prompt: string, referenceImageBase64?: string): Promise<string | null> {
  try {
    const parts: any[] = [];

    // If remixing, add the reference image first
    if (referenceImageBase64) {
      // Extract base64 data if it contains the prefix
      const base64Data = referenceImageBase64.split(',')[1] || referenceImageBase64;
      
      parts.push({
        inlineData: {
          mimeType: 'image/png', // Assuming PNG for simplicity/compatibility
          data: base64Data
        }
      });
    }

    // Add text prompt
    parts.push({
      text: referenceImageBase64 
        ? `Remix this image based on the following instruction: ${prompt}. Ensure high quality, aesthetic phone wallpaper style.` 
        : `${prompt}. High quality, aesthetic phone wallpaper, 9:16 aspect ratio.`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16",
        }
      },
    });

    // Extract image from response
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating single image:", error);
    return null;
  }
}

/**
 * Orchestrates generating 4 images in parallel.
 */
export const generateWallpapers = async (prompt: string, referenceImage?: string): Promise<GeneratedImage[]> => {
  // Create 4 parallel requests to get variations
  const promises = Array(4).fill(null).map(() => generateSingleImage(prompt, referenceImage));
  
  const results = await Promise.all(promises);
  
  const images: GeneratedImage[] = [];
  
  results.forEach((base64) => {
    if (base64) {
      images.push({
        id: crypto.randomUUID(),
        base64,
        prompt,
        timestamp: Date.now()
      });
    }
  });

  if (images.length === 0) {
    throw new Error("이미지를 생성하지 못했습니다. 다시 시도해주세요.");
  }

  return images;
};