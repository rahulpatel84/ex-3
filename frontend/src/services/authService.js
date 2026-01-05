/**
 * authService.js - Authentication Service with Detailed Logging
 *
 * This service handles all authentication-related API calls
 * Every action is logged with detailed information for debugging
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Logger utility - Disabled for production (was too verbose)
 * Uncomment the console lines to enable debug logging
 */
const log = {
  info: () => {},
  success: () => {},
  error: () => {},
  warning: () => {}
};

/**
 * SIGNUP - Create new user account
 */
export const signup = async (email, password, fullName) => {
  log.info('AUTH', `Starting signup process for email: ${email}`);

  try {
    log.info('AUTH', 'Sending POST request to /auth/signup');

    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: Include cookies
      body: JSON.stringify({ email, password, fullName }),
    });

    log.info('AUTH', `Response status: ${response.status} ${response.statusText}`);

    const data = await response.json();

    if (!response.ok) {
      log.error('AUTH', 'Signup failed', {
        status: response.status,
        message: data.message
      });
      throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message);
    }

    log.success('AUTH', 'Signup successful!', {
      userId: data.data.user.id,
      email: data.data.user.email
    });

    log.info('AUTH', 'User needs to verify email before logging in');

    // Don't store tokens - user must verify email first
    // Return response data
    return {
      user: data.data.user,
      message: data.message
    };
  } catch (error) {
    log.error('AUTH', 'Signup error', error.message);
    throw error;
  }
};

/**
 * LOGIN - Authenticate existing user
 */
export const login = async (email, password) => {
  log.info('AUTH', `Starting login process for email: ${email}`);

  try {
    log.info('AUTH', 'Sending POST request to /auth/login');

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: Include cookies
      body: JSON.stringify({ email, password }),
    });

    log.info('AUTH', `Response status: ${response.status} ${response.statusText}`);

    const data = await response.json();

    if (!response.ok) {
      log.error('AUTH', 'Login failed', {
        status: response.status,
        message: data.message
      });
      throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message);
    }

    log.success('AUTH', 'Login successful!', {
      userId: data.data.user.id,
      email: data.data.user.email
    });

    log.info('STORAGE', 'Storing tokens in localStorage');
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    log.success('STORAGE', 'Tokens stored successfully');

    // Return in expected format for AuthContext
    return {
      accessToken: data.data.accessToken,
      user: data.data.user,
      message: data.message
    };
  } catch (error) {
    log.error('AUTH', 'Login error', error.message);
    throw error;
  }
};

/**
 * LOGOUT - Clear all tokens and redirect
 */
export const logout = () => {
  log.info('AUTH', 'Logging out user');

  const user = getCurrentUser();
  if (user) {
    log.info('AUTH', `Logging out user: ${user.email}`);
  }

  log.info('STORAGE', 'Clearing localStorage');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  log.success('AUTH', 'User logged out successfully');
  log.info('NAVIGATION', 'Redirecting to /login');

  window.location.href = '/login';
};

/**
 * GET CURRENT USER - From localStorage
 */
export const getCurrentUser = () => {
  log.info('AUTH', 'Getting current user from localStorage');

  const userStr = localStorage.getItem('user');

  if (!userStr) {
    log.info('AUTH', 'No user found in localStorage');
    return null;
  }

  try {
    const user = JSON.parse(userStr);
    log.success('AUTH', 'User found', { email: user.email });
    return user;
  } catch (error) {
    log.error('AUTH', 'Error parsing user data', error.message);
    return null;
  }
};

/**
 * CHECK IF LOGGED IN
 */
export const isLoggedIn = () => {
  const token = localStorage.getItem('accessToken');
  const loggedIn = !!token;

  log.info('AUTH', `Check if logged in: ${loggedIn}`);

  return loggedIn;
};

/**
 * FETCH WITH AUTO-REFRESH - Automatically refresh token on 401
 */
