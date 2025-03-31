"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Create{" "}
          <span className="text-blue-600">Exactly What You Want</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-12">
          Design custom products with AI. Upload your image, chat with
          our AI assistant, and see your designs come to life in
          real-time. Now with video generation!
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="p-6 bg-gray-50 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              AI-Powered Design
            </h3>
            <p className="text-gray-600">
              Create and modify designs through natural language
              conversation
            </p>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Real-time Preview
            </h3>
            <p className="text-gray-600">
              See your designs on multiple products as you create them
            </p>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Video Showcase
            </h3>
            <p className="text-gray-600">
              Generate realistic 3D videos of your designs on products
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center px-6 py-3 rounded-full bg-blue-600 text-white font-medium text-lg hover:bg-blue-700 transition-colors"
        >
          Start Creating <ArrowRight className="ml-2 h-5 w-5" />
        </Link>

        <p className="mt-4 text-gray-500 text-sm">
          This is a demo app - login with any email/password
        </p>
      </div>
    </main>
  );
}
