const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Logging utility
const log = {
  info: (context, message, data) => console.log(`ℹ️  [${context}] ${message}`, data || ''),
  success: (context, message, data) => console.log(`✅ [${context}] ${message}`, data || ''),
  error: (context, message, data) => console.error(`❌ [${context}] ${message}`, data || ''),
};

// Helper to make authenticated requests
const fetchWithAuth = async (url, options = {}) => {
  // Try 'accessToken' first (used by authService), then 'token' as fallback
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  
  if (!token) {
    console.error('❌ No token found in localStorage');
    console.log('Available keys:', Object.keys(localStorage));
    throw new Error('No authentication token found. Please log in again.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  log.info('API', `${options.method || 'GET'} ${url}`, { hasToken: !!token });

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  return response;
};

// Get all households for the current user
export const getAllHouseholds = async () => {
  log.info('API', 'Getting all households');
  try {
    const response = await fetchWithAuth('/households');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch households');
    }

    log.success('API', 'Households fetched', { count: data.data.length });
    return data.data;
  } catch (error) {
    log.error('API', 'Failed to fetch households', error.message);
    throw error;
  }
};

// Get a single household by ID
export const getHousehold = async (householdId) => {
  log.info('API', `Getting household ${householdId}`);
  try {
    const response = await fetchWithAuth(`/households/${householdId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch household');
    }

    log.success('API', 'Household fetched', { name: data.data.name });
    return data.data;
  } catch (error) {
    log.error('API', 'Failed to fetch household', error.message);
    throw error;
  }
};

// Create a new household
export const createHousehold = async (householdData) => {
  log.info('API', 'Creating household', householdData);
  try {
    const response = await fetchWithAuth('/households', {
      method: 'POST',
      body: JSON.stringify(householdData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create household');
    }

    log.success('API', 'Household created', { name: data.data.name });
    return data.data;
  } catch (error) {
    log.error('API', 'Failed to create household', error.message);
    throw error;
  }
};

// Update a household
export const updateHousehold = async (householdId, householdData) => {
  log.info('API', `Updating household ${householdId}`, householdData);
  try {
    const response = await fetchWithAuth(`/households/${householdId}`, {
      method: 'PUT',
      body: JSON.stringify(householdData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update household');
    }

    log.success('API', 'Household updated', { name: data.data.name });
    return data.data;
  } catch (error) {
    log.error('API', 'Failed to update household', error.message);
    throw error;
  }
};

// Delete a household
export const deleteHousehold = async (householdId) => {
  log.info('API', `Deleting household ${householdId}`);
  try {
    const response = await fetchWithAuth(`/households/${householdId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete household');
    }

    log.success('API', 'Household deleted');
    return data;
  } catch (error) {
    log.error('API', 'Failed to delete household', error.message);
    throw error;
  }
};

// Invite a member to a household
export const inviteMember = async (householdId, inviteData) => {
  log.info('API', `Inviting member to household ${householdId}`, inviteData);
  try {
    const response = await fetchWithAuth(`/households/${householdId}/invite`, {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send invitation');
    }

    log.success('API', 'Invitation sent', { email: inviteData.email });
    return data.data;
  } catch (error) {
    log.error('API', 'Failed to send invitation', error.message);
    throw error;
  }
};

// Accept a household invitation
export const acceptInvitation = async (token) => {
  log.info('API', `Accepting invitation with token`);
  try {
    const response = await fetchWithAuth(`/households/invitations/${token}/accept`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to accept invitation');
    }

    log.success('API', 'Invitation accepted');
    return data.data;
  } catch (error) {
    log.error('API', 'Failed to accept invitation', error.message);
    throw error;
  }
};

// Decline a household invitation
export const declineInvitation = async (token) => {
  log.info('API', `Declining invitation with token`);
  try {
    const response = await fetchWithAuth(`/households/invitations/${token}/decline`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to decline invitation');
    }

    log.success('API', 'Invitation declined');
    return data;
  } catch (error) {
    log.error('API', 'Failed to decline invitation', error.message);
    throw error;
  }
};

// Update a member's role
export const updateMemberRole = async (householdId, memberId, role) => {
  log.info('API', `Updating member ${memberId} role to ${role}`);
  try {
    const response = await fetchWithAuth(`/households/${householdId}/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update member role');
    }

    log.success('API', 'Member role updated');
    return data.data;
  } catch (error) {
    log.error('API', 'Failed to update member role', error.message);
    throw error;
  }
};

// Remove a member from a household
export const removeMember = async (householdId, memberId) => {
  log.info('API', `Removing member ${memberId} from household ${householdId}`);
  try {
    const response = await fetchWithAuth(`/households/${householdId}/members/${memberId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove member');
    }

    log.success('API', 'Member removed');
    return data;
  } catch (error) {
    log.error('API', 'Failed to remove member', error.message);
    throw error;
  }
};

// Leave a household
export const leaveHousehold = async (householdId) => {
  log.info('API', `Leaving household ${householdId}`);
  try {
    const response = await fetchWithAuth(`/households/${householdId}/leave`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to leave household');
    }

    log.success('API', 'Left household');
    return data;
  } catch (error) {
    log.error('API', 'Failed to leave household', error.message);
    throw error;
  }
};

// Switch to a different household
export const switchHousehold = async (householdId) => {
  log.info('API', `Switching to household ${householdId}`);
  try {
    const response = await fetchWithAuth(`/households/${householdId}/switch`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to switch household');
    }

    log.success('API', 'Switched household');
    return data;
  } catch (error) {
    log.error('API', 'Failed to switch household', error.message);
    throw error;
  }
};

