"use client";

// UPDATED: Modified ChatInterface to use real Gemini API
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Image as ImageIcon,
  Loader,
  FileUp,
} from "lucide-react";

interface ChatInterfaceProps {
  chatId: string | null;
  onDesignUpdate: (imageUrl: string) => void;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "system";
  timestamp: Date;
  imageUrl?: string;
}

// Function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export default function ChatInterface({
  chatId,
  onDesignUpdate,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    imageData: string,
    prompt: string
  ) => {
    try {
      setError(null);

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageData,
          prompt: prompt,
          // We could add chat history here if needed
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process image");
      }

      const result = await response.json();
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

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatId) return;

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
      // Get the last image message from the system if available
      const lastImageMessage = [...messages]
        .reverse()
        .find((msg) => msg.sender === "system" && msg.imageUrl);

      if (lastImageMessage?.imageUrl) {
        // Process with the last generated image
        const result = await processImageWithGeminiAPI(
          lastImageMessage.imageUrl,
          inputValue
        );

        // Create a response message with Gemini's response
        const responseMessage: Message = {
          id: `msg_${Date.now() + 1}`,
          content: result.text || "Here is your processed design:",
          sender: "system",
          timestamp: new Date(),
          imageUrl: result.image || undefined,
        };

        setMessages((prev) => [...prev, responseMessage]);

        // Update the design in the product panel if we got an image
        if (result.image) {
          onDesignUpdate(result.image);
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
      // Error message already set in processImageWithGeminiAPI
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

      // Create a message for the uploaded image
      const uploadMessage: Message = {
        id: `msg_${Date.now()}`,
        content: "Uploaded an image for processing",
        sender: "user",
        timestamp: new Date(),
        imageUrl: base64Image,
      };

      setMessages((prev) => [...prev, uploadMessage]);

      // Process with generic prompt for initial image
      const result = await processImageWithGeminiAPI(
        base64Image,
        "Process this image and prepare it for design purposes. Enhance it if needed."
      );

      // Create a response message with the processed image
      const responseMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        content: result.text || "Here's your image ready for design:",
        sender: "system",
        timestamp: new Date(),
        imageUrl: result.image || base64Image, // Use original if no new image
      };

      setMessages((prev) => [...prev, responseMessage]);

      // Update the design in the product panel
      if (result.image) {
        onDesignUpdate(result.image);
      } else if (base64Image) {
        onDesignUpdate(base64Image);
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

  if (!chatId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50 p-4">
        <p className="text-center text-gray-500">
          Select a chat or create a new one to get started
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full flex-col ${
        dragActive ? "bg-blue-50" : ""
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Chat header */}
      <div className="border-b border-gray-200 bg-white p-4">
        <h2 className="text-lg font-medium">Design Chat</h2>
        <p className="text-xs text-gray-500">
          Upload an image or describe what you want to create
        </p>
      </div>

      {/* Messages area */}
      <div className="relative flex-1 overflow-y-auto p-4">
        {/* Drag and drop overlay */}
        {dragActive && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-100 bg-opacity-70">
            <div className="rounded-lg bg-white p-6 shadow-xl">
              <FileUp className="mx-auto mb-2 h-12 w-12 text-blue-500" />
              <p className="text-center font-medium">
                Drop your image here
              </p>
            </div>
          </div>
        )}

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
              {message.imageUrl && (
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

        {error && (
          <div className="mb-4 flex justify-center">
            <div className="rounded-lg bg-red-100 p-3 text-red-800">
              <p>Error: {error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white p-3 pt-2">
        <div className="mb-1 text-xs text-gray-500">
          Try uploading a logo or describing a design to create
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            disabled={isProcessing}
            title="Upload image"
          >
            <ImageIcon size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileInputChange}
            disabled={isProcessing}
          />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 focus:border-blue-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            disabled={isProcessing}
          />
          <button
            onClick={handleSendMessage}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            disabled={!inputValue.trim() || isProcessing}
            title="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
