"use client";

// UPDATED: Modified dashboard page to work with demo login
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import ChatSidebar from "../../components/ChatSidebar";
import ChatInterface from "../../components/ChatInterface";
import ProductPanel from "../../components/ProductPanel";
import { Menu, X } from "lucide-react";

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
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] =
    useState<ProductType>("shirt");
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    null
  );
  const [currentDesignUrl, setCurrentDesignUrl] = useState<
    string | null
  >(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProductPanel, setShowProductPanel] = useState(false);

  // Auto-select first chat for better demo experience
  useEffect(() => {
    if (!currentChatId) {
      setCurrentChatId("chat_1");
    }
  }, [currentChatId]);

  // Function to create a new chat
  const createNewChat = () => {
    // This would normally create a new chat in Firestore
    // For MVP, we'll just set a temporary ID
    const newChatId = `chat_${Date.now()}`;
    setCurrentChatId(newChatId);
    setShowSidebar(false); // Close sidebar on mobile after selecting
  };

  // Function to select a chat
  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setShowSidebar(false); // Close sidebar on mobile after selecting
  };

  // Function to update the current design
  const updateDesign = (imageUrl: string) => {
    setCurrentDesignUrl(imageUrl);
    setShowProductPanel(true); // Show product panel when a design is selected
  };

  return (
    <div className="relative flex h-full">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="fixed left-4 top-4 z-40 rounded-full bg-blue-500 p-2 text-white shadow-lg md:hidden"
      >
        {showSidebar ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile product panel toggle */}
      <button
        onClick={() => setShowProductPanel(!showProductPanel)}
        className="fixed right-4 top-4 z-40 rounded-full bg-blue-500 p-2 text-white shadow-lg md:hidden"
      >
        {showProductPanel ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Left Panel - Chat History */}
      <div
        className={`
        fixed inset-y-0 left-0 z-30 w-64 border-r border-gray-200 bg-white transition-transform duration-300 md:static md:translate-x-0
        ${showSidebar ? "translate-x-0" : "-translate-x-full"}
      `}
      >
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
      <div
        className={`
        fixed inset-y-0 right-0 z-30 w-full max-w-md border-l border-gray-200 bg-white transition-transform duration-300 md:static md:translate-x-0 md:w-96
        ${showProductPanel ? "translate-x-0" : "translate-x-full"}
      `}
      >
        <ProductPanel
          productType={selectedProduct}
          onSelectProduct={setSelectedProduct}
          designUrl={currentDesignUrl}
        />
      </div>

      {/* Backdrop for mobile when sidebar or product panel is open */}
      {(showSidebar || showProductPanel) && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-30 md:hidden"
          onClick={() => {
            setShowSidebar(false);
            setShowProductPanel(false);
          }}
        />
      )}
    </div>
  );
}
