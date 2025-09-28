'use client';

import { signOut } from "next-auth/react";
import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
  redirectTo?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({
  variant = "outline",
  size = "md",
  showIcon = true,
  className = "",
  redirectTo = "/",
  children,
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({
        callbackUrl: redirectTo,
        redirect: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  // Variant styles
  const variantStyles = {
    default: "bg-blue-600 hover:bg-blue-700 text-white",
    outline: "border border-gray-300 hover:bg-gray-50 text-gray-700",
    ghost: "hover:bg-gray-100 text-gray-700",
    destructive: "bg-red-600 hover:bg-red-700 text-white",
  };

  // Size styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-md font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        showIcon && <LogOut className="h-4 w-4" />
      )}
      {children || (isLoading ? "Signing out..." : "Sign Out")}
    </button>
  );
}

// Alternative minimal version
export function SimpleLogoutButton() {
  const handleLogout = () => {
    signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  );
}

// Dropdown menu item version
export function LogoutMenuItem() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {isLoading ? "Signing out..." : "Sign Out"}
    </button>
  );
}

// Demo component showing different variations
export function LogoutButtonDemo() {
  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Logout Button Variations</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Default Styles</h3>
          <div className="flex gap-4 flex-wrap">
            <LogoutButton variant="default" />
            <LogoutButton variant="outline" />
            <LogoutButton variant="ghost" />
            <LogoutButton variant="destructive" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Different Sizes</h3>
          <div className="flex gap-4 items-center flex-wrap">
            <LogoutButton size="sm" />
            <LogoutButton size="md" />
            <LogoutButton size="lg" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Without Icon</h3>
          <LogoutButton showIcon={false} />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Custom Text</h3>
          <LogoutButton variant="destructive">
            Leave Account
          </LogoutButton>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Simple Version</h3>
          <SimpleLogoutButton />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Dropdown Menu Item</h3>
          <div className="border rounded-md w-48">
            <LogoutMenuItem />
          </div>
        </div>
      </div>
    </div>
  );
}