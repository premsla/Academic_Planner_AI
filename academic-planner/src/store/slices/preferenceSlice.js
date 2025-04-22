import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  fetchUserPreferences, 
  updateUserPreferences, 
  addSubjectPreference 
} from '../../services/api/preferenceApi';

// Async thunks
export const getUserPreferencesThunk = createAsyncThunk(
  'preferences/getUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchUserPreferences();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch user preferences');
    }
  }
);

export const updateUserPreferencesThunk = createAsyncThunk(
  'preferences/update',
  async (preferencesData, { rejectWithValue }) => {
    try {
      const response = await updateUserPreferences(preferencesData);
      return response.preferences;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update preferences');
    }
  }
);

export const addSubjectPreferenceThunk = createAsyncThunk(
  'preferences/addSubject',
  async (subjectData, { rejectWithValue }) => {
    try {
      const response = await addSubjectPreference(subjectData);
      return response.preferences;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add subject preference');
    }
  }
);

// Initial state
const initialState = {
  preferences: null,
  loading: false,
  error: null,
  successMessage: null
};

// Slice
const preferenceSlice = createSlice({
  name: 'preferences',
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
      // Get user preferences
      .addCase(getUserPreferencesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserPreferencesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
      })
      .addCase(getUserPreferencesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update user preferences
      .addCase(updateUserPreferencesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserPreferencesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
        state.successMessage = 'Preferences updated successfully';
      })
      .addCase(updateUserPreferencesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add subject preference
      .addCase(addSubjectPreferenceThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSubjectPreferenceThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
        state.successMessage = 'Subject preference added successfully';
      })
      .addCase(addSubjectPreferenceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearSuccessMessage } = preferenceSlice.actions;

export default preferenceSlice.reducer;
