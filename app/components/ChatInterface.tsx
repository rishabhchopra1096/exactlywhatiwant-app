"use client";

// UPDATED: Modified ChatInterface to use real Gemini API with comprehensive image tracking
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Image as ImageIcon,
  Loader,
  FileUp,
  Film,
} from "lucide-react";

// UPDATED: Enhanced interfaces for better image handling
interface ImageData {
  id: string;
  data: string; // base64 encoded image
  mimeType: string;
  name?: string;
  timestamp: Date;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "system";
  timestamp: Date;
  // UPDATED: Changed direct image embedding to references
  imageId?: string; // Reference to a specific image (for displaying a single image)
  imageIds?: string[]; // References to multiple images (for messages referring to multiple images)
  // Keep for backward compatibility until fully migrated
  imageUrl?: string;
  // ADDED: Support for video URLs
  videoUrl?: string;
}

interface ChatInterfaceProps {
  chatId: string | null;
  onDesignUpdate: (imageUrl: string) => void;
  // ADDED: Current product type for enhanced video generation
  productType?: "tshirt" | "shirt" | "bottle" | "hoodie" | "notebook";
}

export default function ChatInterface({
  chatId,
  onDesignUpdate,
  productType = "tshirt", // Default to t-shirt if not specified
}: ChatInterfaceProps) {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UPDATED: Enhanced image state management
  const [uploadedImages, setUploadedImages] = useState<ImageData[]>(
    []
  );
  const [generatedImages, setGeneratedImages] = useState<ImageData[]>(
    []
  );
  const [currentImageId, setCurrentImageId] = useState<string | null>(
    null
  );

  // ADDED: Video generation state
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // ADDED: Utility functions for image management
  const generateUniqueId = (): string => {
    return `img_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
  };

  // Find an image by its ID across both uploaded and generated images
  const findImageById = (imageId: string): ImageData | undefined => {
    return [...uploadedImages, ...generatedImages].find(
      (img) => img.id === imageId
    );
  };

  // Find an image by reference terms in the prompt
  const findImageByReference = (
    reference: string
  ): ImageData | undefined => {
    // Handle common reference patterns
    const lowerRef = reference.toLowerCase();

    if (lowerRef.includes("original") || lowerRef.includes("first")) {
      // Return the first uploaded image
      return uploadedImages[0];
    }

    if (lowerRef.includes("previous") || lowerRef.includes("last")) {
      // Return the most recent generated image
      return generatedImages.length > 0
        ? generatedImages[generatedImages.length - 1]
        : undefined;
    }

    if (lowerRef.includes("light blue")) {
      // Look for an image with light blue in its name or matching by data analysis
      // This is a simplified example - in a real app, you might use image analysis
      return [...uploadedImages, ...generatedImages].find(
        (img) =>
          img.name?.toLowerCase().includes("light blue") ||
          currentImageId === img.id // currently active image
      );
    }

    // Default to the current image
    return currentImageId ? findImageById(currentImageId) : undefined;
  };

  // Extract image reference from a prompt
  const extractImageReference = (
    prompt: string
  ): {
    cleanedPrompt: string;
    reference: string | null;
  } => {
    // Look for patterns like "change the [reference] image to..."
    const referencePatterns = [
      /\b(original|first|initial|uploaded)\b/i,
      /\b(previous|last|recent)\b/i,
      /\b(light blue|dark blue|white)\b/i,
      /\brevert\b/i,
    ];

    let reference: string | null = null;

    for (const pattern of referencePatterns) {
      const match = prompt.match(pattern);
      if (match && match[0]) {
        reference = match[0];
        break;
      }
    }

    // Remove specific reference instructions from the prompt if needed
    let cleanedPrompt = prompt;
    if (reference && reference === "revert") {
      cleanedPrompt = "revert to the original image";
    }

    return { cleanedPrompt, reference };
  };

  // Mock initial message for new chat
  useEffect(() => {
    if (chatId) {
      // In a real app, we would fetch messages from Firestore
      setMessages([
        {
          id: "welcome",
          content:
            "Welcome! Upload an image or describe what you want to design.",
          sender: "system",
          timestamp: new Date(),
        },
      ]);
    }
  }, [chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Process image with Gemini API
  const processImageWithGeminiAPI = async (
    imageData: ImageData,
    prompt: string,
    messageHistory: Message[] = []
  ) => {
    try {
      setError(null);

      // UPDATED: Log the request for debugging
      console.log("Sending request to Gemini API:", {
        prompt,
        imageId: imageData.id,
        messageHistoryLength: messageHistory.length,
      });

      // Prepare the message history in a format suitable for the API
      const processedHistory = messageHistory.map((msg) => {
        // Convert our internal message format to the format expected by the API
        const processedMsg: {
          role: string;
          content: string;
          imageUrl?: string;
        } = {
          role: msg.sender === "system" ? "model" : "user",
          content: msg.content,
        };

        // If the message has an image reference, find the corresponding image
        if (msg.imageId) {
          const image = findImageById(msg.imageId);
          if (image) {
            processedMsg.imageUrl = image.data;
          }
        } else if (msg.imageUrl) {
          // Legacy support
          processedMsg.imageUrl = msg.imageUrl;
        }

        return processedMsg;
      });

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageData.data,
          prompt: prompt,
          chatHistory: processedHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process image");
      }

      const result = await response.json();

      // UPDATED: Log the response for debugging
      console.log("Received response from Gemini API:", result);

      return result;
    } catch (error) {
      console.error("Error processing image with Gemini API:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process image"
      );
      throw error;
    }
  };

  // ADDED: Function to generate a video from the current design
  const generateVideo = async (imageData: ImageData) => {
    try {
      setIsGeneratingVideo(true);
      setError(null);

      // Create a message showing we're generating a video
      const processingMessage: Message = {
        id: `msg_${Date.now()}`,
        content: `Generating a video for your ${productType} design... (this may take up to a minute)`,
        sender: "system",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, processingMessage]);

      // Create a prompt based on the product type
      const prompt = `Create a video showing a ${productType} with the image on it. If it's a werable (like a t-shirt or hoodie), show it on a model wearing it. If it's an object show it on a bottle. If it's an object(like a notebook or mug), show it being used`;

      console.log(
        `Generating video for ${productType} with prompt: ${prompt}`
      );

      // Call the video generation API
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: imageData.data,
          prompt: prompt,
          productType: productType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate video"
        );
      }

      const result = await response.json();
      console.log("Video generation result:", result);

      // Update the video URL
      setVideoUrl(result.videoUrl);

      // Remove the processing message
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== processingMessage.id)
      );

      // Add a message about the video
      const videoMessage: Message = {
        id: `msg_${Date.now()}`,
        content: `Here's a video showing your ${productType} design in action:`,
        sender: "system",
        timestamp: new Date(),
        imageId: imageData.id, // Reference the image the video was generated from
        videoUrl: result.videoUrl,
      };

      setMessages((prev) => [...prev, videoMessage]);

      return result.videoUrl;
    } catch (error) {
      console.error("Error generating video:", error);
      setError(
        error instanceof Error
          ? `Video generation error: ${error.message}`
          : "Failed to generate video"
      );

      // Add an error message
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        content: `Sorry, I couldn't generate a video of your design. ${
          error instanceof Error
            ? error.message
            : "Please try again later."
        }`,
        sender: "system",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      return null;
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatId) return;

    // UPDATED: Extract any image references from the prompt
    const { cleanedPrompt, reference } =
      extractImageReference(inputValue);

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsProcessing(true);

    try {
      // Get the image to process - either from reference or the last used image
      let imageToProcess: ImageData | undefined;

      if (reference) {
        // Try to find the referenced image
        imageToProcess = findImageByReference(reference);
      } else {
        // Find the last used image (either from messages or current)
        if (currentImageId) {
          imageToProcess = findImageById(currentImageId);
        } else {
          // Look for the most recent image in messages
          const lastImageMessage = [...messages]
            .reverse()
            .find((msg) => msg.imageId || msg.imageUrl);

          if (lastImageMessage?.imageId) {
            imageToProcess = findImageById(lastImageMessage.imageId);
          } else if (lastImageMessage?.imageUrl) {
            // Legacy support - convert imageUrl to ImageData
            const lastImageUrl = lastImageMessage.imageUrl;
            imageToProcess = {
              id: generateUniqueId(),
              data: lastImageUrl,
              mimeType: "image/jpeg", // Assume JPEG for legacy
              timestamp: new Date(),
            };
          }
        }
      }

      if (imageToProcess) {
        // Process with the image
        const result = await processImageWithGeminiAPI(
          imageToProcess,
          cleanedPrompt,
          messages
        );

        // Check if we got a new image back
        if (result.image) {
          // Create a new image entry
          const newGeneratedImage: ImageData = {
            id: generateUniqueId(),
            data: result.image,
            mimeType: "image/jpeg", // Assume JPEG but could be extracted
            timestamp: new Date(),
          };

          // Add to generated images
          setGeneratedImages((prev) => [...prev, newGeneratedImage]);
          setCurrentImageId(newGeneratedImage.id);

          // UPDATED: Create a response message with Gemini's response
          const responseMessage: Message = {
            id: `msg_${Date.now() + 1}`,
            content: result.text || "Here is your processed design:",
            sender: "system",
            timestamp: new Date(),
            imageId: newGeneratedImage.id,
          };

          setMessages((prev) => [...prev, responseMessage]);

          // Update the design in the product panel
          onDesignUpdate(newGeneratedImage.data);

          // ADDED: Generate a video for the new design
          generateVideo(newGeneratedImage);
        } else {
          // No image was returned, just text
          const responseMessage: Message = {
            id: `msg_${Date.now() + 1}`,
            content:
              result.text ||
              "I've processed your request but couldn't generate a new image.",
            sender: "system",
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, responseMessage]);

          // UPDATED: If no image was returned but we expected one, show a message
          console.warn("No image was returned from the Gemini API");
        }
      } else {
        // No image to process, just respond with text
        const responseMessage: Message = {
          id: `msg_${Date.now() + 1}`,
          content:
            "Please upload an image first for me to work with.",
          sender: "system",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, responseMessage]);
      }
    } catch (error) {
      console.error("Error in send message:", error);

      // UPDATED: Add error message to the chat
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        content: `Error: ${
          error instanceof Error
            ? error.message
            : "Failed to process your request"
        }`,
        sender: "system",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Function to handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file || !chatId) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Convert file to base64
      const base64Image = await fileToBase64(file);

      // Create a new uploaded image
      const newUploadedImage: ImageData = {
        id: generateUniqueId(),
        data: base64Image,
        mimeType: file.type,
        name: file.name,
        timestamp: new Date(),
      };

      // Add to uploaded images
      setUploadedImages((prev) => [...prev, newUploadedImage]);
      setCurrentImageId(newUploadedImage.id);

      // Create a message for the uploaded image
      const uploadMessage: Message = {
        id: `msg_${Date.now()}`,
        content: "Uploaded an image for processing",
        sender: "user",
        timestamp: new Date(),
        imageId: newUploadedImage.id,
      };

      setMessages((prev) => [...prev, uploadMessage]);

      // Process with generic prompt for initial image
      // Do not change this prompt. Maintain original image.
      const result = await processImageWithGeminiAPI(
        newUploadedImage,
        "Process this image.",
        [uploadMessage]
      );

      // If we got a new image, add it to generated images
      if (result.image) {
        // Create a new generated image
        const newGeneratedImage: ImageData = {
          id: generateUniqueId(),
          data: result.image,
          mimeType: "image/jpeg", // Assume JPEG
          name: `processed_${file.name}`,
          timestamp: new Date(),
        };

        // Add to generated images
        setGeneratedImages((prev) => [...prev, newGeneratedImage]);
        setCurrentImageId(newGeneratedImage.id);

        // UPDATED: Create a response message with the processed image
        const responseMessage: Message = {
          id: `msg_${Date.now() + 1}`,
          content:
            result.text ||
            "Here's the processed image, ready for design purposes:",
          sender: "system",
          timestamp: new Date(),
          imageId: newGeneratedImage.id,
        };

        setMessages((prev) => [...prev, responseMessage]);

        // Update the design in the product panel
        onDesignUpdate(newGeneratedImage.data);
        console.log("Design updated with generated image");

        // ADDED: Generate a video for the new design
        generateVideo(newGeneratedImage);
      } else {
        // No image was returned, use the original
        const responseMessage: Message = {
          id: `msg_${Date.now() + 1}`,
          content:
            result.text ||
            "I've processed your image, but no changes were needed.",
          sender: "system",
          timestamp: new Date(),
          imageId: newUploadedImage.id,
        };

        setMessages((prev) => [...prev, responseMessage]);

        // Update with the original image
        onDesignUpdate(newUploadedImage.data);
        console.log(
          "Design updated with original image (no generated image returned)"
        );
      }
    } catch (error) {
      console.error("Error processing image:", error);

      // Error message
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        content:
          "Sorry, there was an error processing your image. Please try again.",
        sender: "system",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {!chatId ? (
        <div className="flex h-full flex-col items-center justify-center bg-gray-50 p-4">
          <p className="text-center text-gray-500">
            Select a chat or create a new one to get started
          </p>
        </div>
      ) : (
        <div
          className={`relative flex h-full flex-col overflow-hidden bg-gray-50 ${
            dragActive ? "ring-2 ring-blue-500" : ""
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${
                  message.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p>{message.content}</p>
                  {/* UPDATED: Handle image rendering with the new imageId reference */}
                  {message.imageId && (
                    <div className="mt-2">
                      {/* Find the image by ID from both collections */}
                      {(() => {
                        const image = findImageById(message.imageId);
                        if (image) {
                          return (
                            <img
                              src={image.data}
                              alt="Image referenced in message"
                              className="max-h-60 w-full rounded-md object-contain"
                              onClick={() =>
                                onDesignUpdate(image.data)
                              }
                            />
                          );
                        }
                        return null;
                      })()}
                      {message.sender === "system" && (
                        <button
                          onClick={() => {
                            const image = findImageById(
                              message.imageId!
                            );
                            if (image) {
                              onDesignUpdate(image.data);
                            }
                          }}
                          className="mt-2 w-full rounded bg-blue-600 py-1 text-sm text-white"
                        >
                          Use this design
                        </button>
                      )}
                    </div>
                  )}

                  {/* ADDED: Video display */}
                  {message.videoUrl && (
                    <div className="mt-2">
                      <video
                        src={message.videoUrl}
                        controls
                        autoPlay={false}
                        className="max-h-60 w-full rounded-md object-contain"
                        poster={
                          message.imageId
                            ? findImageById(message.imageId)?.data
                            : undefined
                        }
                        style={{
                          maxWidth: "100%",
                          backgroundColor: "#000",
                        }}
                      >
                        <source
                          src={message.videoUrl}
                          type="video/mp4"
                        />
                        Your browser does not support the video tag.
                      </video>
                      <div className="mt-2 text-xs text-gray-500">
                        {message.sender === "system" &&
                          "Video showing your design in action"}
                      </div>
                    </div>
                  )}

                  {/* Legacy support for imageUrl */}
                  {!message.imageId && message.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={message.imageUrl}
                        alt="Uploaded or processed image"
                        className="max-h-60 w-full rounded-md object-contain"
                        onClick={() =>
                          message.imageUrl &&
                          onDesignUpdate(message.imageUrl)
                        }
                      />
                      {message.sender === "system" && (
                        <button
                          onClick={() =>
                            message.imageUrl &&
                            onDesignUpdate(message.imageUrl)
                          }
                          className="mt-2 w-full rounded bg-blue-600 py-1 text-sm text-white"
                        >
                          Use this design
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="mb-4 flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-3 text-gray-800">
                  <Loader className="h-5 w-5 animate-spin" />
                  <p>Processing your image...</p>
                </div>
              </div>
            )}

            {/* ADDED: Video generation indicator */}
            {isGeneratingVideo && (
              <div className="mb-4 flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-3 text-gray-800">
                  <Film className="h-5 w-5 animate-pulse" />
                  <p>
                    Generating video of your design (this may take a
                    minute)...
                  </p>
                </div>
              </div>
            )}

            {/* Invisible element for scrolling to bottom */}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 bg-white p-4">
            {error && (
              <div className="mb-2 rounded-md bg-red-50 p-2 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
                title="Upload image"
              >
                <FileUp size={20} />
              </button>

              {/* ADDED: Generate video button, only shown when we have images */}
              {(uploadedImages.length > 0 ||
                generatedImages.length > 0) &&
                currentImageId && (
                  <button
                    onClick={() => {
                      const currentImage =
                        findImageById(currentImageId);
                      if (currentImage) {
                        generateVideo(currentImage);
                      }
                    }}
                    disabled={isGeneratingVideo}
                    className="rounded-full bg-purple-500 p-2 text-white hover:bg-purple-600 disabled:bg-purple-300"
                    title="Generate video from current design"
                  >
                    <Film size={20} />
                  </button>
                )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                className="hidden"
              />

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />

              <button
                onClick={handleSendMessage}
                disabled={isProcessing || !inputValue.trim()}
                className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:bg-blue-300"
                title="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