export const fetchWithAuth = async (url, options = {}) => {
  log.info('API', `Fetching: ${url}`);

  const token = localStorage.getItem('accessToken');

  if (!token) {
    log.error('API', 'No access token found');
    throw new Error('Not logged in. Please login to continue.');
  }

  log.info('API', 'Adding Authorization header');

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    let response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
    });

    log.info('API', `Response status: ${response.status} ${response.statusText}`);

    // If token expired, try to refresh
    if (response.status === 401) {
      log.warning('API', 'Access token expired (401), attempting refresh...');

      const refreshed = await refreshAccessToken();

      if (refreshed) {
        log.success('API', 'Token refreshed successfully, retrying request');

        // Retry with new token
        const newToken = localStorage.getItem('accessToken');
        response = await fetch(`${API_URL}${url}`, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          },
        });

        log.info('API', `Retry response status: ${response.status} ${response.statusText}`);
      } else {
        log.error('API', 'Token refresh failed, logging out');
        logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    log.success('API', `Request completed: ${url}`);
    return response;
  } catch (error) {
    log.error('API', `Request failed: ${url}`, error.message);
    throw error;
  }
};

/**
 * REFRESH ACCESS TOKEN - Get new access token using refresh token
 */
const refreshAccessToken = async () => {
  log.info('AUTH', 'Starting token refresh');

  try {
    log.info('AUTH', 'Sending POST request to /auth/refresh');

    // Note: Refresh token is sent automatically via httpOnly cookie
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: Include cookies in request
    });

    log.info('AUTH', `Refresh response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      log.error('AUTH', 'Refresh token invalid or expired');
      return false;
    }

    const data = await response.json();

    log.success('AUTH', 'New access token received');
    log.info('STORAGE', 'Updating access token in localStorage');

    localStorage.setItem('accessToken', data.data.accessToken);

    log.success('AUTH', 'Access token refreshed successfully');
    return true;
  } catch (error) {
    log.error('AUTH', 'Token refresh error', error.message);
    return false;
  }
};

/**
 * TEST CONNECTION - Verify backend is reachable
 */
export const testConnection = async () => {
  log.info('API', 'Testing backend connection...');

  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      log.success('API', 'Backend connection successful!', data);
      return { success: true, data };
    } else {
      log.error('API', `Backend responded with error: ${response.status}`);
      return { success: false, error: `Backend error: ${response.status}` };
    }
  } catch (error) {
    log.error('API', 'Backend connection failed', {
      message: error.message,
      url: `${API_URL}/health`,
      hint: 'Make sure backend is running on port 3001'
    });
    return { success: false, error: error.message };
  }
};

/**
 * FORGOT PASSWORD - Request password reset
 */
export const forgotPassword = async (email) => {
  log.info('AUTH', `Starting forgot password for email: ${email}`);

  try {
    log.info('AUTH', 'Sending POST request to /auth/forgot-password');

    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    log.info('AUTH', `Response status: ${response.status} ${response.statusText}`);

    const data = await response.json();

    if (!response.ok) {
      log.error('AUTH', 'Forgot password failed', {
        status: response.status,
        message: data.message
      });
      throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message);
    }

    log.success('AUTH', 'Password reset email sent', { email });
    return data;
  } catch (error) {
    log.error('AUTH', 'Forgot password error', error.message);
    throw error;
  }
};

/**
 * RESET PASSWORD - Reset password with token
 */
export const resetPassword = async (token, newPassword) => {
  log.info('AUTH', 'Starting password reset');

  try {
    log.info('AUTH', 'Sending POST request to /auth/reset-password');

    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    log.info('AUTH', `Response status: ${response.status} ${response.statusText}`);

    const data = await response.json();

    if (!response.ok) {
      log.error('AUTH', 'Password reset failed', {
        status: response.status,
        message: data.message
      });
      throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message);
    }

    log.success('AUTH', 'Password reset successful');
    return data;
  } catch (error) {
    log.error('AUTH', 'Password reset error', error.message);
    throw error;
  }
};

/**
 * GET USER PROFILE - Fetch fresh user profile from API
 */
export const getUserProfile = async () => {
  log.info('API', 'Getting user profile from API');

  try {
    const response = await fetchWithAuth('/auth/me');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user profile');
    }

    // Update localStorage with fresh data
    const userData = data.data.user;
    localStorage.setItem('user', JSON.stringify(userData));
    
    log.success('API', 'User profile fetched from API', { email: userData.email });
    return userData;
  } catch (error) {
    log.error('API', 'Failed to fetch user profile', error.message);
    throw error;
  }
};

export default {
  signup,
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
  fetchWithAuth,
  testConnection,
  forgotPassword,
  resetPassword,
  getUserProfile,
};
