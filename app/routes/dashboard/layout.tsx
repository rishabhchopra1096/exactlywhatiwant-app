"use client";

// CREATED: Dashboard layout component
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/routes/login");
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  // Only render the dashboard if the user is authenticated
  if (!user) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      {children}
    </div>
  );
}
