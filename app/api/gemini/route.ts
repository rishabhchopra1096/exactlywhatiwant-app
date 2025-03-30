// CREATED: API route for Gemini image processing
import { NextRequest, NextResponse } from "next/server";
import { processImageWithGemini } from "@/app/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
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

    // Process the image with Gemini
    const result = await processImageWithGemini(
      image,
      prompt,
      chatHistory
    );

    // Return the response
    return NextResponse.json(result);
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
