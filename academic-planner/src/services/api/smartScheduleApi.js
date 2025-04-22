import { api } from './api';
import { fetchTasks } from './taskApi';
import { fetchClasses } from './classApi';
import { fetchExams } from './examApi';

// Generate a smart schedule based on real data
export const generateSmartSchedule = async (options = {}) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Set default options
    const {
      days = 30,
      includeClasses = true,
      includeTasks = true,
      includeExams = true,
      optimizeSchedule = true,
      prioritizeExams = true,
      balanceWorkload = true,
      minimumDays = 7,
      adaptToChanges = true
    } = options;

    console.log('Generating personalized smart schedule with options:', {
      days,
      includeClasses,
      includeTasks,
      includeExams,
      optimizeSchedule,
      prioritizeExams,
      balanceWorkload,
      minimumDays,
      adaptToChanges
    });

    // Fetch tasks, exams, and classes to enhance the schedule generation
    let tasks = [];
    let exams = [];
    let classes = [];

    try {
      if (includeTasks) {
        const tasksData = await fetchTasks();
        tasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || []);
        console.log(`Fetched ${tasks.length} tasks for smart schedule generation`);
      }
      
      if (includeExams) {
        const examsData = await fetchExams();
        exams = Array.isArray(examsData) ? examsData : (examsData.exams || []);
        console.log(`Fetched ${exams.length} exams for smart schedule generation`);
      }
      
      if (includeClasses) {
        const classesData = await fetchClasses();
        classes = Array.isArray(classesData) ? classesData : (classesData.classes || []);
        console.log(`Fetched ${classes.length} classes for smart schedule generation`);
      }
    } catch (error) {
      console.warn('Error fetching additional data for schedule generation:', error);
      // Continue with whatever data we have
    }

    // The backend already fetches the data from the database based on the user ID
    console.log('Making API request to:', `${api.baseUrl}/api/smart-schedule/generate`);
    console.log('With token:', token);

    // Add cache-busting parameter to prevent caching
    const cacheBuster = new Date().getTime();
    const response = await fetch(`${api.baseUrl}/api/smart-schedule/generate?_=${cacheBuster}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        days,
        includeClasses,
        includeTasks,
        includeExams,
        optimizeSchedule,
        prioritizeExams,
        balanceWorkload,
        minimumDays,
        adaptToChanges,
        // Include the fetched data to enhance schedule generation
        tasksData: tasks,
        examsData: exams,
        classesData: classes
      })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate smart schedule');
    }

    const data = await response.json();
    console.log('Smart schedule generated:', data);
    return data;
  } catch (error) {
    console.error('Error generating smart schedule:', error);
    throw error;
  }
};

// Fetch AI-suggested study slots
export const fetchSmartSchedule = async () => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    console.log('Fetching smart schedule with token:', token);

    const response = await fetch(`${api.baseUrl}/api/smart-schedule`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Smart schedule response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch smart schedule');
    }

    const data = await response.json();
    console.log('Smart schedule data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching smart schedule:', error);
    throw error;
  }
};

// Confirm a study slot
export const confirmStudySlot = async (slotId) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/smart-schedule/${slotId}/confirm`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to confirm study slot');
    }

    return await response.json();
  } catch (error) {
    console.error('Error confirming study slot:', error);
    throw error;
  }
};

// Mark a study slot as completed
export const completeStudySlot = async (slotId) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/smart-schedule/${slotId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to mark study slot as completed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error completing study slot:', error);
    throw error;
  }
};

// Create a custom study slot
export const createCustomStudySlot = async (slotData) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/smart-schedule/custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(slotData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create custom study slot');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating custom study slot:', error);
    throw error;
  }
};

// Save a new study slot
export const saveStudySlot = async (slotData) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/smart-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(slotData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save study slot');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving study slot:', error);
    throw error;
  }
};

// Get confirmed study slots
export const getConfirmedStudySlots = async () => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/smart-schedule/confirmed`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch confirmed study slots');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching confirmed study slots:', error);
    throw error;
  }
};

// Delete a study slot
export const deleteStudySlot = async (slotId) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/smart-schedule/${slotId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete study slot');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting study slot:', error);
    throw error;
  }
};
