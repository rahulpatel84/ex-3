import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllExpenses, createExpense, deleteExpense, updateExpense, getAnalytics, getAllCategories } from '../services/expenseService';
import * as householdService from '../services/householdService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import TransactionTable from '../components/TransactionTable';

const CHART_COLORS = ['#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9'];

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [expenses, setExpenses] = useState([]);
  const [deletedExpenses, setDeletedExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    paymentMethod: 'cash',
  });

  useEffect(() => {
    loadData();
    loadCollaborators();
  }, [user?.currentHouseholdId]); // Reload when household changes

  const loadCollaborators = async () => {
    try {
      if (user?.currentHouseholdId) {
        const household = await householdService.getHousehold(user.currentHouseholdId);
        setCollaborators(household.members?.filter(m => m.status === 'active') || []);
        setPendingInvites(household.invitations?.filter(i => !i.acceptedAt && !i.declinedAt) || []);
      }
    } catch (err) {
      console.error('Failed to load collaborators:', err);
    }
  };

  const handleShareInvite = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    
    setShareLoading(true);
    setShareMessage(null);
    
    try {
      await householdService.inviteMember(user.currentHouseholdId, {
        email: shareEmail,
        role: 'member',
      });
      
      setShareMessage({ type: 'success', text: `Invitation sent to ${shareEmail}!` });
      setShareEmail('');
      loadCollaborators();
    } catch (err) {
      setShareMessage({ type: 'error', text: err.message || 'Failed to send invitation' });
    } finally {
      setShareLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [expensesData, deletedData, categoriesData, analyticsData] = await Promise.all([
        getAllExpenses(),
        getAllExpenses({ includeDeleted: 'true' }),
        getAllCategories(),
        getAnalytics(),
      ]);

      setExpenses(expensesData);
      // Filter to show only deleted items
      setDeletedExpenses(deletedData.filter(e => e.deletedAt != null));
      setCategories(categoriesData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await createExpense({
        ...formData,
        amount: parseFloat(formData.amount),
      });

      setFormData({
        categoryId: '',
        amount: '',
        description: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        paymentMethod: 'cash',
      });
      setShowAddExpense(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await deleteExpense(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateExpense = async (id, data) => {
    try {
      await updateExpense(id, data);
      await loadData();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currencyCode || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Reload data when user currency changes
  useEffect(() => {
    if (user?.currencyCode) {
      // Force re-render when currency changes
      loadData();
    }
  }, [user?.currencyCode]);

  const categoryChartData = analytics?.byCategory?.map(cat => ({
    name: cat.category.name,
    value: cat.total,
  })) || [];

  const paymentMethodData = Object.entries(analytics?.byPaymentMethod || {}).map(([method, data]) => ({
    name: method.replace('_', ' ').toUpperCase(),
    total: data.total,
  }));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Track and manage your expenses</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
                {collaborators.length > 1 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                    {collaborators.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowAddExpense(!showAddExpense)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Expense
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Add Expense Modal/Form */}
            {showAddExpense && (
              <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Expense</h3>
                  <button
                    onClick={() => setShowAddExpense(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                    >
                      <option value="cash">Cash</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                      placeholder="Optional..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                      rows="2"
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="md:col-span-2 flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium text-sm"
                    >
                      Save Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddExpense(false)}
                      className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tabs */}
            <div className="mb-6">
              <nav className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'transactions'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Transactions
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'history'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'analytics'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analytics
                </button>
              </nav>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-transparent"></div>
                <p className="text-gray-600 mt-4 text-sm">Loading your expenses...</p>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCard
                        title="Total Expenses"
                        value={formatCurrency(analytics?.summary?.totalExpenses || 0)}
                        subtitle="This month"
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                        trend="up"
                        trendValue="+12.5%"
                      />
                      <StatCard
                        title="Total Income"
                        value={formatCurrency(analytics?.summary?.totalIncome || 0)}
                        subtitle="This month"
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        }
                        trend="up"
                        trendValue="+23.1%"
                      />
                      <StatCard
                        title="Net Balance"
                        value={formatCurrency(analytics?.summary?.netBalance || 0)}
                        subtitle="Current balance"
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                        trend="up"
                        trendValue="+8.2%"
                      />
                      <StatCard
                        title="Transactions"
                        value={analytics?.summary?.totalTransactions || 0}
                        subtitle="Total count"
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        }
                      />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Category Chart */}
                      {categoryChartData.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <h3 className="text-base font-semibold text-gray-900 mb-4">Spending by Category</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={categoryChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {categoryChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Recent Expenses */}
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                        <div className="space-y-3">
                          {expenses.slice(0, 5).map(expense => (
                            <div key={expense.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{expense.category?.icon}</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{expense.category?.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(expense.date), 'MMM d')} • {expense.paymentMethod?.replace('_', ' ')}
                                  </p>
                                </div>
                              </div>
                              <p className={`text-sm font-semibold ${expense.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                                {expense.type === 'expense' ? '-' : '+'}{formatCurrency(expense.amount)}
                              </p>
                            </div>
                          ))}
                          {expenses.length === 0 && (
                            <p className="text-center text-gray-500 py-8 text-sm">No transactions yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transactions Tab - NEW TABLE VIEW */}
                {activeTab === 'transactions' && (
                  <TransactionTable
                    expenses={expenses}
                    categories={categories}
                    onDelete={handleDeleteExpense}
                    onUpdate={handleUpdateExpense}
                    formatCurrency={formatCurrency}
                  />
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    {/* Active Transactions */}
                    <div className="bg-white rounded-lg border border-gray-200">
                      <div className="p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Active Transactions</h3>
                        <div className="space-y-2">
                          {expenses.map(expense => (
                            <div key={expense.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
                                  <span className="text-2xl">{expense.category?.icon}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{expense.category?.name}</p>
                                  <p className="text-xs text-gray-500">{expense.description || 'No description'}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Added: {format(new Date(expense.createdAt), 'MMM d, yyyy h:mm a')} • by {expense.user?.fullName}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className={`text-base font-semibold ${expense.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {expense.type === 'expense' ? '-' : '+'}{formatCurrency(expense.amount)}
                                  </p>
                                  <p className="text-xs text-gray-500">{expense.paymentMethod?.replace('_', ' ').toUpperCase()}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                          {expenses.length === 0 && (
                            <p className="text-center text-gray-500 py-12 text-sm">No expenses yet. Add your first expense!</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Deleted Transactions */}
                    {deletedExpenses.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-6">
                          <h3 className="text-base font-semibold text-gray-900 mb-2">Deleted Transactions</h3>
                          <p className="text-xs text-gray-500 mb-4">These transactions have been deleted but kept for record purposes</p>
                          <div className="space-y-2">
                            {deletedExpenses.map(expense => (
                              <div key={expense.id} className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg opacity-75">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-red-200">
                                    <span className="text-2xl opacity-50">{expense.category?.icon}</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{expense.category?.name}</p>
                                    <p className="text-xs text-gray-600">{expense.description || 'No description'}</p>
                                    <div className="mt-1 space-y-0.5">
                                      <p className="text-xs text-gray-500">
                                        ✅ Added: {format(new Date(expense.createdAt), 'MMM d, yyyy h:mm a')} by {expense.user?.fullName}
                                      </p>
                                      <p className="text-xs text-red-600 font-medium">
                                        🗑️ Deleted: {format(new Date(expense.deletedAt), 'MMM d, yyyy h:mm a')} by {expense.deletedByUser?.fullName || 'Unknown'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-base font-semibold ${expense.type === 'expense' ? 'text-red-600' : 'text-emerald-600'} opacity-50`}>
                                    {expense.type === 'expense' ? '-' : '+'}{formatCurrency(expense.amount)}
                                  </p>
                                  <p className="text-xs text-gray-500">{expense.paymentMethod?.replace('_', ' ').toUpperCase()}</p>
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                    Deleted
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    {/* Payment Methods Chart */}
                    {paymentMethodData.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Methods Breakdown</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={paymentMethodData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Bar dataKey="total" fill="#475569" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Category Breakdown */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Category Breakdown</h3>
                      <div className="space-y-3">
                        {analytics?.byCategory?.map((cat, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-gray-200">
                                <span className="text-xl">{cat.category.icon}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{cat.category.name}</p>
                                <p className="text-xs text-gray-500">{cat.count} transactions</p>
                              </div>
                            </div>
                            <p className="text-base font-semibold text-gray-900">
                              {formatCurrency(cat.total)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Share Dashboard</h3>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareMessage(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Invite family members to access and manage expenses together. They'll receive an email to join.
              </p>
              
              {shareMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  shareMessage.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {shareMessage.text}
                </div>
              )}
              
              <form onSubmit={handleShareInvite} className="flex gap-2 mb-6">
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={shareLoading}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium text-sm disabled:opacity-50"
                >
                  {shareLoading ? 'Sending...' : 'Invite'}
                </button>
              </form>
              
              {/* Current Collaborators */}
              {collaborators.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">People with access</h4>
                  <div className="space-y-2">
                    {collaborators.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">
                              {member.user?.fullName?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {member.user?.fullName}
                              {member.userId === user?.id && (
                                <span className="ml-1 text-xs text-gray-500">(You)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">{member.user?.email}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          member.role === 'owner' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Pending Invitations */}
              {pendingInvites.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Pending invitations</h4>
                  <div className="space-y-2">
                    {pendingInvites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-900">{invite.email}</p>
                            <p className="text-xs text-gray-500">
                              Expires {format(new Date(invite.expiresAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
