"use client";

// UPDATED: Modified dashboard layout to work with demo login
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for either Firebase auth or demo cookie
  useEffect(() => {
    const checkAuth = () => {
      // Check for demo cookie
      const hasDemoCookie =
        document.cookie.includes("authStatus=demo");

      if (user || hasDemoCookie) {
        setIsAuthorized(true);
      } else if (!loading) {
        // Only redirect if we're done checking Firebase auth
        router.push("/login");
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (isCheckingAuth || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Only render the dashboard if authorized
  if (!isAuthorized) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      {children}
    </div>
  );
}
