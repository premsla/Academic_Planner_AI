import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchSmartSchedule,
  generateSmartSchedule,
  confirmStudySlot,
  completeStudySlot,
  saveStudySlot,
  createCustomStudySlot,
  deleteStudySlot
} from '../../services/api/smartScheduleApi';

// Async thunks
export const generateSmartScheduleThunk = createAsyncThunk(
  'smartSchedule/generate',
  async (options = {}, { rejectWithValue }) => {
    try {
      // If options is just a number, treat it as days
      const scheduleOptions = typeof options === 'number'
        ? { days: options }
        : options;

      // Set default options
      const finalOptions = {
        days: 30,
        includeClasses: true,
        includeTasks: true,
        includeExams: true,
        optimizeSchedule: true,
        prioritizeExams: true,
        balanceWorkload: true,
        minimumDays: 7,
        adaptToChanges: true,
        ...scheduleOptions
      };

      const response = await generateSmartSchedule(finalOptions);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to generate smart schedule');
    }
  }
);

export const getSmartScheduleSuggestions = createAsyncThunk(
  'smartSchedule/getSuggestions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchSmartSchedule();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch smart schedule suggestions');
    }
  }
);

export const confirmStudySlotThunk = createAsyncThunk(
  'smartSchedule/confirmSlot',
  async (slotId, { rejectWithValue }) => {
    try {
      const response = await confirmStudySlot(slotId);
      return response.studySlot;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to confirm study slot');
    }
  }
);

export const completeStudySlotThunk = createAsyncThunk(
  'smartSchedule/completeSlot',
  async (slotId, { rejectWithValue }) => {
    try {
      const response = await completeStudySlot(slotId);
      return response.studySlot;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to complete study slot');
    }
  }
);

export const createCustomStudySlotThunk = createAsyncThunk(
  'smartSchedule/createCustomSlot',
  async (slotData, { rejectWithValue }) => {
    try {
      const response = await createCustomStudySlot(slotData);
      return response.studySlot;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create custom study slot');
    }
  }
);

export const saveStudySlotThunk = createAsyncThunk(
  'smartSchedule/saveSlot',
  async (slotData, { rejectWithValue }) => {
    try {
      const response = await saveStudySlot(slotData);
      return response.studySlot;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to save study slot');
    }
  }
);

export const deleteStudySlotThunk = createAsyncThunk(
  'smartSchedule/deleteSlot',
  async (slotId, { rejectWithValue }) => {
    try {
      await deleteStudySlot(slotId);
      return slotId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete study slot');
    }
  }
);

// Initial state
const initialState = {
  suggestions: [],
  confirmedSlots: [],
  loading: false,
  generating: false,
  error: null,
  successMessage: null,
  source: null
};

// Slice
const smartScheduleSlice = createSlice({
  name: 'smartSchedule',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
    },
    setGenerating: (state, action) => {
      state.generating = action.payload;
    },
    setSuggestions: (state, action) => {
      state.suggestions = action.payload;
      state.loading = false;
      state.generating = false;
      state.source = 'Default Generator';
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
      state.source = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Generate smart schedule
      .addCase(generateSmartScheduleThunk.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(generateSmartScheduleThunk.fulfilled, (state, action) => {
        state.generating = false;

        // Log the payload to see what we're getting
        console.log('Smart schedule generation successful, payload:', action.payload);
        console.log('Study slots count:', action.payload.studySlots?.length || 0);
        console.log('Source:', action.payload.source);

        // Clear existing suggestions and set new ones
        state.suggestions = action.payload.studySlots;
        state.source = action.payload.source;
        state.successMessage = 'Smart schedule generated successfully';
      })
      .addCase(generateSmartScheduleThunk.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload;
      })

      // Get suggestions
      .addCase(getSmartScheduleSuggestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSmartScheduleSuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestions = action.payload;
      })
      .addCase(getSmartScheduleSuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Confirm slot
      .addCase(confirmStudySlotThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmStudySlotThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.confirmedSlots.push(action.payload);
        state.suggestions = state.suggestions.filter(
          slot => slot._id !== action.payload._id
        );
        state.successMessage = 'Study slot confirmed successfully';
      })
      .addCase(confirmStudySlotThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Complete slot
      .addCase(completeStudySlotThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeStudySlotThunk.fulfilled, (state, action) => {
        state.loading = false;

        // Update in confirmedSlots
        state.confirmedSlots = state.confirmedSlots.map(slot =>
          slot._id === action.payload._id ? action.payload : slot
        );

        // Update in suggestions if present
        state.suggestions = state.suggestions.map(slot =>
          slot._id === action.payload._id ? action.payload : slot
        );

        state.successMessage = 'Study slot marked as completed';
      })
      .addCase(completeStudySlotThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create custom slot
      .addCase(createCustomStudySlotThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomStudySlotThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.confirmedSlots.push(action.payload);
        state.successMessage = 'Custom study slot created successfully';
      })
      .addCase(createCustomStudySlotThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Save slot
      .addCase(saveStudySlotThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveStudySlotThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.confirmedSlots.push(action.payload);
        state.successMessage = 'Study slot saved successfully';
      })
      .addCase(saveStudySlotThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete slot
      .addCase(deleteStudySlotThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStudySlotThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.confirmedSlots = state.confirmedSlots.filter(
          slot => slot._id !== action.payload
        );
        state.suggestions = state.suggestions.filter(
          slot => slot._id !== action.payload
        );
        state.successMessage = 'Study slot deleted successfully';
      })
      .addCase(deleteStudySlotThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearSuccessMessage, setError, setSuccessMessage, setGenerating, setSuggestions, clearSuggestions } = smartScheduleSlice.actions;

export default smartScheduleSlice.reducer;
