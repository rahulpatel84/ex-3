import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserSettings } from '../services/expenseService';
import Sidebar from '../components/Sidebar';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
];

const SettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    currencyCode: user?.currencyCode || 'USD',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        currencyCode: user.currencyCode || 'USD',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateUserSettings(formData);
      await refreshUser(); // Refresh user data in context
      setSuccess('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account preferences</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 max-w-4xl">
            {/* Tabs */}
            <div className="mb-6">
              <nav className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'general'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  General
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'preferences'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Preferences
                </button>
              </nav>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-emerald-700">{success}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Account Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Account Status</span>
                      <span className="text-sm font-medium text-emerald-600">Active</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Email Verified</span>
                      <span className={`text-sm font-medium ${user?.emailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {user?.emailVerified ? 'Yes' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm font-medium text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                {/* Currency Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Currency Settings</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose your preferred currency. This will be used for all transactions and reports.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Currency
                      </label>
                      <select
                        value={formData.currencyCode}
                        onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      >
                        {CURRENCIES.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.symbol} - {currency.name} ({currency.code})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        Current: {CURRENCIES.find(c => c.code === formData.currencyCode)?.symbol} {formData.currencyCode}
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex gap-2">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-900">Important Note</p>
                          <p className="text-xs text-blue-700 mt-1">
                            Changing your currency will update how amounts are displayed across the platform. 
                            Existing transaction amounts will remain unchanged but will be displayed in the new currency format.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save Currency'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Display Preferences */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Display Preferences</h3>
                  <p className="text-sm text-gray-600 mb-4">Coming soon...</p>
                  <div className="space-y-3 opacity-50">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Dark Mode</p>
                        <p className="text-xs text-gray-500">Switch to dark theme</p>
                      </div>
                      <div className="w-11 h-6 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Compact View</p>
                        <p className="text-xs text-gray-500">Show more data in less space</p>
                      </div>
                      <div className="w-11 h-6 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;

