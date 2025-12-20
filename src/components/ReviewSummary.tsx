'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';

interface ReviewSummaryData {
  summary: string;
  pros: string[];
  cons: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  keyTopics: string[];
  averageRating: number;
  totalReviews: number;
  cached?: boolean;
}

interface ReviewSummaryProps {
  productId: string;
  totalReviews: number;
}

const sentimentConfig = {
  positive: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Positive',
    icon: '😊',
  },
  neutral: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Neutral',
    icon: '😐',
  },
  negative: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Negative',
    icon: '😞',
  },
  mixed: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Mixed',
    icon: '🤔',
  },
};

export default function ReviewSummary({ productId, totalReviews }: ReviewSummaryProps) {
  const [summaryData, setSummaryData] = useState<ReviewSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const fetchSummary = async (forceRegenerate = false) => {
    if (totalReviews < 5) {
      setError(`Need ${5 - totalReviews} more reviews for AI summary`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = forceRegenerate
        ? `/api/reviews/summarize`
        : `/api/reviews/summarize?productId=${productId}`;

      const options = forceRegenerate
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId }),
          }
        : { method: 'GET' };

      const response = await fetch(url, options);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Failed to fetch summary');
      }

      const data = await response.json();
      setSummaryData(data);
    } catch (err) {
      console.error('Error fetching review summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (totalReviews >= 5) {
      fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, totalReviews]);

  const handleRegenerate = () => {
    setRegenerating(true);
    fetchSummary(true);
  };

  // Don't show anything if not enough reviews
  if (totalReviews < 5) {
    return null;
  }

  // Loading state
  if (loading && !summaryData) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-purple-200 rounded"></div>
          <div className="h-6 bg-purple-200 rounded w-48"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-purple-100 rounded w-full"></div>
          <div className="h-4 bg-purple-100 rounded w-5/6"></div>
          <div className="h-4 bg-purple-100 rounded w-4/6"></div>
        </div>
        <div className="mt-4 flex gap-4">
          <div className="flex-1 h-24 bg-green-100 rounded-lg"></div>
          <div className="flex-1 h-24 bg-red-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !summaryData) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-600">
            <Sparkles size={20} />
            <span className="font-semibold">AI Review Summary</span>
          </div>
          <button
            onClick={() => fetchSummary()}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
        <p className="text-gray-500 text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (!summaryData) {
    return null;
  }

  const sentiment = sentimentConfig[summaryData.sentiment];

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-purple-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles size={20} className="text-purple-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-800">AI Review Summary</h3>
            <p className="text-sm text-gray-500">
              Based on {summaryData.totalReviews} reviews
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Sentiment Badge */}
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${sentiment.bgColor} ${sentiment.color}`}
          >
            <span>{sentiment.icon}</span>
            {sentiment.label}
          </span>
          {expanded ? (
            <ChevronUp size={20} className="text-gray-400" />
          ) : (
            <ChevronDown size={20} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Summary Text */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-700 leading-relaxed">{summaryData.summary}</p>
          </div>

          {/* Pros and Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pros */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-2 text-green-700 font-semibold mb-3">
                <ThumbsUp size={18} />
                <span>What customers love</span>
              </div>
              {summaryData.pros.length > 0 ? (
                <ul className="space-y-2">
                  {summaryData.pros.map((pro, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-green-800"
                    >
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-green-600 italic">No specific pros identified</p>
              )}
            </div>

            {/* Cons */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center gap-2 text-red-700 font-semibold mb-3">
                <ThumbsDown size={18} />
                <span>Areas for improvement</span>
              </div>
              {summaryData.cons.length > 0 ? (
                <ul className="space-y-2">
                  {summaryData.cons.map((con, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-red-800"
                    >
                      <span className="text-red-500 mt-0.5">✗</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-red-600 italic">No specific concerns mentioned</p>
              )}
            </div>
          </div>

          {/* Key Topics */}
          {summaryData.keyTopics.length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                <Tag size={18} />
                <span>Frequently mentioned topics</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {summaryData.keyTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer with Rating and Regenerate */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <TrendingUp size={16} />
              <span>
                Average: <strong className="text-gray-700">{summaryData.averageRating}</strong>/5
              </span>
              {summaryData.cached && (
                <span className="text-xs text-gray-400 ml-2">(cached)</span>
              )}
            </div>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
              {regenerating ? 'Regenerating...' : 'Refresh Summary'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
