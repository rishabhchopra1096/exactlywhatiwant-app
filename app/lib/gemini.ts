// CREATED: Gemini API utility functions
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

// Create a function to get the API key from environment variables
const getApiKey = (): string => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not defined in your environment variables"
    );
  }
  return apiKey;
};

// Initialize the Gemini API client
export const initGeminiClient = () => {
  try {
    const apiKey = getApiKey();
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error("Error initializing Gemini client:", error);
    throw error;
  }
};

// Process image function that will communicate with Gemini
export async function processImageWithGemini(
  imageData: string,
  prompt: string,
  chatHistory: {
    role: "user" | "model";
    content: string;
    imageUrl?: string;
  }[] = []
) {
  try {
    const genAI = initGeminiClient();

    // Use Gemini 2.0 Flash model for image processing
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    // Prepare image data for Gemini API
    const imageBase64 = imageData.split(",")[1]; // Remove data URL prefix if present

    // Create parts array with image and text
    const parts: Part[] = [];

    // Add image part if available
    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg", // Adjust based on your image type
        },
      });
    }

    // Add prompt text
    parts.push({
      text: prompt,
    });

    // Process with Gemini
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    const response = result.response;

    // Extract text and image from response
    const responseText = response.text();

    // The API might return an image - handle this case
    let responseImage = null;
    try {
      // Check if any parts contain inline data (images)
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            responseImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error extracting image from response:", error);
    }

    return {
      text: responseText,
      image: responseImage,
    };
  } catch (error) {
    console.error("Error processing image with Gemini:", error);
    throw error;
  }
}
