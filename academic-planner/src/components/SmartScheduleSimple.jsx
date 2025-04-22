import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getSmartScheduleSuggestions,
  generateSmartScheduleThunk,
  confirmStudySlotThunk,
  completeStudySlotThunk,
  deleteStudySlotThunk,
  clearSuccessMessage,
  clearError
} from '../store/slices/smartScheduleSlice';
import { CalendarDays, Clock, BookOpen, CheckCircle, XCircle, AlertCircle, Calendar, List, LayoutGrid } from 'lucide-react';

const SmartScheduleSimple = () => {
  const dispatch = useDispatch();
  const { suggestions, loading, generating, error, successMessage, source } = useSelector(state => state.smartSchedule);
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    console.log('SmartSchedule component mounted, userId:', userId);
    dispatch(getSmartScheduleSuggestions());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        if (successMessage) dispatch(clearSuccessMessage());
        if (error) dispatch(clearError());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  const handleGenerateSchedule = () => {
    console.log('Generating schedule with default options');
    console.log('Auth token:', localStorage.getItem('token'));
    console.log('User ID:', localStorage.getItem('userId'));

    // Call the API with default options (all data types included)
    dispatch(generateSmartScheduleThunk({
      days: 30, // Generate a month's worth of schedule
      includeClasses: true, // Classes are required for scheduling
      includeTasks: true,   // Include tasks by default
      includeExams: true    // Include exams by default
    }))
      .then(result => {
        console.log('Generate schedule result:', result);
      })
      .catch(error => {
        console.error('Generate schedule error:', error);
      });
  };

  const handleConfirm = (slotId) => {
    dispatch(confirmStudySlotThunk(slotId));
  };

  const handleComplete = (slotId) => {
    dispatch(completeStudySlotThunk(slotId));
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <CalendarDays className="mr-2" size={22} />
          Smart Schedule
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateSchedule}
            disabled={generating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            {generating ? 'Generating...' : 'Generate Now'}
          </button>
        </div>
      </div>

      {/* Success and error messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-4">
          <p>{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* View mode selector */}
      {suggestions.length > 0 && (
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-md flex items-center ${viewMode === 'day' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
          >
            <Calendar size={16} className="mr-1" />
            Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-md flex items-center ${viewMode === 'week' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
          >
            <List size={16} className="mr-1" />
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-md flex items-center ${viewMode === 'month' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
          >
            <LayoutGrid size={16} className="mr-1" />
            Month
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-medium">No study slots available</h3>
          <p className="mt-2">The Smart Scheduler uses your actual data to create study plans.</p>
          <p className="mt-1 mb-4">Please add classes in the Classes section to generate study slots. Adding tasks and exams will further enhance your schedule.</p>
          <button
            onClick={handleGenerateSchedule}
            className="mt-3 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors text-sm"
          >
            Generate Schedule
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((slot) => (
            <div 
              key={slot._id || slot.id} 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{slot.title}</h4>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Clock size={14} className="mr-1" />
                    <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                    <span className="mx-2">•</span>
                    <span>{slot.duration} min</span>
                  </div>
                  {slot.notes && (
                    <p className="text-sm text-gray-600 mt-2">{slot.notes}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleConfirm(slot._id)}
                    className="p-1 rounded-full hover:bg-green-100 text-green-600"
                    title="Confirm"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button
                    onClick={() => handleComplete(slot._id)}
                    className="p-1 rounded-full hover:bg-blue-100 text-blue-600"
                    title="Mark as Completed"
                  >
                    <BookOpen size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(slot._id)}
                    className="p-1 rounded-full hover:bg-red-100 text-red-600"
                    title="Delete"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartScheduleSimple;
