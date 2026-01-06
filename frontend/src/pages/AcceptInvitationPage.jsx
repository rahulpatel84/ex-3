import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as householdService from '../services/householdService';

const AcceptInvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, loading, refreshUser } = useAuth();
  
  const [status, setStatus] = useState('loading'); // loading, success, error, need-login
  const [message, setMessage] = useState('');
  const [householdName, setHouseholdName] = useState('');

  useEffect(() => {
    if (loading) return;

    if (!isLoggedIn) {
      setStatus('need-login');
      setMessage('Please log in or sign up to accept this invitation.');
      // Store the token so we can use it after login
      localStorage.setItem('pendingInvitationToken', token);
      return;
    }

    acceptInvitation();
  }, [isLoggedIn, loading, token]);

  const acceptInvitation = async () => {
    try {
      setStatus('loading');
      const result = await householdService.acceptInvitation(token);
      setHouseholdName(result.household?.name || 'the household');
      setStatus('success');
      setMessage(`You've successfully joined ${result.household?.name || 'the household'}!`);
      
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
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-700 mx-auto"></div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">Accepting Invitation...</h2>
            <p className="mt-2 text-gray-600">Please wait while we process your invitation.</p>
          </>
        )}

        {status === 'success' && (
          <>
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
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">Invitation Error</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <div className="mt-6 space-y-3">
              <Link
                to="/dashboard"
                className="block px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/users"
                className="block px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Manage Users
              </Link>
            </div>
          </>
        )}

        {status === 'need-login' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">Login Required</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <div className="mt-6 space-y-3">
              <Link
                to="/login"
                className="block px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="block px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign Up
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              After logging in, you'll be automatically redirected to accept the invitation.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitationPage;

