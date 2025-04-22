import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  generateAnalyticsThunk,
  getAnalyticsThunk,
  getAnalyticsHistoryThunk,
  updateAnalyticsThunk,
  clearSuccessMessage,
  clearError
} from '../store/slices/analyticsSlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { BarChart2, PieChart as PieChartIcon, RefreshCw, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF'];

const Analytics = () => {
  const dispatch = useDispatch();
  const { 
    currentAnalytics, 
    history, 
    loading, 
    generating, 
    error, 
    successMessage 
  } = useSelector(state => state.analytics);
  
  const [selectedWeek, setSelectedWeek] = useState(null);
  
  useEffect(() => {
    // First update analytics data
    dispatch(updateAnalyticsThunk())
      .then(() => {
        // Then get current week's analytics
        dispatch(getAnalyticsThunk());
        // Get analytics history
        dispatch(getAnalyticsHistoryThunk());
      })
      .catch(error => {
        console.error("Error updating analytics:", error);
        // Even if update fails, try to fetch the latest analytics
        dispatch(getAnalyticsThunk());
        dispatch(getAnalyticsHistoryThunk());
      });
    
    // Debug: Log analytics data on every update
    if (window && window.localStorage) {
      console.log('Analytics Debug:', {
        currentAnalytics,
        history,
        loading,
        generating,
        error,
        successMessage
      });
    }
  }, [dispatch]);

  // Separate effect for clearing messages
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        if (successMessage) dispatch(clearSuccessMessage());
        if (error) dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);
  
  const handleGenerateAnalytics = () => {
    // First update analytics data
    dispatch(updateAnalyticsThunk())
      .then(() => {
        // Then generate analytics
        dispatch(generateAnalyticsThunk());
      })
      .catch(error => {
        console.error("Error updating analytics:", error);
        // Even if update fails, try to generate analytics
        dispatch(generateAnalyticsThunk());
      });
  };
  
  const handleWeekChange = (e) => {
    const weekDate = e.target.value;
    setSelectedWeek(weekDate);
    
    // First update analytics data
    dispatch(updateAnalyticsThunk())
      .then(() => {
        // Then fetch analytics for the selected week
        if (weekDate) {
          dispatch(getAnalyticsThunk(weekDate));
        } else {
          dispatch(getAnalyticsThunk());
        }
      })
      .catch(error => {
        console.error("Error updating analytics:", error);
        // Even if update fails, try to fetch analytics for the selected week
        if (weekDate) {
          dispatch(getAnalyticsThunk(weekDate));
        } else {
          dispatch(getAnalyticsThunk());
        }
      });
  };
  
  const formatWeekRange = (startDate, endDate) => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } catch (error) {
      return 'Invalid date range';
    }
  };
  
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
  
  // Prepare data for charts
  const prepareSubjectData = () => {
    // Fallback: If subjectBreakdown is missing, use slot stats for a minimal chart
    if (!currentAnalytics) return [];
    if (currentAnalytics.subjectBreakdown && Array.isArray(currentAnalytics.subjectBreakdown)) {
      return currentAnalytics.subjectBreakdown.map(subject => ({
        name: subject.subject || subject.name || 'Unknown',
        hours: parseFloat(subject.hours?.toFixed(1) || 0),
        tasks: subject.taskCount || 0,
        completed: subject.completedTaskCount || 0
      }));
    }
    // If no breakdown, show total/confirmed/completed as a fallback bar chart
    return [
      { name: 'Total', hours: currentAnalytics.totalSlots || 0, tasks: currentAnalytics.totalSlots || 0, completed: currentAnalytics.completedSlots || 0 },
      { name: 'Confirmed', hours: currentAnalytics.confirmedSlots || 0, tasks: currentAnalytics.confirmedSlots || 0, completed: currentAnalytics.confirmedSlots || 0 },
      { name: 'Completed', hours: currentAnalytics.completedSlots || 0, tasks: currentAnalytics.completedSlots || 0, completed: currentAnalytics.completedSlots || 0 }
    ];
  };

  const prepareCompletionData = () => {
    if (!currentAnalytics) return [];
    // Try to use taskCompletionRate, else fallback to slot completion
    let completedPercentage = 0;
    if (typeof currentAnalytics.taskCompletionRate === 'number') {
      completedPercentage = currentAnalytics.taskCompletionRate;
    } else if (currentAnalytics.totalSlots > 0) {
      completedPercentage = Math.round((currentAnalytics.completedSlots / currentAnalytics.totalSlots) * 100);
    }
    const remainingPercentage = 100 - completedPercentage;
    return [
      { name: 'Completed', value: completedPercentage },
      { name: 'Remaining', value: remainingPercentage }
    ];
  };
  
  const subjectData = prepareSubjectData();
  const completionData = prepareCompletionData();
  
  return (
    <div style={{ background: 'linear-gradient(120deg,#f6fafd 0%,#e3f0ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px 0 rgba(31,38,135,0.09)', padding: 32, marginBottom: 28, border: '1px solid #e3edfa' }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1565d8', marginBottom: 24, letterSpacing: 0.2 }}>Analytics Dashboard</h2>
      
      {/* Controls */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px 0 rgba(31,38,135,0.05)', padding: 20, marginBottom: 32 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="week" style={{ fontSize: 15, color: '#1565d8', fontWeight: 600, marginRight: 4 }}>Week:</label>
            <select
              id="week"
              value={selectedWeek || ''}
              onChange={handleWeekChange}
              style={{ background: '#f4f8fd', border: '1.5px solid #b3d7fa', color: '#1565d8', fontWeight: 600, borderRadius: 8, padding: '6px 10px', fontSize: 15, outline: 'none' }}
              disabled={loading || generating}
            >
              <option value="">Current Week</option>
              {history.map((item) => (
                <option key={item._id} value={item.weekStartDate}>
                  {formatWeekRange(item.weekStartDate, item.weekEndDate)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerateAnalytics}
            disabled={generating}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: generating ? '#b3d7fa' : 'linear-gradient(90deg,#43b2fc,#1565d8)',
              color: '#fff', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 15, cursor: generating ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px #e6f6ff', transition: 'background 0.18s',
              opacity: generating ? 0.7 : 1
            }}
          >
            <RefreshCw size={18} style={{ marginRight: 4, animation: generating ? 'spin 1s linear infinite' : undefined }} />
            {generating ? 'Generating...' : 'Generate Analytics'}
          </button>
        </div>
      </div>
      
      {/* Messages */}
      {successMessage && (
        <div style={{ background: '#e7f9ed', borderLeft: '4px solid #34c759', padding: 16, marginBottom: 18, borderRadius: 8, display: 'flex', alignItems: 'center', color: '#34c759', fontWeight: 600 }}>
          <CheckCircle style={{ marginRight: 8 }} size={20} />
          {successMessage}
        </div>
      )}
      
      {error && (
        <div style={{ background: '#ffeaea', borderLeft: '4px solid #e53935', padding: 16, marginBottom: 18, borderRadius: 8, display: 'flex', alignItems: 'center', color: '#e53935', fontWeight: 600 }}>
          <AlertCircle style={{ marginRight: 8 }} size={20} />
          {error}
        </div>
      )}
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220 }}>
          <div style={{ border: '3px solid #e3edfa', borderTop: '3px solid #1976d2', borderRadius: '50%', width: 48, height: 48, animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : !currentAnalytics ? (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px 0 rgba(31,38,135,0.05)', padding: 48, textAlign: 'center' }}>
          <BarChart2 style={{ margin: '0 auto 18px', color: '#b3d7fa' }} size={48} />
          <div style={{ fontWeight: 700, fontSize: 22, color: '#1565d8', marginBottom: 8 }}>No Analytics Available</div>
          <div style={{ color: '#888', fontSize: 16, marginBottom: 24 }}>Generate analytics to see insights about your study habits.</div>
          <button
            onClick={handleGenerateAnalytics}
            style={{ background: 'linear-gradient(90deg,#43b2fc,#1565d8)', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px #e6f6ff', transition: 'background 0.18s' }}
          >
            Generate Analytics
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32, marginTop: 8, marginBottom: 8 }}>
          {/* Summary Card */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px 0 rgba(31,38,135,0.05)', padding: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1976d2', marginBottom: 18, display: 'flex', alignItems: 'center' }}>
              <TrendingUp style={{ marginRight: 8, color: '#43b2fc' }} size={22} />
              Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
              <div style={{ background: 'linear-gradient(90deg,#e3f0ff,#f6fafd)', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 15, color: '#1976d2', fontWeight: 600 }}>Task Completion Rate</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#1565d8', marginTop: 2 }}>{currentAnalytics.taskCompletionRate?.toFixed(1)}%</div>
              </div>
              <div style={{ background: 'linear-gradient(90deg,#e7f9ed,#f6fafd)', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 15, color: '#22c55e', fontWeight: 600 }}>Total Study Hours</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#16a34a', marginTop: 2 }}>{currentAnalytics.totalStudyHours?.toFixed(1)}</div>
              </div>
              <div style={{ background: 'linear-gradient(90deg,#fdf6e3,#f6fafd)', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 15, color: '#eab308', fontWeight: 600 }}>Week</div>
                <div style={{ fontSize: 18, color: '#333', fontWeight: 700, marginTop: 2 }}>{formatWeekRange(currentAnalytics.weekStartDate, currentAnalytics.weekEndDate)}</div>
              </div>
            </div>
          </div>
          {/* Completion Rate Chart */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px 0 rgba(31,38,135,0.05)', padding: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#16a34a', marginBottom: 18, display: 'flex', alignItems: 'center' }}>
              <PieChartIcon style={{ marginRight: 8, color: '#4ade80' }} size={22} />
              Task Completion
            </h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#4ade80' : '#d1d5db'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Subject Breakdown Chart */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px 0 rgba(31,38,135,0.05)', padding: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1976d2', marginBottom: 18, display: 'flex', alignItems: 'center' }}>
              <BarChart2 style={{ marginRight: 8, color: '#43b2fc' }} size={22} />
              Subject Breakdown
            </h3>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="hours" name="Hours" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="completed" name="Completed Tasks" fill="#82ca9d" stackId="a" />
                  <Bar yAxisId="right" dataKey="tasks" name="Total Tasks" fill="#ffc658" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
