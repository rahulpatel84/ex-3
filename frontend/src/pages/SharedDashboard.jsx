import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllExpenses, createExpense, deleteExpense, updateExpense, getAnalytics, getAllCategories } from '../services/expenseService';
import * as householdService from '../services/householdService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import TransactionTable from '../components/TransactionTable';

const CHART_COLORS = ['#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9'];

const SharedDashboard = () => {
  const { householdId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [expenses, setExpenses] = useState([]);
  const [deletedExpenses, setDeletedExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [householdDetails, setHouseholdDetails] = useState(null);
  const [ownerName, setOwnerName] = useState('');
  
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    paymentMethod: 'cash',
  });

  // Edit state
  const [editingExpense, setEditingExpense] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    loadData();
    loadHouseholdDetails();
  }, [householdId]);

  const loadHouseholdDetails = async () => {
    try {
      const household = await householdService.getHousehold(householdId);
      setHouseholdDetails(household);
      
      // Find the owner
      const owner = household.members?.find(m => m.role === 'owner');
      if (owner) {
        setOwnerName(owner.user?.fullName || 'Owner');
      }
    } catch (err) {
      console.error('Failed to load household details:', err);
      setError('Failed to load shared dashboard');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, analyticsData, categoriesData] = await Promise.all([
        getAllExpenses({ householdId }),
        getAnalytics({ householdId }),
        getAllCategories(),
      ]);
      
      // Separate active and deleted expenses
      const active = expensesData.filter(e => !e.deletedAt);
      const deleted = expensesData.filter(e => e.deletedAt);
      
      setExpenses(active);
      setDeletedExpenses(deleted);
      setAnalytics(analyticsData);
      setCategories(categoriesData);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createExpense({
        ...formData,
        amount: parseFloat(formData.amount),
        householdId, // Create expense for this household
      });
      setShowAddExpense(false);
      setFormData({
        categoryId: '',
        amount: '',
        description: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        paymentMethod: 'cash',
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteExpense(id);
        loadData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setEditFormData({
      categoryId: expense.categoryId || expense.category?.id || '',
      amount: expense.amount,
      description: expense.description,
      notes: expense.notes || '',
      date: expense.date.split('T')[0],
      type: expense.type,
      paymentMethod: expense.paymentMethod || 'cash',
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateExpense(editingExpense.id, {
        ...editFormData,
        amount: parseFloat(editFormData.amount),
      });
      setEditingExpense(null);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Get currency from owner's settings or default
  const getCurrencySymbol = () => {
    const currency = householdDetails?.ownerCurrency || 'USD';
    const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };
    return symbols[currency] || '$';
  };

  const formatCurrency = (amount) => {
    return `${getCurrencySymbol()}${Math.abs(amount).toFixed(2)}`;
  };

  // Calculate totals from expenses
  const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  // Prepare category chart data
  const categoryData = categories.map(cat => {
    const total = expenses
      .filter(e => e.type === 'expense' && e.categoryId === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);
    return { name: cat.name, value: total, icon: cat.icon };
  }).filter(c => c.value > 0);

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'history', name: 'History' },
    { id: 'analytics', name: 'Analytics' },
  ];

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shared Dashboard</h1>
              <p className="text-gray-500 mt-1">
                Managing <span className="font-semibold text-emerald-600">{ownerName}'s</span> Expense Tracker
              </p>
            </div>
            <button
              onClick={() => setShowAddExpense(true)}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Expense
            </button>
          </div>

          {/* Shared Info Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div>
              <p className="text-sm text-emerald-800">
                You're viewing <span className="font-semibold">{householdDetails?.name || 'Shared Dashboard'}</span>. 
                Any expenses you add here will be visible to all members.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="ml-auto text-sm text-emerald-700 hover:text-emerald-900 font-medium"
            >
              ← Back to My Dashboard
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-gray-900 border-b-2 border-slate-700 bg-gray-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                      title="Total Expenses"
                      value={formatCurrency(totalExpenses)}
                      subtitle="This month"
                      trend="+12.5%"
                      icon={
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      }
                    />
                    <StatCard
                      title="Total Income"
                      value={formatCurrency(totalIncome)}
                      subtitle="This month"
                      trend="+23.1%"
                      icon={
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      }
                    />
                    <StatCard
                      title="Net Balance"
                      value={`${netBalance < 0 ? '-' : ''}${formatCurrency(netBalance)}`}
                      subtitle="Current balance"
                      trend="+8.2%"
                      icon={
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                    />
                    <StatCard
                      title="Transactions"
                      value={expenses.length.toString()}
                      subtitle="Total count"
                      icon={
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      }
                    />
                  </div>

                  {/* Charts and Recent Transactions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Spending by Category */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
                      {categoryData.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {categoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                          No expenses to display
                        </div>
                      )}
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                      <div className="space-y-4">
                        {expenses.slice(0, 5).map((expense) => (
                          <div key={expense.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{expense.category?.icon || '💰'}</span>
                              <div>
                                <p className="font-medium text-gray-900">{expense.category?.name || 'Uncategorized'}</p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(expense.date), 'MMM d')} • {expense.paymentMethod || 'cash'}
                                  {expense.user && <span className="ml-1 text-emerald-600">by {expense.user.fullName}</span>}
                                </p>
                              </div>
                            </div>
                            <span className={`font-semibold ${expense.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                              {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                            </span>
                          </div>
                        ))}
                        {expenses.length === 0 && (
                          <p className="text-gray-500 text-center py-8">No transactions yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'transactions' && (
                <TransactionTable
                  expenses={expenses}
                  categories={categories}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  formatCurrency={formatCurrency}
                  showAddedBy={true}
                />
              )}

              {activeTab === 'history' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Deleted Transactions (Audit Trail)</h3>
                  {deletedExpenses.length > 0 ? (
                    <div className="space-y-3">
                      {deletedExpenses.map((expense) => (
                        <div key={expense.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xl opacity-50">{expense.category?.icon || '💰'}</span>
                              <div>
                                <p className="font-medium text-gray-500 line-through">{expense.description || expense.category?.name}</p>
                                <p className="text-xs text-gray-400">
                                  Added: {format(new Date(expense.createdAt), 'MMM d, yyyy')} by {expense.user?.fullName || 'Unknown'}
                                </p>
                                <p className="text-xs text-red-500">
                                  Deleted: {expense.deletedAt && format(new Date(expense.deletedAt), 'MMM d, yyyy')} 
                                  {expense.deletedByUser && ` by ${expense.deletedByUser.fullName}`}
                                </p>
                              </div>
                            </div>
                            <span className="font-medium text-gray-400 line-through">
                              {formatCurrency(expense.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No deleted transactions</p>
                  )}
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Monthly Trend */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
                    {analytics?.monthlyTrend?.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="expenses" name="Expenses" fill="#475569" />
                            <Bar dataKey="income" name="Income" fill="#10b981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center text-gray-500">
                        No data to display
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Transaction</h2>
              <button onClick={() => setShowAddExpense(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                  className={`flex-1 py-2 rounded-lg border ${formData.type === 'expense' ? 'bg-red-50 border-red-200 text-red-700' : 'border-gray-200'}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                  className={`flex-1 py-2 rounded-lg border ${formData.type === 'income' ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200'}`}
                >
                  Income
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select category</option>
                  {categories.filter(c => c.type === formData.type || c.type === 'both').map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="What was this for?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Add Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Transaction</h2>
              <button onClick={() => setEditingExpense(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setEditFormData(prev => ({ ...prev, type: 'expense' }))}
                  className={`flex-1 py-2 rounded-lg border ${editFormData.type === 'expense' ? 'bg-red-50 border-red-200 text-red-700' : 'border-gray-200'}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setEditFormData(prev => ({ ...prev, type: 'income' }))}
                  className={`flex-1 py-2 rounded-lg border ${editFormData.type === 'income' ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200'}`}
                >
                  Income
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="categoryId"
                  value={editFormData.categoryId}
                  onChange={handleEditChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select category</option>
                  {categories.filter(c => c.type === editFormData.type || c.type === 'both').map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={editFormData.amount}
                  onChange={handleEditChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={editFormData.date}
                  onChange={handleEditChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={editFormData.paymentMethod}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Update Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedDashboard;

