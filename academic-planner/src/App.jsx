import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import SmartScheduleWrapper from './components/SmartScheduleWrapper';
import { UserProvider } from './UserContext.jsx';

function App() {
  return (
    <Provider store={store}>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/smart-schedule" element={<SmartScheduleWrapper />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Router>
      </UserProvider>
    </Provider>
  );
}

export default App;
