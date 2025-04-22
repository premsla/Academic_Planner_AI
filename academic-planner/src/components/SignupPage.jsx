import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Client‑side password match check
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,  // ← include this
        }),
      });

      const data = await response.json();
      console.log('Signup response:', data);
      if (response.ok) {
        setMessage('Signup successful!');
        setTimeout(() => {
          navigate('/login'); // 👈 Redirect after 1 second
        }, 1000);
      }
      
       else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
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
        {/* Left Side - Signup Form */}
        <div style={{
          flex: 1,
          background: '#fff',
          padding: '50px 30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 600 }}>
            SIGN UP
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '30px', color: '#555' }}>
            Create your account below
          </p>

          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          {message && <p style={{ color: 'green', textAlign: 'center' }}>{message}</p>}

          <form onSubmit={handleSignup} style={{ maxWidth: '350px', margin: '0 auto' }}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              style={inputStyle}
            />
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
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={inputStyle}
            />
            <button type="submit" style={buttonStyle}>
              SIGN UP
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            Already a member?{' '}
            <a href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
              Log In
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
              src="https://www.academic.solutions/wp-content/uploads/2021/04/cropped-Smart-Academic-Solution-logo-1.png"
              alt="icon"
              style={{ width: '40px', marginBottom: '10px' }}
            />
            <h3>Welcome!</h3>
            <p></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
