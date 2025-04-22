import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  generateTips,
  fetchPersonalizedTips,
  markTipHelpfulness,
  fetchDailyTips
} from '../../services/api/tipsApi';

// Async thunks
export const generateTipsThunk = createAsyncThunk(
  'tips/generate',
  async (limit = 5, { rejectWithValue }) => {
    try {
      const response = await generateTips(limit);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to generate tips');
    }
  }
);

export const getPersonalizedTipsThunk = createAsyncThunk(
  'tips/getPersonalized',
  async (limit = 5, { rejectWithValue }) => {
    try {
      const response = await fetchPersonalizedTips(limit);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch personalized tips');
    }
  }
);

export const markTipHelpfulnessThunk = createAsyncThunk(
  'tips/markHelpfulness',
  async ({ tipId, isHelpful }, { rejectWithValue }) => {
    try {
      const response = await markTipHelpfulness(tipId, isHelpful);
      return { tipId, isHelpful, interaction: response.interaction };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to mark tip helpfulness');
    }
  }
);

export const getDailyTipsThunk = createAsyncThunk(
  'tips/getDailyTips',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchDailyTips();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch daily tips');
    }
  }
);

// Initial state
const initialState = {
  tips: [],
  dailyTips: [],
  loading: false,
  generating: false,
  error: null,
  successMessage: null,
  source: null,
  lastDailyTipsFetch: null
};

// Slice
const tipsSlice = createSlice({
  name: 'tips',
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
      // Generate tips
      .addCase(generateTipsThunk.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(generateTipsThunk.fulfilled, (state, action) => {
        state.generating = false;
        state.tips = action.payload.tips;
        state.source = action.payload.source;
        state.successMessage = 'Tips generated successfully';
      })
      .addCase(generateTipsThunk.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload;
      })

      // Get personalized tips
      .addCase(getPersonalizedTipsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPersonalizedTipsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.tips = action.payload;
      })
      .addCase(getPersonalizedTipsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get daily tips
      .addCase(getDailyTipsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDailyTipsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyTips = action.payload;
        state.lastDailyTipsFetch = new Date().toISOString().split('T')[0]; // Store today's date
      })
      .addCase(getDailyTipsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark tip helpfulness
      .addCase(markTipHelpfulnessThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markTipHelpfulnessThunk.fulfilled, (state, action) => {
        state.loading = false;
        // Update the tip in the state with the feedback
        state.tips = state.tips.map(tip =>
          tip._id === action.payload.tipId
            ? { ...tip, userFeedback: action.payload.isHelpful }
            : tip
        );
        state.successMessage = 'Feedback recorded successfully';
      })
      .addCase(markTipHelpfulnessThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearSuccessMessage } = tipsSlice.actions;

export default tipsSlice.reducer;
