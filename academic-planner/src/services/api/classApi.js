import { api } from './api';

// Get all classes for the user
export const fetchClasses = async () => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/classes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch classes');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
};

// Create a new class
export const createClass = async (classData) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(classData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create class');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
};

// Update a class
export const updateClass = async (classId, classData) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/classes/${classId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(classData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update class');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

// Delete a class
export const deleteClass = async (classId) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/classes/${classId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete class');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
};
