import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext.jsx';

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginBottom: '15px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '14px',
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#1ab2ff',
  color: '#fff',
  fontSize: '16px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const LoginPage = () => {
  const { setUser } = useContext(UserContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user?._id || data.userId);
        console.log('Login successful with token:', data.token);
        console.log('User ID:', data.user?._id || data.userId);
        setMessage('Login successful!');
        setUser(data.user || data); // Save user info to context
        setTimeout(() => {
          navigate('/dashboard'); // Change this route as needed
        }, 1000);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div style={{
      fontFamily: 'Segoe UI, sans-serif',
      backgroundColor: '#f9f9f9',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        display: 'flex',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 5px 30px rgba(0,0,0,0.1)',
      }}>
        {/* Left Side - Login Form */}
        <div style={{
          flex: 1,
          background: '#fff',
          padding: '50px 30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 600 }}>
            LOG IN
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '30px', color: '#555' }}>
            Welcome back! Please log in
          </p>

          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          {message && <p style={{ color: 'green', textAlign: 'center' }}>{message}</p>}

          <form onSubmit={handleLogin} style={{ maxWidth: '350px', margin: '0 auto' }}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              style={inputStyle}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              style={inputStyle}
            />
            <button type="submit" style={buttonStyle}>
              LOG IN
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            Don’t have an account?{' '}
            <a href="/signup" style={{ color: '#007bff', textDecoration: 'none' }}>
              Sign Up
            </a>
          </p>
        </div>

        {/* Right Side - Info Panel */}
        <div style={{
          flex: 1,
          background: '#1ab2ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#fff',
          padding: '30px',
        }}>
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '280px',
            color: '#333',
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
          }}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
              alt="icon"
              style={{ width: '40px', marginBottom: '10px' }}
            />
            <h3>Welcome Back!</h3>
            <p>Log in to continue exploring our awesome platform!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
