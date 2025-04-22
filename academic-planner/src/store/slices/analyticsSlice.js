import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  generateAnalytics, 
  getAnalytics, 
  getAnalyticsHistory,
  updateAnalyticsAfterConfirmation
} from '../../services/api/analyticsApi';

// Async thunks
export const generateAnalyticsThunk = createAsyncThunk(
  'analytics/generate',
  async (_, { rejectWithValue }) => {
    try {
      const response = await generateAnalytics();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to generate analytics');
    }
  }
);

export const getAnalyticsThunk = createAsyncThunk(
  'analytics/get',
  async (week, { rejectWithValue }) => {
    try {
      const response = await getAnalytics(week);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch analytics');
    }
  }
);

export const getAnalyticsHistoryThunk = createAsyncThunk(
  'analytics/getHistory',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await getAnalyticsHistory(limit);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch analytics history');
    }
  }
);

export const updateAnalyticsThunk = createAsyncThunk(
  'analytics/update',
  async (_, { rejectWithValue }) => {
    try {
      const response = await updateAnalyticsAfterConfirmation();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update analytics');
    }
  }
);

// Initial state
const initialState = {
  currentAnalytics: null,
  history: [],
  loading: false,
  generating: false,
  error: null,
  successMessage: null
};

// Slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Generate analytics
      .addCase(generateAnalyticsThunk.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(generateAnalyticsThunk.fulfilled, (state, action) => {
        state.generating = false;
        state.currentAnalytics = action.payload.analytics || action.payload;
        state.successMessage = 'Analytics generated successfully';
      })
      .addCase(generateAnalyticsThunk.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload;
      })
      
      // Get analytics
      .addCase(getAnalyticsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAnalyticsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAnalytics = action.payload.analytics || action.payload;
      })
      .addCase(getAnalyticsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update analytics
      .addCase(updateAnalyticsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAnalyticsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAnalytics = action.payload.analytics || action.payload;
      })
      .addCase(updateAnalyticsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get analytics history
      .addCase(getAnalyticsHistoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAnalyticsHistoryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(getAnalyticsHistoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearSuccessMessage } = analyticsSlice.actions;

export default analyticsSlice.reducer;
