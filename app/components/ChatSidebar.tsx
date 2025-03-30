"use client";

// UPDATED: Modified ChatSidebar component to work with demo login
import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  PlusCircle,
  LogOut,
  MessageSquare,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatSidebarProps {
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  user: User | null;
  onLogout: () => Promise<void>;
}

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
}

export default function ChatSidebar({
  currentChatId,
  onSelectChat,
  onNewChat,
  user,
  onLogout,
}: ChatSidebarProps) {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([
    // Mock data for MVP
    {
      id: "chat_1",
      title: "Tesla Shirt Design",
      timestamp: new Date(),
    },
    {
      id: "chat_2",
      title: "Nike Logo Project",
      timestamp: new Date(),
    },
    {
      id: "chat_3",
      title: "Custom Water Bottle",
      timestamp: new Date(),
    },
  ]);

  // Handle logout for both Firebase and demo login
  const handleLogout = async () => {
    // Clear demo cookie
    document.cookie =
      "authStatus=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Also call Firebase logout if we have a user
    if (user) {
      await onLogout();
    }

    // Redirect to login
    router.push("/login");
  };

  // Determine user display info
  const userDisplayName = user
    ? user.displayName || user.email || "User"
    : "Demo User";
  const userInitial = user
    ? user.displayName?.[0] || user.email?.[0] || "U"
    : "D";
  const userPhotoURL = user?.photoURL;

  return (
    <div className="flex h-full flex-col">
      {/* Header with user info */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <h1 className="text-xl font-bold">ExactlyWhatIWant</h1>
      </div>

      {/* User info */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 p-2 text-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
          {userPhotoURL ? (
            <img
              src={userPhotoURL}
              alt={userDisplayName}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <span>{userInitial}</span>
          )}
        </div>
        <div className="flex-1 truncate">{userDisplayName}</div>
        <button
          onClick={handleLogout}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* New chat button */}
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 border-b border-gray-200 bg-white p-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <PlusCircle size={16} />
        <span>New chat</span>
      </button>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`flex w-full items-center gap-2 border-b border-gray-200 p-4 text-left text-sm hover:bg-gray-50 ${
              currentChatId === chat.id ? "bg-gray-100" : ""
            }`}
          >
            <MessageSquare size={16} className="text-gray-500" />
            <div className="flex-1 truncate">{chat.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
