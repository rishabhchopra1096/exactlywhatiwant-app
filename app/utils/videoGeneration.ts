// CREATED: Video generation utilities using Replicate API
import { v4 as uuidv4 } from "uuid";
import Replicate from "replicate";
import fs from "fs";
import path from "path";
import os from "os";

// Initialize Replicate client with API token
const initReplicateClient = () => {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error(
      "REPLICATE_API_TOKEN is not defined in environment variables"
    );
  }
  return new Replicate({ auth: apiToken });
};

/**
 * Generate a video from an image using WAN-2 model
 *
 * @param imageData Base64 encoded image data (with data URL prefix)
 * @param prompt Text prompt describing the desired video
 * @returns Object with video URL and local path
 */
export async function generateVideoFromImage(
  imageData: string,
  prompt: string
): Promise<{ url: string; localPath?: string }> {
  try {
    // Get the Replicate client
    const replicate = initReplicateClient();

    // Create a temporary directory for processing
    const tempDir = path.join(os.tmpdir(), "exactlywhatiwant-videos");
    fs.mkdirSync(tempDir, { recursive: true });

    // Generate unique filenames for local storage
    const videoPath = path.join(tempDir, `video_${uuidv4()}.mp4`);

    console.log(`Running Replicate WAN model with prompt: ${prompt}`);

    // Make sure image is a proper data URL
    let imageUrl = imageData;
    if (!imageData.startsWith("data:")) {
      // If not a data URL, convert it
      imageUrl = `data:image/jpeg;base64,${imageData}`;
    }

    // Setup input parameters exactly as shown in documentation
    const input = {
      image: imageUrl,
      prompt: prompt,
      max_area: "832x480",
      fast_mode: "Balanced",
      lora_scale: 1,
      num_frames: 81,
      sample_shift: 3,
      sample_steps: 30,
      frames_per_second: 16,
      sample_guide_scale: 5,
    };

    // Use replicate.run exactly as shown in documentation
    console.log("Calling replicate.run with input:", {
      ...input,
      image: input.image.substring(0, 30) + "...", // Don't log the entire image data
    });

    const output = await replicate.run(
      "wavespeedai/wan-2.1-i2v-480p",
      { input }
    );

    console.log("Output from replicate.run:", output);

    // Process the output to get the video URL
    let videoUrl = "";

    if (typeof output === "string") {
      // If output is directly a string URL
      videoUrl = output;
      console.log("Output is a string URL");
    } else if (Array.isArray(output) && output.length > 0) {
      // If output is an array, take the first item
      videoUrl = output[0];
      console.log("Output is an array, using first item");
    } else if (output && typeof output === "object") {
      // If output is an object, try to find a URL property
      console.log(
        "Output is an object with properties:",
        Object.keys(output)
      );

      // Special handling for ReadableStream
      if ("locked" in output && "getReader" in output) {
        console.log("Handling ReadableStream response");
        try {
          // Need to consume the stream and convert to text
          const reader = (output as any).getReader();
          const chunks: Uint8Array[] = [];

          // Read all chunks from the stream
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }

          // This is a binary video file, not text - save it directly
          console.log(
            `Received ${chunks.length} chunks of binary data`
          );

          // Combine all chunks into a single buffer
          let totalLength = 0;
          chunks.forEach((chunk) => {
            totalLength += chunk.length;
          });

          const videoBuffer = new Uint8Array(totalLength);
          let offset = 0;

          for (const chunk of chunks) {
            videoBuffer.set(chunk, offset);
            offset += chunk.length;
          }

          console.log(`Total video size: ${totalLength} bytes`);

          // Save the video file
          fs.writeFileSync(videoPath, Buffer.from(videoBuffer));
          console.log(`Video saved to ${videoPath}`);

          // Create a unique ID for this video
          const videoId = uuidv4();

          // Move the file to a location accessible from the web
          const publicDir = path.join(
            process.cwd(),
            "public",
            "videos"
          );

          // Ensure directory exists
          fs.mkdirSync(publicDir, { recursive: true });

          // Create a web-accessible filename
          const publicFilename = `video_${videoId}.mp4`;
          const publicPath = path.join(publicDir, publicFilename);

          // Copy the video file to public directory
          fs.copyFileSync(videoPath, publicPath);

          // Create a URL that can be accessed from the web
          videoUrl = `/videos/${publicFilename}`;

          console.log(`Video copied to public path: ${publicPath}`);
          console.log(`Video URL for web: ${videoUrl}`);
        } catch (streamError) {
          console.error(
            "Error processing video stream:",
            streamError
          );
        }
      } else if ("url" in output) {
        videoUrl = (output as any).url;
      } else {
        // Try to stringify and search for URLs
        const outputStr = JSON.stringify(output);
        const urlMatch = outputStr.match(/(https?:\/\/[^\s"]+)/);
        if (urlMatch) {
          videoUrl = urlMatch[0];
          console.log("Found URL in object using regex:", videoUrl);
        }
      }
    }

    // Validate we have a URL
    if (!videoUrl) {
      console.error("No URL returned from Replicate API");
      throw new Error("No video URL returned from Replicate API");
    }

    // Now check if it's a valid URL string
    if (typeof videoUrl !== "string") {
      console.error(
        "Invalid URL type returned:",
        typeof videoUrl,
        videoUrl
      );
      throw new Error(
        `Invalid URL type returned: ${typeof videoUrl}`
      );
    }

    // UPDATED: Accept both http URLs and local paths (starting with "/videos/")
    if (
      !videoUrl.startsWith("http") &&
      !videoUrl.startsWith("/videos/")
    ) {
      console.error("Invalid URL format:", videoUrl);
      throw new Error(
        "Invalid URL format returned - must start with http or /videos/"
      );
    }

    console.log("Final video URL:", videoUrl);

    return {
      url: videoUrl,
      localPath: videoPath,
    };
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
}

/**
 * Download a video from a URL to a local file
 *
 * @param url URL of the video to download
 * @param outputPath Local path to save the video
 * @returns Path to the downloaded video file
 */
export async function downloadVideo(
  url: string,
  outputPath?: string
): Promise<string> {
  try {
    // Create a temporary directory if needed
    const tempDir = path.join(os.tmpdir(), "exactlywhatiwant-videos");
    fs.mkdirSync(tempDir, { recursive: true });

    // Generate a unique filename if not provided
    const videoPath =
      outputPath || path.join(tempDir, `video_${uuidv4()}.mp4`);

    // Download the video using fetch
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to download video: ${response.status} ${response.statusText}`
      );
    }

    const videoBuffer = await response.arrayBuffer();
    fs.writeFileSync(videoPath, Buffer.from(videoBuffer));

    return videoPath;
  } catch (error) {
    console.error("Error downloading video:", error);
    throw error;
  }
}
