// CREATED: API route for video generation using Replicate's WAN model
import { NextRequest, NextResponse } from "next/server";
import { generateVideoFromImage } from "@/app/utils/videoGeneration";

// Update config to allow for longer processing time
export const config = {
  runtime: "edge",
  maxDuration: 300, // Allow up to 5 minutes for video generation
};

/**
 * API route handler for generating videos from images
 * This function takes an image and a prompt and returns a video URL
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { imageData, prompt, productType } = body;

    // Validate the request data
    if (!imageData) {
      return NextResponse.json(
        { error: "No image data provided" },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "No prompt provided" },
        { status: 400 }
      );
    }

    // Check for Replicate API token
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        {
          error:
            "REPLICATE_API_TOKEN is not configured in environment variables. Please add your Replicate API token to .env.local file.",
        },
        { status: 500 }
      );
    }

    console.log(
      `Generating video for ${
        productType || "product"
      } with prompt: ${prompt}`
    );

    // Generate a more detailed prompt based on the product type
    let enhancedPrompt = prompt;
    if (productType) {
      enhancedPrompt = `${prompt} for a ${productType}. Create a realistic, detailed video showing the ${productType} from multiple angles.`;
    }

    // Generate the video using the updated function
    try {
      const result = await generateVideoFromImage(
        imageData,
        enhancedPrompt
      );

      // Check if we received a valid URL or local file path
      if (!result.url) {
        throw new Error(
          "No video URL was returned from the generation process"
        );
      }

      console.log("Successfully generated video URL:", result.url);

      // Accept both http URLs and local file paths (already relative to base URL)
      const videoUrl = result.url;

      // Return the video URL
      return NextResponse.json({
        videoUrl: videoUrl,
        message: "Video generated successfully",
        prompt: enhancedPrompt,
      });
    } catch (error: any) {
      console.error("Error generating video:", error);

      // Add more specific error messages based on common Replicate issues
      let errorMessage = error.message || "Failed to generate video";

      if (
        errorMessage.includes("Invalid version") ||
        errorMessage.includes("not permitted")
      ) {
        errorMessage =
          "The Replicate API token is invalid or has insufficient permissions. Please check your API token in the .env.local file.";
      } else if (errorMessage.includes("rate limit")) {
        errorMessage =
          "You've reached the rate limit for the Replicate API. Please try again later.";
      } else if (errorMessage.includes("Credit balance")) {
        errorMessage =
          "Your Replicate account has insufficient credits. Please check your Replicate account.";
      } else if (errorMessage.includes("timed out")) {
        errorMessage =
          "Video generation took too long. Please try again with a simpler prompt or image.";
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
