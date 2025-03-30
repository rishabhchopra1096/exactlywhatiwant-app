"use client";

// CREATED: Dashboard page component
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ChatSidebar from "../../components/ChatSidebar";
import ChatInterface from "../../components/ChatInterface";
import ProductPanel from "../../components/ProductPanel";

// Types
type ProductType =
  | "tshirt"
  | "shirt"
  | "bottle"
  | "hoodie"
  | "notebook";
type ChatMessage = {
  id: string;
  content: string;
  sender: "user" | "system";
  timestamp: Date;
  imageUrl?: string;
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [selectedProduct, setSelectedProduct] =
    useState<ProductType>("shirt");
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    null
  );
  const [currentDesignUrl, setCurrentDesignUrl] = useState<
    string | null
  >(null);

  // Function to create a new chat
  const createNewChat = () => {
    // This would normally create a new chat in Firestore
    // For MVP, we'll just set a temporary ID
    const newChatId = `chat_${Date.now()}`;
    setCurrentChatId(newChatId);
  };

  // Function to select a chat
  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  // Function to update the current design
  const updateDesign = (imageUrl: string) => {
    setCurrentDesignUrl(imageUrl);
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Chat History */}
      <div className="w-64 min-w-64 border-r border-gray-200 bg-white">
        <ChatSidebar
          currentChatId={currentChatId}
          onSelectChat={selectChat}
          onNewChat={createNewChat}
          user={user}
          onLogout={logout}
        />
      </div>

      {/* Middle Panel - Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          chatId={currentChatId}
          onDesignUpdate={updateDesign}
        />
      </div>

      {/* Right Panel - Product Visualization */}
      <div className="w-96 min-w-96 border-l border-gray-200 bg-white">
        <ProductPanel
          productType={selectedProduct}
          onSelectProduct={setSelectedProduct}
          designUrl={currentDesignUrl}
        />
      </div>
    </div>
  );
}
