import { configureStore } from '@reduxjs/toolkit';
import smartScheduleReducer from './slices/smartScheduleSlice';
import tipsReducer from './slices/tipsSlice';
import preferenceReducer from './slices/preferenceSlice';
import analyticsReducer from './slices/analyticsSlice';

// Import other existing reducers here
// import userReducer from './slices/userSlice';
// import taskReducer from './slices/taskSlice';

const store = configureStore({
  reducer: {
    // Existing reducers
    // user: userReducer,
    // tasks: taskReducer,

    // New reducers
    smartSchedule: smartScheduleReducer,
    tips: tipsReducer,
    preferences: preferenceReducer,
    analytics: analyticsReducer
  }
});

export default store;
