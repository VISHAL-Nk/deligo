'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';
import Image from 'next/image';

interface Review {
  _id: string;
  userId: {
    name: string;
  };
  productId: {
    _id: string;
    name: string;
    images: string[];
  };
  rating: number;
  comment: string;
  helpful: number;
  sellerResponse?: string;
  createdAt: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [response, setResponse] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(ratingFilter !== 'all' && { minRating: ratingFilter, maxRating: ratingFilter }),
      });

      const res = await fetch(`/api/seller/reviews?${params}`);
      
      if (!res.ok) {
        console.error(`API error: ${res.status} ${res.statusText}`);
        setReviews([]);
        setTotalPages(1);
        return;
      }

      const result = await res.json();

      if (result.success) {
        const data = result.data || {};
        setReviews(data.reviews || result.reviews || []);
        setTotalPages(data.pagination?.pages || result.pagination?.totalPages || 1);
      } else {
        setReviews([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitResponse = async (reviewId: string) => {
    if (!response.trim()) return;

    try {
      const res = await fetch(`/api/seller/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerResponse: response }),
      });

      if (res.ok) {
        setRespondingTo(null);
        setResponse('');
        fetchReviews();
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate rating distribution
  const ratingStats = {
    total: (reviews || []).length,
    average: (reviews || []).reduce((sum, r) => sum + r.rating, 0) / ((reviews || []).length || 1),
    distribution: [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: (reviews || []).filter((r) => r.rating === rating).length,
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="text-gray-600 mt-1">Manage and respond to customer feedback</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rating Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Summary</h2>
              
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {ratingStats.average.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {renderStars(Math.round(ratingStats.average))}
                </div>
                <p className="text-sm text-gray-600">{ratingStats.total} reviews</p>
              </div>

              <div className="space-y-3">
                {ratingStats.distribution.map(({ rating, count }) => {
                  const percentage = ratingStats.total > 0 ? (count / ratingStats.total) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-8">{rating}★</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Filter */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Rating
                </label>
                <select
                  value={ratingFilter}
                  onChange={(e) => {
                    setRatingFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (reviews || []).length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-600">
                  Reviews will appear here once customers rate your products
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {(reviews || []).map((review) => (
                    <div key={review._id} className="bg-white rounded-lg shadow-sm p-6">
                      {/* Product Info */}
                      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                        {review.productId.images?.[0] && (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={review.productId.images[0]}
                              alt={review.productId.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{review.productId.name}</h3>
                          <p className="text-sm text-gray-600">
                            by {review.userId.name} • {formatDate(review.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Review Content */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(review.rating)}
                          <span className="text-sm font-semibold text-gray-700">
                            {review.rating}.0
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                        
                        {review.helpful > 0 && (
                          <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                            <ThumbsUp className="w-4 h-4" />
                            {review.helpful} found this helpful
                          </div>
                        )}
                      </div>

                      {/* Seller Response */}
                      {review.sellerResponse ? (
                        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                          <p className="text-sm font-semibold text-gray-900 mb-1">Your Response:</p>
                          <p className="text-sm text-gray-700">{review.sellerResponse}</p>
                        </div>
                      ) : respondingTo === review._id ? (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Write your response..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => submitResponse(review._id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Submit Response
                            </button>
                            <button
                              onClick={() => {
                                setRespondingTo(null);
                                setResponse('');
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRespondingTo(review._id)}
                          className="text-green-600 hover:text-green-700 font-semibold text-sm flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Respond to review
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
