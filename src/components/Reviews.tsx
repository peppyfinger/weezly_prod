import { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, User, Lock, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getReviews, createReview } from '../api';

interface ApiReview {
  id: string;
  product_id: number;
  user_id?: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewsProps {
  productId: number;
  currentRating: number;
  reviewCount: number;
}

export default function Reviews({ productId, currentRating, reviewCount }: ReviewsProps) {
  const { state, t, addReview } = useApp();
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isDark = state.theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200';
  const inputBg = isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400';

  // Fetch reviews from database
  useEffect(() => {
    const fetchProductReviews = async () => {
      setLoading(true);
      const result = await getReviews(productId);
      if (result.success && result.reviews) {
        setReviews(result.reviews);
      }
      setLoading(false);
    };
    fetchProductReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.user) return;

    setSubmitting(true);
    await addReview(productId, rating, comment);
    setSubmitting(false);
    setSubmitted(true);
    setComment('');
    setRating(5);

    // Refresh reviews
    const result = await getReviews(productId);
    if (result.success && result.reviews) {
      setReviews(result.reviews);
    }

    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
    }, 2000);
  };

  const renderStars = (value: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(i)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              size={interactive ? 20 : 14}
              className={i <= value ? 'text-amber-400 fill-amber-400' : isDark ? 'text-slate-600' : 'text-slate-300'}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader size={24} className="animate-spin text-cyan-500" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-cyan-500" />
              <h3 className={`font-semibold ${textColor}`}>{t('reviewsTitle')}</h3>
              <span className={`text-sm ${subText}`}>({reviewCount})</span>
            </div>

            {state.user && !showForm && !submitted && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 hover:bg-cyan-500/20 transition-all duration-200"
              >
                <Send size={12} />
                {t('addReview')}
              </button>
            )}
          </div>

          {/* Average rating display */}
          <div className={`flex items-center gap-3 p-3 rounded-xl ${cardBg}`}>
            <div className="text-3xl font-bold text-amber-400">{currentRating.toFixed(1)}</div>
            <div>
              {renderStars(Math.round(currentRating))}
              <p className={`text-xs ${subText} mt-1`}>{reviewCount} {state.language === 'en' ? 'reviews' : state.language === 'be' ? 'водгукаў' : 'отзывов'}</p>
            </div>
          </div>

          {/* Review form */}
          {showForm && state.user && !submitted && (
            <form onSubmit={handleSubmit} className={`p-4 rounded-xl border space-y-3 ${cardBg}`}>
              <div>
                <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('yourRating')}</label>
                {renderStars(rating, true)}
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('yourComment')}</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${inputBg}`}
                  required
                  minLength={10}
                  placeholder={state.language === 'ru' ? 'Минимум 10 символов...' : state.language === 'be' ? 'Мінімум 10 сімвалаў...' : 'Minimum 10 characters...'}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'} transition-all duration-200`}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting || comment.length < 10}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? <Loader size={12} className="animate-spin" /> : t('submitReview')}
                </button>
              </div>
            </form>
          )}

          {submitted && (
            <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'}`}>
              {t('reviewSuccess')}
            </div>
          )}

          {/* Login prompt */}
          {!state.user && (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
              <Lock size={14} className="text-amber-500" />
              <span className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{t('reviewAuthRequired')}</span>
            </div>
          )}

          {/* Reviews list */}
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className={`p-3 rounded-xl ${cardBg}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <User size={12} className="text-white" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${textColor}`}>{review.author_name}</p>
                        <p className={`text-xs ${subText}`}>{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <p className={`text-sm ${subText} mt-2`}>{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${subText}`}>
              <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('noReviewsYet')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export type { ApiReview as Review };
