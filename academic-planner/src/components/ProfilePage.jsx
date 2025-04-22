import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../UserContext';
import { useNavigate } from 'react-router-dom';
import { getAnalytics } from '../services/api/analyticsApi';
import { CalendarDays, CheckCircle, Clock, Trophy, Award, BookOpen } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Redirect if user is not logged in
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch analytics data
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await getAnalytics();
        setAnalytics(data);
        
        // Update login streak
        const lastLogin = localStorage.getItem('lastLogin');
        const today = new Date().toISOString().split('T')[0];
        
        if (lastLogin) {
          // Calculate streak based on consecutive daily logins
          const lastLoginDate = new Date(lastLogin);
          const currentDate = new Date();
          
          // Check if last login was yesterday or today
          const timeDiff = Math.floor((currentDate - lastLoginDate) / (1000 * 60 * 60 * 24));
          
          // Get current streak from localStorage
          const currentStreak = parseInt(localStorage.getItem('loginStreak') || '0');
          
          if (timeDiff === 0 && lastLogin !== today) {
            // First login today
            localStorage.setItem('loginStreak', (currentStreak + 1).toString());
            setStreak(currentStreak + 1);
          } else if (timeDiff === 1) {
            // Consecutive day login
            localStorage.setItem('loginStreak', (currentStreak + 1).toString());
            setStreak(currentStreak + 1);
          } else if (timeDiff > 1) {
            // Streak broken
            localStorage.setItem('loginStreak', '1');
            setStreak(1);
          } else {
            // Same day login, maintain streak
            setStreak(currentStreak);
          }
        } else {
          // First time login
          localStorage.setItem('loginStreak', '1');
          setStreak(1);
        }
        
        // Update last login date
        localStorage.setItem('lastLogin', today);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f6f8fa',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 800,
        padding: 40,
        borderRadius: 18,
        background: '#fff',
        boxShadow: '0 5px 30px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 26, color: '#1565d8', marginBottom: 24 }}>My Profile</h2>
        
        {/* User Info Section */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #43b2fc, #1565d8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 32,
            fontWeight: 'bold'
          }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 22 }}>{user.name || 'Student'}</div>
            <div style={{ color: '#888', fontSize: 16 }}>{user.email}</div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginTop: 8,
              color: '#1976d2',
              fontSize: 14
            }}>
              <CalendarDays size={16} style={{ marginRight: 6 }} />
              Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div style={{ 
          background: 'linear-gradient(120deg,#f6fafd 0%,#e3f0ff 100%)', 
          borderRadius: 16, 
          padding: 24, 
          marginBottom: 32 
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#1565d8' }}>
            <Trophy size={18} style={{ marginRight: 8, display: 'inline' }} />
            Your Academic Progress
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {/* Tasks Completed */}
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                fontSize: 36, 
                fontWeight: 700, 
                color: '#1565d8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}>
                <CheckCircle size={24} />
                {loading ? '...' : (analytics?.completedTasks || 0)}
              </div>
              <div style={{ color: '#555', fontSize: 14, marginTop: 8, fontWeight: 500 }}>
                TASKS COMPLETED
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                out of {loading ? '...' : (analytics?.totalTasks || 0)} total tasks
              </div>
            </div>
            
            {/* Study Hours */}
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                fontSize: 36, 
                fontWeight: 700, 
                color: '#1565d8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}>
                <Clock size={24} />
                {loading ? '...' : (analytics?.totalHours || 0)}
              </div>
              <div style={{ color: '#555', fontSize: 14, marginTop: 8, fontWeight: 500 }}>
                STUDY HOURS
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                this week
              </div>
            </div>
            
            {/* Login Streak */}
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                fontSize: 36, 
                fontWeight: 700, 
                color: '#1565d8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}>
                <Award size={24} />
                {streak}
              </div>
              <div style={{ color: '#555', fontSize: 14, marginTop: 8, fontWeight: 500 }}>
                DAY STREAK
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                {streak > 1 ? 'Keep it up!' : 'Just getting started!'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Subject Analysis */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#1565d8' }}>
            <BookOpen size={18} style={{ marginRight: 8, display: 'inline' }} />
            Subject Analysis
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {/* Most Practiced Subject */}
            <div style={{ 
              background: '#f6f8fa', 
              borderRadius: 12, 
              padding: 20 
            }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12, color: '#333' }}>
                Most practiced subject
              </div>
              {loading ? (
                <div>Loading...</div>
              ) : analytics?.subjectBreakdown && analytics.subjectBreakdown.length > 0 ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1565d8', marginBottom: 8 }}>
                    {analytics.subjectBreakdown[0].subject}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 14, color: '#666' }}>
                        {analytics.subjectBreakdown[0].totalHours || 0} hours studied
                      </div>
                      <div style={{ fontSize: 14, color: '#666' }}>
                        {analytics.subjectBreakdown[0].completedTaskCount || 0} tasks completed
                      </div>
                    </div>
                    <div style={{ 
                      width: 50, 
                      height: 50, 
                      borderRadius: '50%', 
                      background: '#e3f0ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      fontWeight: 'bold',
                      color: '#1565d8'
                    }}>
                      {Math.round((analytics.subjectBreakdown[0].completedTaskCount / 
                        (analytics.subjectBreakdown[0].taskCount || 1)) * 100)}%
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ color: '#888', fontSize: 15 }}>No data available</div>
              )}
            </div>
            
            {/* Needs Improvement */}
            <div style={{ 
              background: '#f6f8fa', 
              borderRadius: 12, 
              padding: 20 
            }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12, color: '#333' }}>
                Needs improvement
              </div>
              {loading ? (
                <div>Loading...</div>
              ) : analytics?.subjectBreakdown && analytics.subjectBreakdown.length > 1 ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#e53935', marginBottom: 8 }}>
                    {analytics.subjectBreakdown[analytics.subjectBreakdown.length - 1].subject}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 14, color: '#666' }}>
                        {analytics.subjectBreakdown[analytics.subjectBreakdown.length - 1].totalHours || 0} hours studied
                      </div>
                      <div style={{ fontSize: 14, color: '#666' }}>
                        {analytics.subjectBreakdown[analytics.subjectBreakdown.length - 1].completedTaskCount || 0} tasks completed
                      </div>
                    </div>
                    <div style={{ 
                      width: 50, 
                      height: 50, 
                      borderRadius: '50%', 
                      background: '#ffebee',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      fontWeight: 'bold',
                      color: '#e53935'
                    }}>
                      {Math.round((analytics.subjectBreakdown[analytics.subjectBreakdown.length - 1].completedTaskCount / 
                        (analytics.subjectBreakdown[analytics.subjectBreakdown.length - 1].taskCount || 1)) * 100)}%
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ color: '#888', fontSize: 15 }}>No data available</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Back to Dashboard Button */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'linear-gradient(90deg,#43b2fc,#1565d8)',
              color: '#fff',
              fontWeight: 600,
              border: 'none',
              borderRadius: 8,
              padding: '12px 32px',
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #e6f6ff'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
