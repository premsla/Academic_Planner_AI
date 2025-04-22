import React from 'react';
import { Provider } from 'react-redux';
import store from '../store';
import SmartSchedule from './SmartSchedule';
import TipsCard from './TipsCard';

const DashboardAI = () => {
  return (
    <Provider store={store}>
      <div className="space-y-6">
        <SmartSchedule />
        <TipsCard />
      </div>
    </Provider>
  );
};

export default DashboardAI;
