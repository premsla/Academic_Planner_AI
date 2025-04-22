import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  generateTipsThunk,
  getPersonalizedTipsThunk,
  markTipHelpfulnessThunk,
  getDailyTipsThunk,
  clearSuccessMessage,
  clearError
} from '../store/slices/tipsSlice';
import { Lightbulb, ThumbsUp, ThumbsDown, AlertCircle, RefreshCw, CheckCircle, Calendar } from 'lucide-react';

const TipsCard = () => {
  const dispatch = useDispatch();
  const {
    tips,
    dailyTips,
    loading,
    generating,
    error,
    successMessage,
    source,
    lastDailyTipsFetch
  } = useSelector(state => state.tips);

  const [limit, setLimit] = useState(5);
  const [showDailyTips, setShowDailyTips] = useState(true);

  useEffect(() => {
    // Check if we need to fetch daily tips (if we haven't fetched today)
    const today = new Date().toISOString().split('T')[0];
    if (!lastDailyTipsFetch || lastDailyTipsFetch !== today) {
      dispatch(getDailyTipsThunk());
    }
    
    // Fetch regular tips as well
    dispatch(getPersonalizedTipsThunk(limit));

    // Clear messages after 5 seconds
    if (successMessage || error) {
      const timer = setTimeout(() => {
        if (successMessage) dispatch(clearSuccessMessage());
        if (error) dispatch(clearError());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [dispatch, limit, successMessage, error, lastDailyTipsFetch]);

  const handleGenerateTips = () => {
    dispatch(generateTipsThunk(limit));
  };

  const handleRefreshDailyTips = () => {
    dispatch(getDailyTipsThunk());
  };

  const handleMarkHelpful = (tipId, isHelpful) => {
    dispatch(markTipHelpfulnessThunk({ tipId, isHelpful }));
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'productivity':
        return 'bg-blue-100 text-blue-800';
      case 'study technique':
        return 'bg-purple-100 text-purple-800';
      case 'subject specific':
        return 'bg-green-100 text-green-800';
      case 'time management':
        return 'bg-yellow-100 text-yellow-800';
      case 'motivation':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date to display as "April 22, 2025"
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  };

  return (
    <div style={{ background: 'linear-gradient(120deg,#f6fafd 0%,#e3f0ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px 0 rgba(31,38,135,0.09)', padding: 32, marginBottom: 28, border: '1px solid #e3edfa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1565d8', display: 'flex', alignItems: 'center', margin: 0 }}>
          <Lightbulb style={{ marginRight: 10, color: '#facc15' }} size={26} />
          Tips & Insights
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowDailyTips(true)}
              style={{
                background: showDailyTips ? 'linear-gradient(90deg,#43b2fc,#1565d8)' : '#f4f8fd',
                color: showDailyTips ? '#fff' : '#1565d8',
                fontWeight: 600,
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 15,
                border: showDailyTips ? 'none' : '1.5px solid #b3d7fa',
                cursor: 'pointer'
              }}
            >
              <Calendar size={16} style={{ marginRight: 6, display: 'inline' }} />
              Daily Tips
            </button>
            <button
              onClick={() => setShowDailyTips(false)}
              style={{
                background: !showDailyTips ? 'linear-gradient(90deg,#43b2fc,#1565d8)' : '#f4f8fd',
                color: !showDailyTips ? '#fff' : '#1565d8',
                fontWeight: 600,
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 15,
                border: !showDailyTips ? 'none' : '1.5px solid #b3d7fa',
                cursor: 'pointer'
              }}
            >
              All Tips
            </button>
          </div>
          
          {!showDailyTips && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label htmlFor="limit" style={{ fontSize: 15, color: '#1565d8', fontWeight: 600, marginRight: 4 }}>Show:</label>
                <select
                  id="limit"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  style={{ background: '#f4f8fd', border: '1.5px solid #b3d7fa', color: '#1565d8', fontWeight: 600, borderRadius: 8, padding: '6px 10px', fontSize: 15, outline: 'none' }}
                  disabled={generating}
                >
                  <option value={3}>3 Tips</option>
                  <option value={5}>5 Tips</option>
                  <option value={10}>10 Tips</option>
                </select>
              </div>
              <button
                onClick={handleGenerateTips}
                disabled={generating}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: generating ? '#b3d7fa' : 'linear-gradient(90deg,#43b2fc,#1565d8)',
                  color: '#fff', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 15, cursor: generating ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px #e6f6ff', transition: 'background 0.18s',
                  opacity: generating ? 0.7 : 1
                }}
              >
                <RefreshCw size={18} style={{ marginRight: 4, animation: generating ? 'spin 1s linear infinite' : undefined }} />
                {generating ? 'Generating...' : 'Generate New Tips'}
              </button>
            </>
          )}
          
          {showDailyTips && (
            <button
              onClick={handleRefreshDailyTips}
              disabled={loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: loading ? '#b3d7fa' : 'linear-gradient(90deg,#43b2fc,#1565d8)',
                color: '#fff', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px #e6f6ff', transition: 'background 0.18s',
                opacity: loading ? 0.7 : 1
              }}
            >
              <RefreshCw size={18} style={{ marginRight: 4, animation: loading ? 'spin 1s linear infinite' : undefined }} />
              {loading ? 'Refreshing...' : 'Refresh Daily Tips'}
            </button>
          )}
        </div>
      </div>

      {/* Display success or error messages */}
      {successMessage && (
        <div style={{ marginBottom: 14, fontSize: 14, color: '#2e7d32', background: '#e8f5e9', padding: '7px 15px', borderRadius: 7, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <CheckCircle size={16} style={{ marginRight: 8 }} />
          {successMessage}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 14, fontSize: 14, color: '#d32f2f', background: '#ffebee', padding: '7px 15px', borderRadius: 7, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <AlertCircle size={16} style={{ marginRight: 8 }} />
          {error}
        </div>
      )}

      {/* Daily Tips Section */}
      {showDailyTips && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, marginTop: 8 }}>
            <Calendar size={18} style={{ marginRight: 8, color: '#1976d2' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1976d2', margin: 0 }}>
              Today's Tips ({formatDate()})
            </h3>
          </div>
          
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40, color: '#1976d2' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} />
              <span style={{ fontWeight: 600 }}>Loading daily tips...</span>
            </div>
          )}
          
          {!loading && (!dailyTips || dailyTips.length === 0) ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', color: '#888' }}>
              <Lightbulb style={{ marginBottom: 10, color: '#b3d7fa' }} size={32} />
              <div style={{ fontWeight: 600, fontSize: 18 }}>No daily tips available.</div>
              <div style={{ fontSize: 15, color: '#aaa', marginTop: 6 }}>Click 'Refresh Daily Tips' to generate personalized tips for today.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {dailyTips.map((tip) => (
                <div
                  key={tip._id}
                  style={{ border: '1.5px solid #e3edfa', borderRadius: 13, padding: '20px 24px', background: '#fff', boxShadow: '0 2px 10px 0 rgba(31,38,135,0.05)', transition: 'box-shadow 0.18s', position: 'relative', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 20, color: '#1565d8', marginBottom: 2 }}>{tip.title}</div>
                      <div style={{ marginTop: 2 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 6, fontWeight: 600, fontSize: 13, color: '#fff', background: 'linear-gradient(90deg,#43b2fc,#1565d8)', letterSpacing: 0.5 }}>{tip.category}</span>
                        {tip.source && (
                          <span style={{ marginLeft: 8, fontSize: 13, color: '#888', fontWeight: 500 }}>Source: {tip.source}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 16, color: '#333', lineHeight: 1.7 }}>{tip.content}</div>

                  {/* Tags */}
                  {tip.tags && tip.tags.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {tip.tags.map((tag, index) => (
                        <span
                          key={index}
                          style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 5, fontWeight: 600, fontSize: 12, background: '#e3edfa', color: '#1976d2', marginRight: 4, marginBottom: 2 }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Feedback buttons */}
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      onClick={() => handleMarkHelpful(tip._id, true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: tip.userFeedback === true ? 'linear-gradient(90deg,#43e97b,#38f9d7)' : '#f4f8fd',
                        color: tip.userFeedback === true ? '#1565d8' : '#1976d2',
                        border: tip.userFeedback === true ? '2px solid #43e97b' : '1.5px solid #b3d7fa',
                        fontWeight: 700, borderRadius: 7, padding: '7px 18px', fontSize: 15, cursor: 'pointer', transition: 'background 0.18s',
                        boxShadow: tip.userFeedback === true ? '0 2px 8px #e6f6ff' : 'none',
                      }}
                    >
                      <ThumbsUp size={16} style={{ marginRight: 2 }} /> Helpful
                    </button>
                    <button
                      onClick={() => handleMarkHelpful(tip._id, false)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: tip.userFeedback === false ? 'linear-gradient(90deg,#ff5858,#f09819)' : '#f4f8fd',
                        color: tip.userFeedback === false ? '#e53935' : '#1976d2',
                        border: tip.userFeedback === false ? '2px solid #ff5858' : '1.5px solid #b3d7fa',
                        fontWeight: 700, borderRadius: 7, padding: '7px 18px', fontSize: 15, cursor: 'pointer', transition: 'background 0.18s',
                        boxShadow: tip.userFeedback === false ? '0 2px 8px #ffeaea' : 'none',
                      }}
                    >
                      <ThumbsDown size={16} style={{ marginRight: 2 }} /> Not Helpful
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Regular Tips Section */}
      {!showDailyTips && (
        <>
          {source && (
            <div style={{ marginBottom: 14, fontSize: 14, color: '#1976d2', background: '#e3edfa', padding: '7px 15px', borderRadius: 7, fontWeight: 600 }}>
              Tips source: {source}
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40, color: '#1976d2' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} />
              <span style={{ fontWeight: 600 }}>Loading tips...</span>
            </div>
          )}

          {!loading && (!tips || tips.length === 0) ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', color: '#888' }}>
              <Lightbulb style={{ marginBottom: 10, color: '#b3d7fa' }} size={32} />
              <div style={{ fontWeight: 600, fontSize: 18 }}>No tips available at the moment.</div>
              <div style={{ fontSize: 15, color: '#aaa', marginTop: 6 }}>Check back later for personalized study tips.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {tips.map((tip) => (
                <div
                  key={tip._id}
                  style={{ border: '1.5px solid #e3edfa', borderRadius: 13, padding: '20px 24px', background: '#fff', boxShadow: '0 2px 10px 0 rgba(31,38,135,0.05)', transition: 'box-shadow 0.18s', position: 'relative', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 20, color: '#1565d8', marginBottom: 2 }}>{tip.title}</div>
                      <div style={{ marginTop: 2 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 6, fontWeight: 600, fontSize: 13, color: '#fff', background: 'linear-gradient(90deg,#43b2fc,#1565d8)', letterSpacing: 0.5 }}>{tip.category}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 16, color: '#333', lineHeight: 1.7 }}>{tip.content}</div>

                  {/* Tags */}
                  {tip.tags && tip.tags.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {tip.tags.map((tag, index) => (
                        <span
                          key={index}
                          style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 5, fontWeight: 600, fontSize: 12, background: '#e3edfa', color: '#1976d2', marginRight: 4, marginBottom: 2 }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Feedback buttons */}
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      onClick={() => handleMarkHelpful(tip._id, true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: tip.userFeedback === true ? 'linear-gradient(90deg,#43e97b,#38f9d7)' : '#f4f8fd',
                        color: tip.userFeedback === true ? '#1565d8' : '#1976d2',
                        border: tip.userFeedback === true ? '2px solid #43e97b' : '1.5px solid #b3d7fa',
                        fontWeight: 700, borderRadius: 7, padding: '7px 18px', fontSize: 15, cursor: 'pointer', transition: 'background 0.18s',
                        boxShadow: tip.userFeedback === true ? '0 2px 8px #e6f6ff' : 'none',
                      }}
                    >
                      <ThumbsUp size={16} style={{ marginRight: 2 }} /> Helpful
                    </button>
                    <button
                      onClick={() => handleMarkHelpful(tip._id, false)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: tip.userFeedback === false ? 'linear-gradient(90deg,#ff5858,#f09819)' : '#f4f8fd',
                        color: tip.userFeedback === false ? '#e53935' : '#1976d2',
                        border: tip.userFeedback === false ? '2px solid #ff5858' : '1.5px solid #b3d7fa',
                        fontWeight: 700, borderRadius: 7, padding: '7px 18px', fontSize: 15, cursor: 'pointer', transition: 'background 0.18s',
                        boxShadow: tip.userFeedback === false ? '0 2px 8px #ffeaea' : 'none',
                      }}
                    >
                      <ThumbsDown size={16} style={{ marginRight: 2 }} /> Not Helpful
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TipsCard;
