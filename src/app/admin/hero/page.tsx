// src/app/admin/hero/page.tsx

"use client";

import { useEffect, useState } from "react";
import HeroForm from "@/components/admin/HeroForm";
import { RefreshCw } from "lucide-react";

interface HeroData {
  title: string;
  description: string;
  imageUrl: string;
}

export default function HeroPage() {
  const [heroData, setHeroData] = useState<HeroData>({
    title: "",
    description: "",
    imageUrl: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchHeroData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/hero");
      const data = await response.json();
      if (data.success) {
        setHeroData(data.hero);
      }
    } catch (error) {
      console.error("Error fetching hero data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-green-600" />
          <p className="mt-2 text-gray-600">Loading hero section...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Hero Section Management
        </h1>
        <p className="mt-2 text-gray-600">
          Configure the homepage hero section for customers
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Edit Hero Section
          </h2>
          <HeroForm initialData={heroData} onSuccess={fetchHeroData} />
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Current Hero Section
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Title:
              </label>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {heroData.title}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Description:
              </label>
              <p className="mt-1 text-gray-600">{heroData.description}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Image:
              </label>
              <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroData.imageUrl}
                  alt="Hero"
                  className="h-64 w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
