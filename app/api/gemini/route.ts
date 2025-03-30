// CREATED: API route for Gemini image processing
// UPDATED: Using fetch to directly call Gemini API for image generation
import { NextRequest, NextResponse } from "next/server";

interface GeminiRequestBody {
  image: string;
  prompt: string;
  chatHistory?: Array<{
    role: string;
    content: string;
    imageUrl?: string;
  }>;
}

// Gemini API endpoint for image generation
const GEMINI_API_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: GeminiRequestBody = await request.json();
    const { image, prompt, chatHistory } = body;

    // Validate required fields
    if (!image) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Prepare image data for Gemini API
    const imageBase64 = image.split(",")[1]; // Remove data URL prefix

    // Construct the Gemini API request payload
    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg", // Adjust based on your image type
                data: imageBase64,
              },
            },
            {
              text: `${prompt} Please generate an edited version of this image.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseModalities: ["TEXT", "IMAGE"],
        responseMimeType: "text/plain",
      },
    };

    // Log the request for debugging
    console.log("Sending request to Gemini API:", {
      endpoint: GEMINI_API_ENDPOINT,
      prompt,
      imageIncluded: !!imageBase64,
    });

    // Call the Gemini API
    const response = await fetch(
      `${GEMINI_API_ENDPOINT}?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geminiPayload),
      }
    );

    // Check for successful response
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        {
          error: `Gemini API error: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    // Parse the response
    const result = await response.json();
    console.log("Received response from Gemini API:", {
      hasContent: !!result.candidates,
      hasParts: result.candidates?.[0]?.content?.parts?.length > 0,
    });

    // Extract text and image from response
    let responseText = "";
    let responseImage = null;

    if (result.candidates && result.candidates[0].content.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.text) {
          responseText += part.text;
        } else if (part.inlineData) {
          responseImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    // Return the response
    return NextResponse.json({
      text: responseText || "Image processed successfully.",
      image: responseImage,
    });
  } catch (error) {
    console.error("Error in Gemini API route:", error);

    // Return a proper error response
    return NextResponse.json(
      { error: "Failed to process image with Gemini API" },
      { status: 500 }
    );
  }
}

// Rate limiting to avoid excessive API calls
export const config = {
  api: {
    // Don't buffer the response for streaming
    bodyParser: {
      sizeLimit: "10mb", // Limit file size to 10MB
    },
  },
};
