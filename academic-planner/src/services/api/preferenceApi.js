import { api } from './api';

// Fetch user preferences
export const fetchUserPreferences = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${api.baseUrl}/api/preferences`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch user preferences');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
};

// Update user preferences
export const updateUserPreferences = async (preferencesData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${api.baseUrl}/api/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(preferencesData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update preferences');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};

// Add a subject preference
export const addSubjectPreference = async (subjectData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${api.baseUrl}/api/preferences/subject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subjectData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add subject preference');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding subject preference:', error);
    throw error;
  }
};
