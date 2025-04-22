import React from 'react';
import Dashboard from './Dashboard';

const SmartScheduleWrapper = () => {
  // Pass initialSection as Dashboard to ensure Smart Schedule is visible
  return <Dashboard initialSection="Dashboard" />;
};

export default SmartScheduleWrapper;
