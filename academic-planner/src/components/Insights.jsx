import React from 'react';
import { useSelector } from 'react-redux';
import { TrendingUp } from 'lucide-react';

const Insights = () => {
  const { currentAnalytics } = useSelector(state => state.analytics);

  const getInsightCategoryColor = (category) => {
    switch (category) {
      case 'achievement':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'improvement':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'suggestion':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'warning':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div style={{ background: 'linear-gradient(120deg,#f6fafd 0%,#e3f0ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px 0 rgba(31,38,135,0.09)', padding: 32, marginBottom: 28, border: '1px solid #e3edfa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#eab308', display: 'flex', alignItems: 'center', margin: 0 }}>
          <TrendingUp style={{ marginRight: 10, color: '#eab308' }} size={26} />
          Insights & Recommendations
        </h2>
      </div>
      
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px 0 rgba(31,38,135,0.05)', padding: 24 }}>
        {currentAnalytics && currentAnalytics.insights && currentAnalytics.insights.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {currentAnalytics.insights.map((insight, index) => (
              <div 
                key={index} 
                style={{ padding: 14, borderRadius: 10, border: '1.5px solid #e3edfa', background: '#f6fafd', fontWeight: 600, color: '#1976d2', fontSize: 15 }}
              >
                <div>{insight.text}</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 4, fontWeight: 500 }}>
                  {insight.category} {insight.source && `• ${insight.source}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#888', textAlign: 'center', padding: 18 }}>No insights available.</div>
        )}
      </div>
    </div>
  );
};

export default Insights;
