import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext';

export default function DashboardLogout() {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        if (typeof window !== 'undefined') {
          localStorage.clear();
        }
        if (typeof setUser === 'function') setUser(null);
        navigate('/login');
      }}
      title="Logout"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 8,
        marginRight: 8,
        display: 'flex',
        alignItems: 'center',
        color: '#1565d8',
        fontWeight: 600,
        fontSize: 18
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
      </svg>
      <span style={{ marginLeft: 7 }}>Logout</span>
    </button>
  );
}
