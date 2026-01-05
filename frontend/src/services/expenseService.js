import { fetchWithAuth } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * GET ALL EXPENSES
 */
export const getAllExpenses = async (filters = {}) => {
  const queryParams = new URLSearchParams();

  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  if (filters.type) queryParams.append('type', filters.type);
  if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);

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
 */
export const getAnalytics = async (startDate, endDate) => {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

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
