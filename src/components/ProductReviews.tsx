'use client';

import { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import EmptyState from '@/components/ui/EmptyState';
import ReviewSummary from '@/components/ReviewSummary';

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  productId: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
}

interface ReviewsData {
  reviews: Review[];
  avgRating: string;
  totalReviews: number;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?productId=${productId}`);
      if (response.ok) {
        const data = await response.json();
        setReviewsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

    const handleSubmitReview = async () => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/products/' + productId);
      return;
    }

    if (!newReview.comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    try {
      const response = await fetch(`/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating: newReview.rating,
          comment: newReview.comment
        })
      });

      if (response.ok) {
        setNewReview({ rating: 5, comment: '' });
        setShowReviewForm(false);
        fetchReviews();
        toast.success('Review submitted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
      {/* AI Review Summary - Shows when 5+ reviews exist */}
      {reviewsData && reviewsData.totalReviews >= 5 && (
        <ReviewSummary 
          productId={productId} 
          totalReviews={reviewsData.totalReviews} 
        />
      )}

      {/* Reviews Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer Reviews</h2>
          {reviewsData && reviewsData.totalReviews > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star size={20} fill="#facc15" className="text-yellow-400" />
                <span className="text-xl font-bold">{reviewsData.avgRating}</span>
              </div>
              <span className="text-gray-600">
                Based on {reviewsData.totalReviews} review{reviewsData.totalReviews !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (!session) {
              router.push('/auth/signin?callbackUrl=' + window.location.pathname);
              return;
            }
            setShowReviewForm(!showReviewForm);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Write a Review
        </button>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="border-2 border-green-200 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="focus:outline-none"
                >
                  <Star
                    size={32}
                    fill={star <= newReview.rating ? '#facc15' : 'none'}
                    className={star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Your Review</label>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-green-600"
              rows={4}
              placeholder="Share your experience with this product..."
              required
            />
          </div>

                    <div className="flex gap-3">
            <button
              onClick={handleSubmitReview}
              type="button"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviewsData && reviewsData.reviews.length > 0 ? (
          reviewsData.reviews.map((review) => (
            <div key={review._id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-start gap-3">
                <div className="bg-gray-200 p-3 rounded-full">
                  <User size={24} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">{review.userId?.name || 'Anonymous'}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            fill={star <= review.rating ? '#facc15' : 'none'}
                            className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState 
            variant="reviews"
            iconSize="md"
            ctaText={session ? 'Write a Review' : 'Sign in to Review'}
            onCtaClick={() => {
              if (session) {
                setShowReviewForm(true);
              } else {
                router.push('/auth/signin?callbackUrl=/products/' + productId);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
