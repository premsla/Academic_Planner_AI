import { api } from './api';

// Get all exams for the user
export const fetchExams = async () => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/exams`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch exams');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching exams:', error);
    throw error;
  }
};

// Create a new exam
export const createExam = async (examData) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(examData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create exam');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating exam:', error);
    throw error;
  }
};

// Update an exam
export const updateExam = async (examId, examData) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/exams/${examId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(examData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update exam');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating exam:', error);
    throw error;
  }
};

// Delete an exam
export const deleteExam = async (examId) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/exams/${examId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete exam');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting exam:', error);
    throw error;
  }
};
