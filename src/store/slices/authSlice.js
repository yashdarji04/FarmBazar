import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { getSessionUser, setSessionUser, clearSessionUser, updateSessionUser } from '../../services/authStorage';

const API_URL = '/auth/';

// Get user for THIS tab (tab-scoped session — see services/authStorage.js)
const user = getSessionUser();

const initialState = {
  user: user ? user : null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Register user
export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
  try {
    const { rememberMe, ...payload } = userData;
    const response = await api.post(API_URL + 'register', payload);
    if (response.data && response.data.data) {
      setSessionUser(response.data.data, !!rememberMe);
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Login user
export const login = createAsyncThunk('auth/login', async (userData, thunkAPI) => {
  try {
    const { rememberMe, ...payload } = userData;
    const response = await api.post(API_URL + 'login', payload);
    if (response.data && response.data.data) {
      setSessionUser(response.data.data, !!rememberMe);
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Logout user (only affects this tab's session + forgets "Remember Me")
export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post(API_URL + 'logout', {});
  } catch {
    // even if the server call fails, still clear the local session
  }
  clearSessionUser();
});

/**
 * Complete Google signup — called from ChooseRole page.
 * Sends the chosen role (and optional farm details) to the backend,
 * then stores the updated user in session.
 */
export const completeGoogleSignup = createAsyncThunk('auth/completeGoogleSignup', async (payload, thunkAPI) => {
  try {
    const response = await api.post(API_URL + 'google/complete-profile', payload);
    if (response.data && response.data.data) {
      // Update session token (role may have changed, new token issued)
      setSessionUser(response.data.data, false);
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    // Used by pages that update the logged-in user's own profile.
    // Persists to THIS tab's session storage too, so a refresh doesn't
    // lose the change — without touching any other tab's session.
    updateUser: (state, action) => {
      const updated = updateSessionUser(action.payload) || { ...state.user, ...action.payload };
      state.user = updated;
    },
    /**
     * Called by GoogleAuthCallback after parsing the redirect URL params.
     * Stores the Google-provided user data in Redux + session storage.
     */
    setGoogleUser: (state, action) => {
      setSessionUser(action.payload, false);
      state.user = action.payload;
      state.isSuccess = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      })
      // completeGoogleSignup
      .addCase(completeGoogleSignup.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(completeGoogleSignup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(completeGoogleSignup.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, updateUser, setGoogleUser } = authSlice.actions;
export default authSlice.reducer;
