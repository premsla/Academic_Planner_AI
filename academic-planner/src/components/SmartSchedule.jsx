import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getSmartScheduleSuggestions,
  generateSmartScheduleThunk,
  confirmStudySlotThunk,
  deleteStudySlotThunk,
  clearSuccessMessage,
  clearError
} from '../store/slices/smartScheduleSlice';
import { getAnalyticsThunk, updateAnalyticsThunk } from '../store/slices/analyticsSlice';
import { fetchTasks, updateTask } from '../services/api/taskApi';
import { fetchExams } from '../services/api/examApi';
import { CalendarDays, Clock, BookOpen, CheckCircle, XCircle, AlertCircle, Calendar, LayoutGrid } from 'lucide-react';

const SmartSchedule = () => {
  const dispatch = useDispatch();
  const { suggestions, loading, generating, error, successMessage, source } = useSelector(state => state.smartSchedule);
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [taskSlots, setTaskSlots] = useState([]);
  const [combinedSlots, setCombinedSlots] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    console.log('SmartSchedule component mounted, userId:', userId);
    dispatch(getSmartScheduleSuggestions());
    
    // Fetch tasks and exams on component mount
    fetchUserTasksAndExams();
  }, [dispatch]);

  // Fetch user tasks and exams
  const fetchUserTasksAndExams = async () => {
    try {
      // Fetch tasks
      const tasksData = await fetchTasks();
      const userTasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || []);
      setTasks(userTasks);
      console.log('Fetched tasks for scheduling:', userTasks);
      
      // Fetch exams
      const examsData = await fetchExams();
      const userExams = Array.isArray(examsData) ? examsData : (examsData.exams || []);
      setExams(userExams);
      console.log('Fetched exams for scheduling:', userExams);
      
      // Convert tasks to study slots
      convertTasksToStudySlots(userTasks);
    } catch (error) {
      console.error('Error fetching tasks and exams:', error);
    }
  };
  
  // Convert tasks to study slots
  const convertTasksToStudySlots = (userTasks) => {
    const incompleteTasks = userTasks.filter(task => 
      !task.completed && !task.isCompleted && task.status !== 'completed'
    );
    
    // Create study slots from tasks
    const newTaskSlots = incompleteTasks.map(task => {
      // Calculate start and end times based on user preferences
      let startDate;
      
      if (task.preferredTime) {
        // Use preferred time if specified
        startDate = new Date(task.preferredTime);
      } else if (task.dueDate) {
        // Use due date, but schedule it earlier to give time for completion
        startDate = new Date(task.dueDate);
        // Schedule 2 days before due date if possible
        startDate.setDate(startDate.getDate() - 2);
        
        // If that would be in the past, use tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (startDate < new Date()) {
          startDate = tomorrow;
        }
        
        // Set to a reasonable hour (9 AM to 5 PM)
        const hour = 9 + Math.floor(Math.random() * 8); // Random hour between 9 AM and 5 PM
        startDate.setHours(hour, 0, 0);
      } else {
        // No due date or preferred time, schedule for tomorrow
        startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        
        // Set to a reasonable hour (9 AM to 5 PM)
        const hour = 9 + Math.floor(Math.random() * 8); // Random hour between 9 AM and 5 PM
        startDate.setHours(hour, 0, 0);
      }
      
      // Calculate duration based on task complexity or estimated time
      let duration = 60; // Default 60 minutes
      if (task.estimatedTime) {
        duration = task.estimatedTime;
      } else if (task.complexity) {
        // Estimate duration based on complexity (1-5)
        const complexity = parseInt(task.complexity) || 1;
        duration = complexity * 30; // 30 minutes per complexity point
      }
      
      // Calculate end time
      const endDate = new Date(startDate.getTime());
      endDate.setMinutes(endDate.getMinutes() + duration);
      
      return {
        _id: `task-${task._id}`,
        taskId: task._id,
        title: task.title,
        description: task.description || '',
        subject: task.subject || task.category || 'General',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        duration: duration,
        priority: task.priority || 'Medium',
        isTaskSlot: true, // Mark as a task-generated slot
        taskData: task // Include original task data
      };
    });
    
    setTaskSlots(newTaskSlots);
    console.log('Created study slots from tasks:', newTaskSlots);
  };
  
  // Combine AI-generated slots with task-based slots
  useEffect(() => {
    const allSlots = [...suggestions, ...taskSlots];
    // Sort by date and priority
    allSlots.sort((a, b) => {
      // First sort by date
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      
      // Then by priority (High > Medium > Low)
      const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
      const priorityA = priorityOrder[a.priority] || 1;
      const priorityB = priorityOrder[b.priority] || 1;
      return priorityA - priorityB;
    });
    
    setCombinedSlots(allSlots);
  }, [suggestions, taskSlots]);
  
  const handleGenerateSchedule = () => {
    console.log('Generating personalized schedule');
    console.log('Auth token:', localStorage.getItem('token'));
    console.log('User ID:', localStorage.getItem('userId'));

    // Force a refresh of the page to ensure we get fresh data
    console.log('Forcing a refresh of the data');

    // Refresh tasks and exams before generating schedule
    fetchUserTasksAndExams();

    // Clear existing study slots first
    dispatch({ type: 'smartSchedule/clearSuggestions' });

    // Show a loading state
    dispatch({ type: 'smartSchedule/setGenerating', payload: true });

    // Call the API with optimized options for personalized scheduling
    dispatch(generateSmartScheduleThunk({
      days: 30, // Generate a month's worth of schedule for better planning
      includeClasses: true, // Classes are required for scheduling
      includeTasks: true,   // Include tasks for optimal scheduling
      includeExams: true,   // Include exams for priority scheduling
      optimizeSchedule: true, // Request optimized scheduling
      prioritizeExams: true,  // Prioritize exam preparation
      balanceWorkload: true,  // Balance daily workload
      minimumDays: 7,        // Ensure at least a week of planning
      adaptToChanges: true,   // Adapt to changes in tasks and exams
      tasksData: tasks,       // Pass tasks directly to the scheduler
      examsData: exams        // Pass exams directly to the scheduler
    }))
      .then(result => {
        console.log('Generate personalized schedule result:', result);

        // If we have suggestions from the API, automatically switch to day view
        if (result?.payload?.studySlots?.length > 0) {
          setViewMode('day');

          // Show success message
          dispatch({
            type: 'smartSchedule/setSuccessMessage',
            payload: "Your personalized study plan has been created! We've optimized your schedule based on your classes, exams, and tasks."
          });
        } else {
          // If no suggestions from API, show a message to add classes
          dispatch({
            type: 'smartSchedule/setError',
            payload: "No data available to generate a study plan. Please add your classes in the Classes section."
          });
        }

        // Set generating to false
        dispatch({ type: 'smartSchedule/setGenerating', payload: false });
      })
      .catch(error => {
        console.error('Generate schedule error:', error);

        // Show error message
        dispatch({
          type: 'smartSchedule/setError',
          payload: error.message || "Failed to generate study schedule. Please try again later."
        });

        // Set generating to false
        dispatch({ type: 'smartSchedule/setGenerating', payload: false });
      });
  };

  // Handle confirming a study slot or completing a task
  const handleConfirm = (slotId) => {
    // Check if this is a task-based slot
    const isTaskSlot = slotId.toString().startsWith('task-');
    
    if (isTaskSlot) {
      // Extract the actual task ID
      const taskId = slotId.replace('task-', '');
      console.log('Completing task:', taskId);
      
      // Update the task status to completed
      handleCompleteTask(taskId);
    } else {
      // Regular study slot confirmation
      dispatch(confirmStudySlotThunk(slotId)).then((action) => {
        // Only refresh analytics if confirmation was successful
        if (!action.error) {
          // Generate analytics first to ensure data is up-to-date
          dispatch(updateAnalyticsThunk())
            .then(() => {
              // Then fetch the updated analytics
              dispatch(getAnalyticsThunk());
            })
            .catch(error => {
              console.error("Error updating analytics:", error);
              // Even if update fails, try to fetch the latest analytics
              dispatch(getAnalyticsThunk());
            });
        }
      });
    }
  };
  
  // Handle completing a task
  const handleCompleteTask = async (taskId) => {
    try {
      console.log('Updating task status to completed:', taskId);
      
      // Update the task status to completed
      await updateTask(taskId, { 
        status: 'completed',
        completed: true,
        isCompleted: true,
        completedAt: new Date().toISOString()
      });
      
      // Show success message
      dispatch({
        type: 'smartSchedule/setSuccessMessage',
        payload: "Task marked as completed successfully!"
      });
      
      // Update the task slots
      setTaskSlots(prevTaskSlots => 
        prevTaskSlots.map(slot => 
          slot.taskId === taskId 
            ? { ...slot, confirmed: true, completed: true, status: 'completed' } 
            : slot
        )
      );
      
      // Refresh tasks to get the updated list
      fetchUserTasksAndExams();
      
      // Update analytics
      dispatch(updateAnalyticsThunk())
        .then(() => {
          dispatch(getAnalyticsThunk());
        })
        .catch(error => {
          console.error("Error updating analytics after task completion:", error);
          dispatch(getAnalyticsThunk());
        });
    } catch (error) {
      console.error('Error completing task:', error);
      
      // Show error message
      dispatch({
        type: 'smartSchedule/setError',
        payload: "Failed to complete task. Please try again."
      });
    }
  };

  const handleDelete = (slotId) => {
    if (window.confirm('Are you sure you want to delete this study slot?')) {
      dispatch(deleteStudySlotThunk(slotId));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group slots by day
  const groupByDay = (slots) => {
    // Use combined slots instead of just suggestions
    const slotsToGroup = slots || combinedSlots;
    
    if (!slotsToGroup || slotsToGroup.length === 0) {
      return [];
    }

    const grouped = {};
    const now = new Date();

    // Create entries for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      grouped[dateKey] = [];
    }

    // Assign slots to their respective days
    slotsToGroup.forEach(slot => {
      const date = new Date(slot.startTime);
      const dateKey = date.toISOString().split('T')[0];

      // Only include if it's within the next 7 days
      const slotDay = new Date(dateKey);
      const daysDiff = Math.floor((slotDay - now) / (1000 * 60 * 60 * 24));

      if (daysDiff >= 0 && daysDiff < 7) {
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(slot);
      }
    });

    // Sort by date and format for display
    return Object.keys(grouped)
      .sort()
      .map(dateKey => {
        const date = new Date(dateKey);
        return {
          date: dateKey,
          formattedDate: date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
          }),
          dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayOfMonth: date.getDate(),
          slots: grouped[dateKey].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        };
      });
  };

  // Group slots by week
  const groupByWeek = (slots) => {
    // Use combined slots instead of just suggestions
    const slotsToGroup = slots || combinedSlots;
    
    if (!slotsToGroup || slotsToGroup.length === 0) {
      return [];
    }

    const grouped = {};
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Find the start of the current week (Sunday)
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - currentDay);
    currentWeekStart.setHours(0, 0, 0, 0);

    // Create entries for the next 4 weeks
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() + (i * 7));
      const weekKey = weekStart.toISOString().split('T')[0];
      grouped[weekKey] = [];
    }

    // Assign slots to their respective weeks
    slotsToGroup.forEach(slot => {
      const slotDate = new Date(slot.startTime);
      const slotDay = slotDate.getDay();
      const weekStart = new Date(slotDate);
      weekStart.setDate(slotDate.getDate() - slotDay);
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];

      // Only include if it's within the next 4 weeks
      const weeksDiff = Math.floor((weekStart - currentWeekStart) / (7 * 24 * 60 * 60 * 1000));

      if (weeksDiff >= 0 && weeksDiff < 4) {
        if (!grouped[weekKey]) {
          grouped[weekKey] = [];
        }
        grouped[weekKey].push(slot);
      }
    });

    // Sort by week and format for display
    return Object.keys(grouped)
      .sort()
      .map(weekKey => {
        const weekStart = new Date(weekKey);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        return {
          weekStart: weekKey,
          formattedWeek: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          weekNumber: Math.ceil((weekStart.getDate() + 6 - weekStart.getDay()) / 7),
          slots: grouped[weekKey].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        };
      });
  };

  // Group slots by month
  const groupByMonth = (slots) => {
    // Use combined slots instead of just suggestions
    const slotsToGroup = slots || combinedSlots;
    
    if (!slotsToGroup || slotsToGroup.length === 0) {
      return [];
    }

    const grouped = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Create entries for the current and next month
    for (let i = 0; i < 2; i++) {
      const month = (currentMonth + i) % 12;
      const year = currentYear + Math.floor((currentMonth + i) / 12);
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      grouped[monthKey] = [];
    }

    // Assign slots to their respective months
    slotsToGroup.forEach(slot => {
      const date = new Date(slot.startTime);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

      // Only include if it's within the current or next month
      if ((year === currentYear && month === currentMonth) ||
          (year === currentYear && month === (currentMonth + 1) % 12) ||
          (year === currentYear + 1 && month === 0 && currentMonth === 11)) {
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(slot);
      }
    });

    // Sort by month and format for display
    return Object.keys(grouped)
      .sort()
      .map(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        const monthDate = new Date(year, month - 1, 1);

        return {
          month: monthKey,
          formattedMonth: monthDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          }),
          monthName: monthDate.toLocaleDateString('en-US', { month: 'long' }),
          year: year,
          slots: grouped[monthKey].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        };
      });
  };

  // Generate calendar days for a month
  const getCalendarDays = (year, month, options = {}) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
    const weekStart = options.weekStart || 0; // 0 = Sunday, 1 = Monday

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < (startingDayOfWeek - weekStart + 7) % 7; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }

    // Add days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }
    // Fill out the rest of the week so the last row always has 7 days
    while (days.length % 7 !== 0) {
      days.push({ day: null, isCurrentMonth: false });
    }
    return days;
  };

  // Check for duplicates
  const checkForDuplicates = (slots) => {
    const seen = new Set();
    const duplicates = [];

    slots.forEach(slot => {
      const id = slot._id || slot.taskId;
      if (seen.has(id)) {
        duplicates.push(id);
      } else {
        seen.add(id);
      }
    });

    return duplicates;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <CalendarDays className="mr-2" size={22} style={{ color: '#1565d8' }} />
          Smart Schedule
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateSchedule}
            disabled={generating}
            className="inline-flex items-center border border-transparent font-medium rounded-md shadow-sm text-white focus:outline-none transition-all duration-200 ease-in-out hover:bg-blue-700"
            style={{
              background: generating ? '#b0b6c1' : '#1565d8',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 14,
              boxShadow: '0 2px 4px rgba(21, 101, 216, 0.15)',
              cursor: generating ? 'not-allowed' : 'pointer'
            }}
          >
            {generating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Generate Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* View Mode Selector */}
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', borderRadius: 16, padding: 4, background: '#e3edfa', boxShadow: '0 2px 8px rgba(21,101,216,0.07)' }}>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              style={{
                borderRadius: 12,
                fontWeight: 600,
                background: viewMode === 'day' ? '#1565d8' : 'transparent',
                color: viewMode === 'day' ? '#fff' : '#1565d8',
                transition: 'all 0.2s ease',
                padding: '10px 24px',
                border: 'none',
                boxShadow: viewMode === 'day' ? '0 2px 8px rgba(21, 101, 216, 0.2)' : 'none',
                marginRight: 8,
                fontSize: 16,
                letterSpacing: 1,
                cursor: 'pointer',
              }}
            >
              <CalendarDays size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              By Day
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              style={{
                borderRadius: 12,
                fontWeight: 600,
                background: viewMode === 'week' ? '#1565d8' : 'transparent',
                color: viewMode === 'week' ? '#fff' : '#1565d8',
                transition: 'all 0.2s ease',
                padding: '10px 24px',
                border: 'none',
                boxShadow: viewMode === 'week' ? '0 2px 8px rgba(21, 101, 216, 0.2)' : 'none',
                marginRight: 8,
                fontSize: 16,
                letterSpacing: 1,
                cursor: 'pointer',
              }}
            >
              <Calendar size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              By Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              style={{
                borderRadius: 12,
                fontWeight: 600,
                background: viewMode === 'month' ? '#1565d8' : 'transparent',
                color: viewMode === 'month' ? '#fff' : '#1565d8',
                transition: 'all 0.2s ease',
                padding: '10px 24px',
                border: 'none',
                boxShadow: viewMode === 'month' ? '0 2px 8px rgba(21, 101, 216, 0.2)' : 'none',
                fontSize: 16,
                letterSpacing: 1,
                cursor: 'pointer',
              }}
            >
              <LayoutGrid size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              By Month
            </button>
          </div>
        </div>
      )}

      {source && (
        <div className="mb-4 text-sm p-3 rounded" style={{ background: 'rgba(21, 101, 216, 0.08)', borderLeft: '3px solid #1565d8', color: '#444' }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1565d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Generated using: <span style={{ fontWeight: 600, marginLeft: 5 }}>{source}</span>
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 mb-4 rounded-lg" style={{ background: '#fff3f5', border: '1px solid #ffccd5', borderLeft: '4px solid #dc3545', boxShadow: '0 2px 8px rgba(220, 53, 69, 0.1)', borderRadius: 12 }}>
          <div className="flex items-center">
            <AlertCircle style={{ color: '#dc3545' }} className="mr-3" size={22} />
            <p style={{ color: '#dc3545', fontWeight: 500 }}>{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 mb-4 rounded-lg" style={{ background: '#f1f9f7', border: '1px solid #d1e7dd', borderLeft: '4px solid #28a745', boxShadow: '0 2px 8px rgba(40, 167, 69, 0.1)', borderRadius: 12 }}>
          <div className="flex items-center">
            <CheckCircle style={{ color: '#28a745' }} className="mr-3" size={22} />
            <p style={{ color: '#28a745', fontWeight: 500 }}>{successMessage}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col justify-center items-center h-60" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200" style={{ borderTopColor: '#1565d8', borderRadius: '50%' }}></div>
          <p style={{ color: '#666', marginTop: 16, fontWeight: 500 }}>Loading your schedule...</p>
        </div>
      ) : combinedSlots.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: '40px 20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(21, 101, 216, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <BookOpen style={{ color: '#1565d8' }} size={36} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: '#333', marginBottom: 8 }}>No study slots available</h3>
          <p style={{ color: '#666', fontSize: 15, maxWidth: 500, margin: '0 auto 8px auto', lineHeight: 1.5 }}>The Smart Scheduler uses your actual data to create study plans.</p>
          <p style={{ color: '#666', fontSize: 15, maxWidth: 500, margin: '0 auto 24px auto', lineHeight: 1.5 }}>Please add classes in the Classes section to generate study slots. Adding tasks and exams will further enhance your schedule.</p>
          <button
            onClick={handleGenerateSchedule}
            disabled={generating}
            style={{
              background: generating ? '#b0b6c1' : '#1565d8',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 16,
              border: 'none',
              boxShadow: '0 4px 12px rgba(21, 101, 216, 0.2)',
              cursor: generating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {generating ? 'Generating...' : 'Generate Now'}
          </button>
        </div>
      ) : viewMode === 'day' ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 16, borderBottom: '2px solid #1565d8', marginBottom: 16 }}>
            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day, idx) => (
              <div key={day} style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, color: '#1565d8', paddingBottom: 8, borderBottom: '3px solid #1565d8', background: '#e6f0ff', borderTopLeftRadius: idx === 0 ? 12 : 0, borderTopRightRadius: idx === 6 ? 12 : 0 }}>
                {day}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 16 }}>
            {(() => {
              // Map each day of week to its slots
              const daysOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
              const today = new Date();
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay());
              const weekDays = Array.from({length: 7}, (_, i) => {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                return d;
              });
              const grouped = groupByDay(combinedSlots);
              return weekDays.map((dateObj, idx) => {
                const dateKey = dateObj.toISOString().split('T')[0];
                const dayData = grouped.find(d => d.date === dateKey);
                return (
                  <div key={dateKey} style={{ minHeight: 120, background: '#f8fafc', borderRadius: 10, border: '1px solid #e0e7ef', padding: 8 }}>
                    <div style={{ textAlign: 'center', color: '#1565d8', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{dateObj.getDate()} {dateObj.toLocaleDateString('en-US', { month: 'short' })}</div>
                    {dayData && dayData.slots.length > 0 ? (
                      dayData.slots.map(slot => (
                        <div key={slot._id || slot.taskId} style={{ background: '#e0edfa', border: '1.5px solid #1565d8', borderRadius: 8, marginBottom: 8, padding: 8, boxShadow: '0 2px 6px rgba(21,101,216,0.05)' }}>
                          <div style={{ fontWeight: 600, color: '#1565d8', fontSize: 14 }}>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</div>
                          <div style={{ fontWeight: 500, color: '#222', fontSize: 15, margin: '4px 0' }}>
                            {slot.isTaskSlot ? '📋 ' : ''}{slot.title}
                          </div>
                          <div style={{ fontSize: 13, color: '#3b82f6' }}>Duration: {slot.duration} min</div>
                          {slot.priority && (
                            <span style={{ display: 'inline-block', background: '#dbeafe', color: '#1e40af', borderRadius: 6, fontWeight: 600, fontSize: 12, padding: '2px 8px', marginTop: 2 }}>Priority: {slot.priority}</span>
                          )}
                          <button
                            onClick={() => handleConfirm(slot._id || slot.taskId)}
                            disabled={slot.confirmed}
                            style={{
                              marginTop: 8,
                              background: slot.confirmed ? '#b3d7fa' : slot.isTaskSlot ? '#16a34a' : 'linear-gradient(90deg,#43b2fc,#1565d8)',
                              color: '#fff',
                              fontWeight: 700,
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 18px',
                              fontSize: 14,
                              cursor: slot.confirmed ? 'not-allowed' : 'pointer',
                              boxShadow: '0 2px 8px #e6f6ff',
                              transition: 'background 0.18s',
                              opacity: slot.confirmed ? 0.7 : 1
                            }}
                          >
                            {slot.confirmed ? 'Confirmed' : (slot.isTaskSlot ? 'Complete Task' : 'Confirm')}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 12 }}>No tasks</div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : viewMode === 'week' ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 16, borderBottom: '2px solid #6366f1', marginBottom: 16 }}>
            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day, idx) => (
              <div key={day} style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, color: '#6366f1', paddingBottom: 8, borderBottom: '3px solid #6366f1', background: '#eef4ff', borderTopLeftRadius: idx === 0 ? 12 : 0, borderTopRightRadius: idx === 6 ? 12 : 0 }}>
                {day}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 16 }}>
            {(() => {
              const daysOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
              const today = new Date();
              const startOfWeek = new Date(today);
              startOfWeek.setHours(0, 0, 0, 0);
              startOfWeek.setDate(today.getDate() - today.getDay());
              const weekDays = Array.from({length: 7}, (_, i) => {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                return d;
              });
              // Robust fix: find the week group whose start date matches the startOfWeek (ignoring timezones)
              const weekGroups = groupByWeek(combinedSlots);
              const weekStartStr = startOfWeek.toISOString().split('T')[0];
              let grouped = weekGroups.find(w => w.weekStart === weekStartStr);
              if (!grouped && weekGroups.length > 0) {
                // fallback: find group with same date regardless of time
                grouped = weekGroups.find(w => new Date(w.weekStart).getTime() === startOfWeek.getTime());
              }
              if (!grouped && weekGroups.length > 0) {
                // fallback: just use the first group
                grouped = weekGroups[0];
              }
              const slots = grouped ? grouped.slots : [];
              return weekDays.map((dateObj, idx) => {
                const dateKey = dateObj.toISOString().split('T')[0];
                const daySlots = slots.filter(slot => {
                  const slotDate = new Date(slot.startTime);
                  return slotDate.toISOString().split('T')[0] === dateKey;
                });
                return (
                  <div key={dateKey} style={{ minHeight: 120, background: '#f8fafc', borderRadius: 10, border: '1px solid #e0e7ef', padding: 8 }}>
                    <div style={{ textAlign: 'center', color: '#6366f1', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{dateObj.getDate()} {dateObj.toLocaleDateString('en-US', { month: 'short' })}</div>
                    {daySlots && daySlots.length > 0 ? (
                      daySlots.map(slot => (
                        <div key={slot._id || slot.taskId} style={{ background: '#e0edfa', border: '1.5px solid #6366f1', borderRadius: 8, marginBottom: 8, padding: 8, boxShadow: '0 2px 6px rgba(99,102,241,0.05)' }}>
                          <div style={{ fontWeight: 600, color: '#6366f1', fontSize: 14 }}>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</div>
                          <div style={{ fontWeight: 500, color: '#222', fontSize: 15, margin: '4px 0' }}>
                            {slot.isTaskSlot ? '📋 ' : ''}{slot.title}
                          </div>
                          <div style={{ fontSize: 13, color: '#3b82f6' }}>Duration: {slot.duration} min</div>
                          {slot.priority && (
                            <span style={{ display: 'inline-block', background: '#dbeafe', color: '#1e40af', borderRadius: 6, fontWeight: 600, fontSize: 12, padding: '2px 8px', marginTop: 2 }}>Priority: {slot.priority}</span>
                          )}
                          <button
                            onClick={() => handleConfirm(slot._id || slot.taskId)}
                            disabled={slot.confirmed}
                            style={{
                              marginTop: 8,
                              background: slot.confirmed ? '#b3d7fa' : slot.isTaskSlot ? '#16a34a' : 'linear-gradient(90deg,#43b2fc,#6366f1)',
                              color: '#fff',
                              fontWeight: 700,
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 18px',
                              fontSize: 14,
                              cursor: slot.confirmed ? 'not-allowed' : 'pointer',
                              boxShadow: '0 2px 8px #e6f6ff',
                              transition: 'background 0.18s',
                              opacity: slot.confirmed ? 0.7 : 1
                            }}
                          >
                            {slot.confirmed ? 'Confirmed' : (slot.isTaskSlot ? 'Complete Task' : 'Confirm')}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 12 }}>No tasks</div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginTop: 24 }}>
          {(() => {
            const now = new Date();
            const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const month = groupByMonth(combinedSlots).find(m => m.month === currentMonthKey);
            if (!month) return <div style={{ color: '#a1a1aa', fontSize: 16, textAlign: 'center' }}>No tasks for this month</div>;
            const [year, monthNum] = month.month.split('-').map(Number);
            // Get calendar days for this month, starting on Monday
            const calendarDays = getCalendarDays(year, monthNum - 1, { weekStart: 1 });
            return (
              <div key={month.month} style={{ marginBottom: 40 }}>
                <div style={{ background: '#e3edfa', padding: '12px 24px', borderRadius: 8, marginBottom: 16, border: '1px solid #1565d8' }}>
                  <h3 style={{ fontWeight: 700, fontSize: 18, color: '#1565d8', margin: 0 }}>{month.formattedMonth}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                    <div key={day} style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#1565d8', paddingBottom: 6, borderBottom: '2px solid #1565d8', background: '#e3edfa', borderTopLeftRadius: idx === 0 ? 8 : 0, borderTopRightRadius: idx === 6 ? 8 : 0 }}>{day}</div>
                  ))}
                  {calendarDays.map((dayInfo, index) => {
                    if (!dayInfo.isCurrentMonth) {
                      return <div key={`empty-${index}`} style={{ background: '#f3f4f6', minHeight: 80, borderRadius: 6 }}></div>;
                    }
                    const dateKey = dayInfo.date.toISOString().split('T')[0];
                    const daySlots = month.slots.filter(slot => {
                      const slotDate = new Date(slot.startTime);
                      return slotDate.toISOString().split('T')[0] === dateKey;
                    });
                    return (
                      <div key={dateKey} style={{ minHeight: 80, background: '#f8fafc', borderRadius: 8, border: '1px solid #e0e7ef', padding: 6 }}>
                        <div style={{ textAlign: 'right', color: '#1565d8', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{dayInfo.day}</div>
                        {daySlots.length > 0 ? (
                          daySlots.map(slot => (
                            <div key={slot._id || slot.taskId} style={{ background: '#e3edfa', border: '1.5px solid #1565d8', borderRadius: 6, marginBottom: 6, padding: 6, boxShadow: '0 1px 4px rgba(21,101,216,0.05)' }}>
                              <div style={{ fontWeight: 600, color: '#1565d8', fontSize: 13 }}>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</div>
                              <div style={{ fontWeight: 500, color: '#222', fontSize: 14, margin: '2px 0' }}>
                                {slot.isTaskSlot ? '📋 ' : ''}{slot.title}
                              </div>
                              <div style={{ fontSize: 12, color: '#1565d8' }}>Duration: {slot.duration} min</div>
                              {slot.priority && (
                                <span style={{ display: 'inline-block', background: '#dbeafe', color: '#1565d8', borderRadius: 6, fontWeight: 600, fontSize: 11, padding: '2px 6px', marginTop: 2 }}>Priority: {slot.priority}</span>
                              )}
                              <button
                                onClick={() => handleConfirm(slot._id || slot.taskId)}
                                disabled={slot.confirmed}
                                style={{
                                  marginTop: 8,
                                  background: slot.confirmed ? '#b3d7fa' : slot.isTaskSlot ? '#16a34a' : 'linear-gradient(90deg,#43b2fc,#1565d8)',
                                  color: '#fff',
                                  fontWeight: 700,
                                  border: 'none',
                                  borderRadius: 8,
                                  padding: '6px 18px',
                                  fontSize: 14,
                                  cursor: slot.confirmed ? 'not-allowed' : 'pointer',
                                  boxShadow: '0 2px 8px #e6f6ff',
                                  transition: 'background 0.18s',
                                  opacity: slot.confirmed ? 0.7 : 1
                                }}
                              >
                                {slot.confirmed ? 'Confirmed' : (slot.isTaskSlot ? 'Complete Task' : 'Confirm')}
                              </button>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: '#a1a1aa', fontSize: 12, textAlign: 'center', marginTop: 6 }}>No tasks</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default SmartSchedule;
