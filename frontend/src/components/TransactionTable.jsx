import React, { useState, useMemo } from 'react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

const TransactionTable = ({ expenses, categories, onDelete, onUpdate, formatCurrency }) => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [editingExpense, setEditingExpense] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  const timeFilters = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
  ];

  // Filter expenses by time period
  const filteredExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    const now = new Date();
    let startDate, endDate;

    switch (timeFilter) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case 'all':
      default:
        return expenses;
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { start: startDate, end: endDate });
    });
  }, [expenses, timeFilter]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalIncome = filteredExpenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    const totalExpenses = filteredExpenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const netBalance = totalIncome - totalExpenses;
    const transactionCount = filteredExpenses.length;

    return { totalIncome, totalExpenses, netBalance, transactionCount };
  }, [filteredExpenses]);

  // Sort expenses
  const sortedExpenses = useMemo(() => {
    const sorted = [...filteredExpenses];
    
    sorted.sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = parseFloat(a.amount);
          bValue = parseFloat(b.amount);
          break;
        case 'category':
          aValue = a.category?.name || '';
          bValue = b.category?.name || '';
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [filteredExpenses, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setEditFormData({
      categoryId: expense.category?.id || '',
      amount: expense.amount,
      description: expense.description || '',
      notes: expense.notes || '',
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
      type: expense.type,
      paymentMethod: expense.paymentMethod || 'cash',
    });
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setEditFormData(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await onUpdate(editingExpense.id, {
        ...editFormData,
        amount: parseFloat(editFormData.amount),
      });
      setEditingExpense(null);
      setEditFormData(null);
    } catch (error) {
      console.error('Failed to update expense:', error);
      alert('Failed to update transaction');
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      {editingExpense && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Transaction</h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    required
                    value={editFormData.categoryId}
                    onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select category...</option>
                    {categories?.map(cat => (
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
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={editFormData.paymentMethod}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
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
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
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
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                    rows="2"
                  />
                </div>

                <div className="md:col-span-2 flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium text-sm"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Time Period Filters */}
      <div className="flex flex-wrap gap-2">
        {timeFilters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setTimeFilter(filter.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeFilter === filter.id
                ? 'bg-slate-700 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm font-medium text-gray-600">Total Income</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalIncome)}</p>
          <p className="text-xs text-gray-500 mt-1">Money in</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            <p className="text-sm font-medium text-gray-600">Total Expenses</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
          <p className="text-xs text-gray-500 mt-1">Money out</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-600">Net Balance</p>
          </div>
          <p className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(summary.netBalance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Income - Expenses</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium text-gray-600">Transactions</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.transactionCount}</p>
          <p className="text-xs text-gray-500 mt-1">Total count</p>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  onClick={() => handleSort('date')}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Date
                    <SortIcon columnKey="date" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('category')}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Category
                    <SortIcon columnKey="category" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Payment Method
                </th>
                <th 
                  onClick={() => handleSort('type')}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Type
                    <SortIcon columnKey="type" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('amount')}
                  className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-end gap-2">
                    Amount
                    <SortIcon columnKey="amount" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                    No transactions found for the selected period.
                  </td>
                </tr>
              ) : (
                sortedExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(expense.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{expense.category?.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{expense.category?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {expense.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {expense.paymentMethod?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        expense.type === 'income' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {expense.type === 'income' ? '↑ Income' : '↓ Expense'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-semibold ${
                        expense.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-slate-600 hover:text-slate-900 font-medium"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Summary */}
      {sortedExpenses.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-600 px-2">
          <span>Showing {sortedExpenses.length} transaction{sortedExpenses.length !== 1 ? 's' : ''}</span>
          <span>
            Period: <span className="font-medium text-gray-900">{timeFilters.find(f => f.id === timeFilter)?.label}</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;

