import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as householdService from '../services/householdService';

const AcceptInvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, loading, refreshUser, login, signup } = useAuth();
  
  const [status, setStatus] = useState('checking'); // checking, need-auth, accepting, success, error
  const [message, setMessage] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [invitationEmail, setInvitationEmail] = useState('');
  
  // Auth form state
  const [authMode, setAuthMode] = useState('login'); // login or signup
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [acceptingInvitation, setAcceptingInvitation] = useState(false);

  useEffect(() => {
    checkInvitationDetails();
  }, [token]);

  useEffect(() => {
    if (loading || status === 'need-auth' || status === 'accepting' || status === 'success') return;

    // Store token for after auth
    localStorage.setItem('pendingInvitationToken', token);

    // Only auto-accept if user is already logged in when page loads
    if (isLoggedIn && status === 'checking') {
      acceptInvitation();
    }
  }, [isLoggedIn, loading, token, status]);

  const checkInvitationDetails = async () => {
    try {
      setStatus('checking');
      const invitationInfo = await householdService.checkInvitation(token);
      
      setHouseholdName(invitationInfo.householdName);
      setInvitationEmail(invitationInfo.email);
      
      // Pre-fill email and set auth mode based on whether user exists
      setFormData(prev => ({ ...prev, email: invitationInfo.email }));
      setAuthMode(invitationInfo.userExists ? 'login' : 'signup');
      
      setStatus('need-auth');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Invalid or expired invitation');
    }
  };

  const acceptInvitation = async () => {
    if (acceptingInvitation) return; // Prevent duplicate calls
    
    try {
      setAcceptingInvitation(true);
      setStatus('accepting');
      const result = await householdService.acceptInvitation(token);
      setHouseholdName(result.household?.name || 'the shared account');
      setStatus('success');
      setMessage(`You've successfully joined ${result.household?.name || 'the shared account'}!`);
      
      // Clear the pending token
      localStorage.removeItem('pendingInvitationToken');
      
      // Refresh user data to get updated household info
      await refreshUser();
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to accept invitation. It may have expired or already been used.');
      setAcceptingInvitation(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      if (authMode === 'login') {
        await login(formData.email, formData.password);
      } else {
        // Signup with invitation - email will be auto-verified
        const signupResult = await signup(formData.email, formData.password, formData.fullName);
        
        // If signup returned tokens (email already verified), we're done
        // Otherwise, try to login
        if (!signupResult.accessToken) {
          // Wait a moment for database to commit email verification
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try to login - retry up to 3 times in case of timing issues
          let loginSuccess = false;
          let lastError = null;
          for (let i = 0; i < 3; i++) {
            try {
              await login(formData.email, formData.password);
              loginSuccess = true;
              break;
            } catch (err) {
              lastError = err;
              if (i < 2) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }
          
          if (!loginSuccess) {
            throw lastError || new Error('Failed to log in after signup. Please try logging in manually.');
          }
        }
      }
      
      // Verify token is stored before proceeding
      let attempts = 0;
      while (attempts < 10) {
        const token = localStorage.getItem('accessToken');
        if (token) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      // Double-check token exists
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication token not found. Please try logging in again.');
      }
      
      // Small delay to ensure auth context is updated
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Now accept the invitation
      await acceptInvitation();
    } catch (error) {
      setAuthError(error.message || 'Authentication failed. Please try again.');
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg font-bold">ET</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">ExpenseTracker</span>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {status === 'checking' && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto"></div>
              <p className="mt-4 text-gray-600">Verifying invitation...</p>
            </div>
          )}

          {status === 'accepting' && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto"></div>
              <h2 className="mt-6 text-xl font-semibold text-gray-900">Joining...</h2>
              <p className="mt-2 text-gray-600">Setting up your access...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-xl font-semibold text-gray-900">Welcome! 🎉</h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <p className="mt-4 text-sm text-gray-500">Redirecting to dashboard...</p>
              <Link
                to="/dashboard"
                className="mt-6 inline-block px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-6 text-xl font-semibold text-gray-900">Invitation Error</h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <Link
                to="/"
                className="mt-6 inline-block px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Go to Home
              </Link>
            </div>
          )}

          {status === 'need-auth' && (
            <>
              {/* Header */}
              <div className="px-6 py-8 bg-slate-50 border-b border-gray-200 text-center">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">You're Invited!</h2>
                {householdName && (
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    Join: {householdName}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-600">
                  {authMode === 'login' 
                    ? 'Log in to accept this invitation' 
                    : 'Create an account to accept this invitation'}
                </p>
              </div>

              {/* Auth Tabs */}
              {invitationEmail && (
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      authMode === 'login'
                        ? 'text-slate-700 border-b-2 border-slate-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    I have an account
                  </button>
                  <button
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      authMode === 'signup'
                        ? 'text-slate-700 border-b-2 border-slate-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Create new account
                  </button>
                </div>
              )}

              {/* Auth Form */}
              <div className="p-6">
                {authError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                        placeholder="Your name"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      placeholder="your@email.com"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This email was used for the invitation
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder={authMode === 'signup' ? 'Create a password' : 'Your password'}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors disabled:opacity-50"
                  >
                    {authLoading 
                      ? 'Please wait...' 
                      : authMode === 'login' 
                        ? 'Log in & Accept Invitation' 
                        : 'Create Account & Join'}
                  </button>
                </form>

                {authMode === 'login' && (
                  <p className="mt-4 text-center text-sm text-gray-600">
                    <Link to="/forgot-password" className="text-slate-700 hover:text-slate-800">
                      Forgot your password?
                    </Link>
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Back link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/" className="text-slate-700 hover:text-slate-800">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AcceptInvitationPage;
