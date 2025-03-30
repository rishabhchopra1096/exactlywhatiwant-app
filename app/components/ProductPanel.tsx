"use client";

// UPDATED: Improved product panel with better image handling
import { useState } from "react";
import { ShoppingCart } from "lucide-react";

interface ProductPanelProps {
  productType: "tshirt" | "shirt" | "bottle" | "hoodie" | "notebook";
  onSelectProduct: (
    product: "tshirt" | "shirt" | "bottle" | "hoodie" | "notebook"
  ) => void;
  designUrl: string | null;
}

// Mock product data
const products = {
  tshirt: {
    name: "100% Cotton T-Shirt",
    price: 2500, // in cents
    description:
      "Premium cotton t-shirt with a comfortable fit. Perfect for everyday wear.",
    colors: ["black", "white", "gray", "blue"],
    defaultImage: "https://placehold.co/400x500?text=T-Shirt",
  },
  shirt: {
    name: "100% LINEN SHIRT",
    price: 5550, // in cents
    description:
      "Regular fit-linen shirt. Button-down collar and long sleeves with buttoned cuffs. Pleat detail at the centre back. Hem with side vents. Button fastening.",
    colors: ["black", "gray", "white", "beige"],
    defaultImage: "https://placehold.co/400x500?text=Shirt",
  },
  bottle: {
    name: "Insulated Water Bottle",
    price: 3000, // in cents
    description:
      "Double-walled stainless steel bottle that keeps your drinks cold for 24 hours or hot for 12 hours.",
    colors: ["black", "silver", "blue", "red"],
    defaultImage: "https://placehold.co/400x500?text=Bottle",
  },
  hoodie: {
    name: "Premium Hoodie",
    price: 4500, // in cents
    description:
      "Soft and comfortable hoodie with a kangaroo pocket and adjustable drawstring hood.",
    colors: ["black", "gray", "navy", "green"],
    defaultImage: "https://placehold.co/400x500?text=Hoodie",
  },
  notebook: {
    name: "Hardcover Notebook",
    price: 1800, // in cents
    description:
      "Premium hardcover notebook with 192 pages of acid-free paper. Perfect for sketching and note-taking.",
    colors: ["black", "white", "brown", "red"],
    defaultImage: "https://placehold.co/400x500?text=Notebook",
  },
};

export default function ProductPanel({
  productType,
  onSelectProduct,
  designUrl,
}: ProductPanelProps) {
  const [selectedColor, setSelectedColor] = useState<string>("black");

  const product = products[productType];

  // Format price to display as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price / 100);
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Product type tabs */}
      <div className="flex border-b border-gray-200">
        {Object.keys(products).map((type) => (
          <button
            key={type}
            onClick={() => onSelectProduct(type as any)}
            className={`flex-1 border-b-2 px-4 py-3 text-sm font-medium ${
              productType === type
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Product display */}
      <div className="p-4">
        {/* Product image */}
        <div className="mb-4 overflow-hidden rounded-lg bg-gray-100">
          {/* In a real app, we would display the design on the product */}
          {designUrl ? (
            <div className="relative aspect-square w-full">
              {/* This is a simplified mock-up. In a real app, we would properly composite the image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={designUrl}
                  alt="Your design"
                  className="h-1/2 w-1/2 object-contain"
                />
              </div>
              <img
                src={product.defaultImage}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-gray-200">
              <p className="text-center text-gray-500">
                Upload an image and edit it in the chat to see your
                design on this product
              </p>
            </div>
          )}
        </div>

        {/* Product details */}
        <h2 className="text-xl font-bold text-gray-900">
          {product.name}
        </h2>
        <p className="mt-1 text-xl font-medium text-gray-900">
          {formatPrice(product.price)}
        </p>

        {/* Color selection */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-900">Color</h3>
          <div className="mt-2 flex gap-2">
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`h-8 w-8 rounded-full border ${
                  selectedColor === color
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : "border-gray-300"
                }`}
                style={{
                  backgroundColor:
                    color === "white"
                      ? "#ffffff"
                      : color === "black"
                      ? "#000000"
                      : color === "gray"
                      ? "#9ca3af"
                      : color === "beige"
                      ? "#e8d9c0"
                      : color === "blue"
                      ? "#3b82f6"
                      : color === "navy"
                      ? "#1e3a8a"
                      : color === "green"
                      ? "#10b981"
                      : color === "red"
                      ? "#ef4444"
                      : color === "silver"
                      ? "#c0c0c0"
                      : color === "brown"
                      ? "#92400e"
                      : "#cccccc",
                }}
              ></button>
            ))}
          </div>
        </div>

        {/* Product description */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-900">
            Description
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            {product.description}
          </p>
        </div>

        {/* Add to cart button (non-functional for MVP) */}
        <button className="mt-6 w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <div className="flex items-center justify-center gap-2">
            <ShoppingCart size={16} />
            <span>Add to cart</span>
          </div>
        </button>
      </div>
    </div>
  );
}
