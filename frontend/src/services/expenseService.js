import { fetchWithAuth } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * GET ALL EXPENSES
 * @param {object} filters - Filter options
 * @param {string} filters.startDate - Start date filter
 * @param {string} filters.endDate - End date filter
 * @param {string} filters.type - Type filter (expense/income)
 * @param {string} filters.categoryId - Category filter
 * @param {string} filters.includeDeleted - Include deleted expenses
 * @param {boolean} filters.personal - Get only user's personal expenses
 * @param {string} filters.householdId - Get expenses for a specific household
 */
export const getAllExpenses = async (filters = {}) => {
  const queryParams = new URLSearchParams();

  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  if (filters.type) queryParams.append('type', filters.type);
  if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
  if (filters.includeDeleted) queryParams.append('includeDeleted', filters.includeDeleted);
  if (filters.personal) queryParams.append('personal', 'true');
  if (filters.householdId) queryParams.append('householdId', filters.householdId);

  const queryString = queryParams.toString();
  const url = `/expenses${queryString ? `?${queryString}` : ''}`;

  const response = await fetchWithAuth(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch expenses');
  }

  return data.data;
};

/**
 * GET SINGLE EXPENSE
 */
export const getExpense = async (id) => {
  const response = await fetchWithAuth(`/expenses/${id}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch expense');
  }

  return data.data;
};

/**
 * CREATE EXPENSE
 */
export const createExpense = async (expenseData) => {
  const response = await fetchWithAuth('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create expense');
  }

  return data.data;
};

/**
 * UPDATE EXPENSE
 */
export const updateExpense = async (id, expenseData) => {
  const response = await fetchWithAuth(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(expenseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update expense');
  }

  return data.data;
};

/**
 * UPDATE USER SETTINGS
 */
export const updateUserSettings = async (settings) => {
  const response = await fetchWithAuth('/auth/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update settings');
  }

  return data.data;
};

/**
 * DELETE EXPENSE
 */
export const deleteExpense = async (id) => {
  const response = await fetchWithAuth(`/expenses/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete expense');
  }

  return data;
};

/**
 * GET ANALYTICS
 * @param {object} options - Options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {boolean} options.personal - Get only personal analytics
 * @param {string} options.householdId - Get analytics for a specific household
 */
export const getAnalytics = async (options = {}) => {
  const queryParams = new URLSearchParams();
  if (options.startDate) queryParams.append('startDate', options.startDate);
  if (options.endDate) queryParams.append('endDate', options.endDate);
  if (options.personal) queryParams.append('personal', 'true');
  if (options.householdId) queryParams.append('householdId', options.householdId);

  const queryString = queryParams.toString();
  const url = `/expenses/analytics${queryString ? `?${queryString}` : ''}`;

  const response = await fetchWithAuth(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch analytics');
  }

  return data.data;
};

/**
 * GET ALL CATEGORIES
 */
export const getAllCategories = async () => {
  const response = await fetchWithAuth('/categories');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch categories');
  }

  return data.data;
};

/**
 * CREATE CATEGORY
 */
export const createCategory = async (categoryData) => {
  const response = await fetchWithAuth('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create category');
  }

  return data.data;
};

export default {
  getAllExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getAnalytics,
  getAllCategories,
  createCategory,
};
