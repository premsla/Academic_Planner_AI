import React, { useState } from 'react';
import DashboardLogout from './DashboardLogout';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { LayoutDashboard, CalendarDays, Clipboard, GraduationCap, BookOpen, Plus, X, Clock, CheckCircle2, Bell, MoreVertical, Trash2, Edit, Calendar, User, LogOut, ListTodo, Timer } from 'lucide-react';
import SmartSchedule from './SmartSchedule';
import TipsCard from './TipsCard';
import Analytics from './Analytics';
import Insights from './Insights';
import MonthCalendar from './MonthCalendar';
import YearCalendar from './YearCalendar';

const addMenuOptions = [
  { label: 'Task', icon: (
    <svg width="24" height="24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
  ) },
  { label: 'Class', icon: (
    <svg width="24" height="24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12"/><path d="M16 10h2v6H6v-6h2"/><circle cx="12" cy="14" r="2"/></svg>
  ) },
  { label: 'Exam', icon: (
    <svg width="24" height="24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 2v4M16 2v4M4 10h16"/></svg>
  ) },
];

const Dashboard = ({ initialSection = 'Dashboard' }) => {
  // Store all tasks
  const [tasks, setTasks] = useState([]);
  // Loading state for tasks
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState(null);

  // Store all classes
  const [classes, setClasses] = useState([]);
  // Loading state for classes
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classError, setClassError] = useState(null);

  // Store all exams
  const [exams, setExams] = useState([]);
  // Loading state for exams
  const [loadingExams, setLoadingExams] = useState(true);
  const [examError, setExamError] = useState(null);

  // Current time and date state
  const [currentTime, setCurrentTime] = useState(format(new Date(), 'HH:mm'));
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'EEEE, MMMM d, yyyy'));

  // Update time every minute
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(format(now, 'HH:mm'));
      setCurrentDate(format(now, 'EEEE, MMMM d, yyyy'));
    };
    
    // Update immediately
    updateTime();
    
    // Set interval to update every minute
    const interval = setInterval(updateTime, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Fetch tasks from backend on mount
  React.useEffect(() => {
    const fetchTasks = async () => {
      setLoadingTasks(true);
      setTaskError(null);
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
        console.log("Token in request:", token);
        const res = await fetch('http://localhost:5000/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : data.tasks || []);
      } catch (err) {
        setTaskError('Could not load tasks.');
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, []);

  // Fetch classes from backend on mount
  React.useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      setClassError(null);
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
        const res = await fetch('http://localhost:5000/api/classes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch classes');
        const data = await res.json();
        setClasses(Array.isArray(data) ? data : data.classes || []);
      } catch (err) {
        setClassError('Could not load classes.');
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch exams from backend on mount
  React.useEffect(() => {
    const fetchExams = async () => {
      setLoadingExams(true);
      setExamError(null);
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
        const res = await fetch('http://localhost:5000/api/exams', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch exams');
        const data = await res.json();
        setExams(Array.isArray(data) ? data : data.exams || []);
      } catch (err) {
        setExamError('Could not load exams.');
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
  }, []);

  // --- Edit & Delete State ---
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({ title: '', subject: '', description: '', dueDate: '', priority: 'Medium', duration: 0 });

  // --- Edit Handlers ---
  const handleEditTask = (task) => {
    setEditTaskId(task._id || task.id);
    setEditTaskForm({
      title: task.title || '',
      subject: task.subject || '',
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0,16) : '',
      priority: task.priority || 'Medium',
      duration: task.duration || 0
    });
  };
  const handleEditTaskChange = (e) => {
    const { name, value } = e.target;
    setEditTaskForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditTaskCancel = () => {
    setEditTaskId(null);
    setEditTaskForm({ title: '', subject: '', description: '', dueDate: '', priority: 'Medium', duration: 0 });
  };
  const handleEditTaskSave = async (e) => {
    e.preventDefault();
    if (!editTaskForm.title || !editTaskForm.subject || !editTaskForm.dueDate) {
      setTaskError('Title, subject, and due date are required.');
      return;
    }
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
      const res = await fetch(`http://localhost:5000/api/tasks/${editTaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...editTaskForm, duration: Number(editTaskForm.duration) })
      });
      if (!res.ok) throw new Error('Failed to update task');
      const updated = (await res.json()).task;
      setTasks(prev => prev.map(t => (t._id === updated._id || t.id === updated._id) ? updated : t));
      setEditTaskId(null);
      setEditTaskForm({ title: '', subject: '', description: '', dueDate: '', priority: 'Medium', duration: 0 });
    } catch (err) {
      setTaskError('Could not update task.');
    }
  };

  // --- Delete Handler ---
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete task');
      setTasks(prev => prev.filter(t => (t._id || t.id) !== taskId));
    } catch (err) {
      setTaskError('Could not delete task.');
    }
  };

  // --- Class Handlers ---
  const [classForm, setClassForm] = useState({
    subject: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    repeat_weekly: false,
    location: ''
  });
  const handleClassChange = (e) => {
    const { name, value, type, checked } = e.target;
    setClassForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  const handleClassSave = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!classForm.subject || !classForm.day_of_week || !classForm.start_time || !classForm.end_time) {
      alert('Subject, day, start time, and end time are required.');
      return;
    }
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
      const res = await fetch('http://localhost:5000/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(classForm),
      });
      if (!res.ok) throw new Error('Failed to create class');
      const created = (await res.json()).class;
      setClasses(prev => [created, ...prev]);
      setShowClassModal(false);
      setClassForm({ subject: '', day_of_week: '', start_time: '', end_time: '', repeat_weekly: false, location: '' });
    } catch (err) {
      alert('Could not create class.');
    }
  };
  const handleClassCancel = () => {
    setShowClassModal(false);
    setClassForm({ subject: '', day_of_week: '', start_time: '', end_time: '', repeat_weekly: false, location: '' });
  };

  // --- Class Edit/Delete State ---
  const [editClassId, setEditClassId] = useState(null);
  const [editClassForm, setEditClassForm] = useState({ subject: '', day_of_week: '', start_time: '', end_time: '', repeat_weekly: false, location: '' });
  const [showEditClassModal, setShowEditClassModal] = useState(false);

  const handleEditClass = (cls) => {
    setEditClassId(cls._id);
    setEditClassForm({
      subject: cls.subject || '',
      day_of_week: cls.day_of_week || '',
      start_time: cls.start_time || '',
      end_time: cls.end_time || '',
      repeat_weekly: !!cls.repeat_weekly,
      location: cls.location || ''
    });
    setShowEditClassModal(true);
  };

  const handleEditClassChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditClassForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditClassSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
      const res = await fetch(`http://localhost:5000/api/classes/${editClassId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editClassForm),
      });
      if (!res.ok) throw new Error('Failed to update class');
      const updated = (await res.json()).class;
      setClasses(prev => prev.map(c => c._id === editClassId ? updated : c));
      setShowEditClassModal(false);
      setEditClassId(null);
    } catch (err) {
      alert('Could not update class.');
    }
  };

  const handleEditClassCancel = () => {
    setShowEditClassModal(false);
    setEditClassId(null);
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
      const res = await fetch(`http://localhost:5000/api/classes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete class');
      setClasses(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert('Could not delete class.');
    }
  };

  // --- Exam Handlers ---
  const [examForm, setExamForm] = useState({
    subject: '',
    date: '',
    start_time: '',
    end_time: '',
    duration: '',
    location: ''
  });
  const handleExamChange = (e) => {
    const { name, value } = e.target;
    setExamForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleExamSave = async (e) => {
    e.preventDefault();
    if (!examForm.subject || !examForm.date || !examForm.start_time || !examForm.end_time) {
      alert('Subject, date, start time, and end time are required.');
      return;
    }
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
      const res = await fetch('http://localhost:5000/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(examForm),
      });
      if (!res.ok) throw new Error('Failed to create exam');
      const created = (await res.json()).exam;
      setExams(prev => [created, ...prev]);
      setShowExamModal(false);
      setExamForm({ subject: '', date: '', start_time: '', end_time: '', duration: '', location: '' });
    } catch (err) {
      alert('Could not create exam.');
    }
  };
  const handleExamCancel = () => {
    setShowExamModal(false);
    setExamForm({ subject: '', date: '', start_time: '', end_time: '', duration: '', location: '' });
  };

  // --- Exam Edit/Delete State ---
  const [editExamId, setEditExamId] = useState(null);
  const [editExamForm, setEditExamForm] = useState({ subject: '', date: '', start_time: '', end_time: '', duration: '', location: '' });
  const [showEditExamModal, setShowEditExamModal] = useState(false);

  const handleEditExam = (exam) => {
    setEditExamId(exam._id || exam.id);
    setEditExamForm({
      subject: exam.subject || '',
      date: exam.date ? new Date(exam.date).toISOString().slice(0,10) : '',
      start_time: exam.start_time || '',
      end_time: exam.end_time || '',
      duration: exam.duration || '',
      location: exam.location || ''
    });
    setShowEditExamModal(true);
  };
  const handleEditExamChange = (e) => {
    const { name, value } = e.target;
    setEditExamForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditExamSave = async (e) => {
    e.preventDefault();
    if (!editExamForm.subject || !editExamForm.date || !editExamForm.start_time || !editExamForm.end_time) {
      alert('Subject, date, start time, and end time are required.');
      return;
    }
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
      const res = await fetch(`http://localhost:5000/api/exams/${editExamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editExamForm),
      });
      if (!res.ok) throw new Error('Failed to update exam');
      const updated = (await res.json()).exam;
      setExams(prev => prev.map(e => (e._id === editExamId || e.id === editExamId) ? updated : e));
      setShowEditExamModal(false);
      setEditExamId(null);
    } catch (err) {
      alert('Could not update exam.');
    }
  };
  const handleEditExamCancel = () => {
    setShowEditExamModal(false);
    setEditExamId(null);
  };
  const handleDeleteExam = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');
      const res = await fetch(`http://localhost:5000/api/exams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete exam');
      setExams(prev => prev.filter(e => (e._id || e.id) !== id));
    } catch (err) {
      alert('Could not delete exam.');
    }
  };

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [activityTab, setActivityTab] = useState('Task');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const navigate = useNavigate();

  const handleAddMenuClick = (label) => {
    setShowAddMenu(false);
    if (label === 'Task') setShowTaskModal(true);
    if (label === 'Class') setShowClassModal(true);
    if (label === 'Exam') setShowExamModal(true);
  };

  const [taskForm, setTaskForm] = useState({
    title: '',
    subject: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    duration: ''
  });

  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTaskSave = async (e) => {
    e.preventDefault();
    setTaskError(null);

    // Validation: Ensure required fields are filled
    if (!taskForm.title || !taskForm.subject || !taskForm.dueDate) {
      setTaskError('Title, subject, and due date are required.');
      return;
    }

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('x-auth-token');

      // Check if token is found
      if (!token) {
        console.error('No token found in localStorage');
        setTaskError('Authorization token missing');
        return;
      }

      console.log('Using token:', token); // Debugging log to verify token

      // Prepare data to send, ensuring correct types
      const dataToSend = {
        ...taskForm,
        duration: taskForm.duration ? Number(taskForm.duration) : 0,
      };

      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create task');
      }

      const createdResponse = await res.json();
      const created = createdResponse.task || createdResponse;
      // Add the new task to the top of the list
      setTasks(prev => [created, ...prev]);
      setShowTaskModal(false);
      setTaskForm({ title: '', subject: '', description: '', dueDate: '', priority: 'Medium', duration: '' });
    } catch (err) {
      console.error('Task creation error:', err); // Log the error for debugging
      setTaskError('Could not create task. ' + (err.message || ''));
    }
  };

  const handleTaskCancel = () => {
    setShowTaskModal(false);
    setTaskForm({ title: '', subject: '', description: '', dueDate: '', priority: 'Medium', duration: '' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f8fa', fontFamily: 'Segoe UI, sans-serif', overflow: 'hidden' }}>
      {/* Task Modal */}
      {showTaskModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.18)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <form
            onSubmit={handleTaskSave}
            style={{
              background: '#fff',
              borderRadius: 22,
              width: 500,
              maxWidth: '95vw',
              padding: '34px 36px 24px 36px',
              boxShadow: '0 8px 48px 0 rgba(31,38,135,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <svg width="28" height="28" fill="none" stroke="#1565d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#1565d8' }}>New task</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>Title <span style={{ color: '#e53935' }}>*</span></div>
            <input
              name="title"
              value={taskForm.title}
              onChange={handleTaskChange}
              placeholder="Task title"
              required
              style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15, marginBottom: 4 }}
            />
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>Details</div>
            <textarea
              name="description"
              value={taskForm.description}
              onChange={handleTaskChange}
              placeholder="Task description"
              rows={3}
              style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15, resize: 'vertical', marginBottom: 4 }}
            />
            <div style={{ display: 'flex', gap: 36, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Select subject <span style={{ color: '#e53935' }}>*</span></div>
                <input
                  name="subject"
                  value={taskForm.subject}
                  onChange={handleTaskChange}
                  placeholder="Select"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Type</div>
                <input
                  name="type"
                  value={taskForm.type || ''}
                  onChange={handleTaskChange}
                  placeholder="Select"
                  style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }}
                />
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, margin: '8px 0 2px 0' }}>Scheduling</div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Occurs <span style={{ color: '#e53935' }}>*</span></div>
                <input
                  name="occurs"
                  value={taskForm.occurs || 'Once'}
                  onChange={handleTaskChange}
                  placeholder="Once"
                  style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Due Date <span style={{ color: '#e53935' }}>*</span></div>
                <input
                  name="dueDate"
                  type="datetime-local"
                  value={taskForm.dueDate}
                  onChange={handleTaskChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Priority</div>
                <select
                  name="priority"
                  value={taskForm.priority}
                  onChange={handleTaskChange}
                  style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Duration (min)</div>
                <input
                  name="duration"
                  value={taskForm.duration}
                  onChange={handleTaskChange}
                  placeholder="Duration in minutes"
                  style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
              <button
                type="button"
                onClick={handleTaskCancel}
                style={{
                  background: '#f0f0f0',
                  color: '#888',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 30px',
                  fontWeight: 600,
                  fontSize: 17,
                  cursor: 'pointer',
                  marginRight: 8,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: '#1565d8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 30px',
                  fontWeight: 600,
                  fontSize: 17,
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Class Modal */}
      {showClassModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <form
            onSubmit={handleClassSave}
            style={{ background: '#fff', borderRadius: 22, width: 500, maxWidth: '95vw', padding: '34px 36px 24px 36px', boxShadow: '0 8px 48px 0 rgba(31,38,135,0.15)', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#1565d8' }}>Add Class</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>Subject <span style={{ color: '#e53935' }}>*</span></div>
            <input name="subject" value={classForm.subject} onChange={handleClassChange} placeholder="Subject" required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15, marginBottom: 4 }} />
            <div style={{ display: 'flex', gap: 36, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Day of Week <span style={{ color: '#e53935' }}>*</span></div>
                <select name="day_of_week" value={classForm.day_of_week} onChange={handleClassChange} required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }}>
                  <option value="">Select</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Location</div>
                <input name="location" value={classForm.location} onChange={handleClassChange} placeholder="Location" style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Start Time <span style={{ color: '#e53935' }}>*</span></div>
                <input name="start_time" type="time" value={classForm.start_time} onChange={handleClassChange} required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>End Time <span style={{ color: '#e53935' }}>*</span></div>
                <input name="end_time" type="time" value={classForm.end_time} onChange={handleClassChange} required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <input name="repeat_weekly" type="checkbox" checked={classForm.repeat_weekly} onChange={handleClassChange} style={{ marginRight: 8 }} />
              <span style={{ fontSize: 15 }}>Repeat Weekly</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
              <button type="button" onClick={handleClassCancel} style={{ background: '#f0f0f0', color: '#888', border: 'none', borderRadius: 8, padding: '12px 30px', fontWeight: 600, fontSize: 17, cursor: 'pointer', marginRight: 8 }}>Cancel</button>
              <button type="submit" style={{ background: '#1565d8', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 30px', fontWeight: 600, fontSize: 17, cursor: 'pointer' }}>Save</button>
            </div>
          </form>
        </div>
      )}
      {/* Exam Modal */}
      {showExamModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <form
            onSubmit={handleExamSave}
            style={{ background: '#fff', borderRadius: 22, width: 500, maxWidth: '95vw', padding: '34px 36px 24px 36px', boxShadow: '0 8px 48px 0 rgba(31,38,135,0.15)', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#1565d8' }}>Add Exam</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>Subject <span style={{ color: '#e53935' }}>*</span></div>
            <input name="subject" value={examForm.subject} onChange={handleExamChange} placeholder="Subject" required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15, marginBottom: 4 }} />
            <div style={{ display: 'flex', gap: 36, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Date <span style={{ color: '#e53935' }}>*</span></div>
                <input name="date" type="date" value={examForm.date} onChange={handleExamChange} required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Location</div>
                <input name="location" value={examForm.location} onChange={handleExamChange} placeholder="Location" style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Start Time <span style={{ color: '#e53935' }}>*</span></div>
                <input name="start_time" type="time" value={examForm.start_time} onChange={handleExamChange} required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>End Time <span style={{ color: '#e53935' }}>*</span></div>
                <input name="end_time" type="time" value={examForm.end_time} onChange={handleExamChange} required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Duration</div>
                <input name="duration" value={examForm.duration} onChange={handleExamChange} placeholder="e.g. 2h" style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
              <button type="button" onClick={handleExamCancel} style={{ background: '#f0f0f0', color: '#888', border: 'none', borderRadius: 8, padding: '12px 30px', fontWeight: 600, fontSize: 17, cursor: 'pointer', marginRight: 8 }}>Cancel</button>
              <button type="submit" style={{ background: '#1565d8', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 30px', fontWeight: 600, fontSize: 17, cursor: 'pointer' }}>Save</button>
            </div>
          </form>
        </div>
      )}
      {/* Sidebar */}
      <div style={{ position: 'fixed', left: 0, top: 0, height: '100vh', background: '#f6f8fa', zIndex: 10 }}>
        <aside style={{ width: 260, height: '100vh', background: '#fff', borderRight: '1px solid #e5e7eb', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 24px 0 rgba(31,38,135,0.08)' }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#43b2fc', display: 'flex', alignItems: 'center', marginBottom: 32 }}>
              <div style={{ 
                width: 42, 
                height: 42, 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, #43b2fc, #1565d8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <GraduationCap size={26} color="#ffffff" />
              </div>
              Academic Planner
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 12, color: activeSection === 'Dashboard' ? '#1565d8' : '#555', background: activeSection === 'Dashboard' ? '#e6f6ff' : 'none', width: '100%', padding: '12px 18px', borderRadius: 16, fontWeight: 500, fontSize: 16, border: 'none', marginBottom: 4, cursor: 'pointer' }}
                onClick={() => setActiveSection('Dashboard')}
              >
                <LayoutDashboard size={20} /> Dashboard
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 12, color: activeSection === 'Calendar' ? '#1565d8' : '#555', background: activeSection === 'Calendar' ? '#e6f6ff' : 'none', width: '100%', padding: '12px 18px', borderRadius: 16, fontWeight: 500, fontSize: 16, border: 'none', marginBottom: 4, cursor: 'pointer' }}
                onClick={() => setActiveSection('Calendar')}
              >
                <CalendarDays size={20} /> Smart Schedule
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 12, color: activeSection === 'ClassicCalendar' ? '#1565d8' : '#555', background: activeSection === 'ClassicCalendar' ? '#e6f6ff' : 'none', width: '100%', padding: '12px 18px', borderRadius: 16, fontWeight: 500, fontSize: 16, border: 'none', marginBottom: 4, cursor: 'pointer' }}
                onClick={() => setActiveSection('ClassicCalendar')}
              >
                <CalendarDays size={20} /> Calendar
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: activeSection === 'Activities' ? '#1565d8' : '#555',
                  background: activeSection === 'Activities' ? '#e6f6ff' : 'none',
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: 16,
                  fontWeight: 500,
                  fontSize: 16,
                  border: 'none',
                  marginBottom: 4,
                  cursor: 'pointer',
                }}
                onClick={() => setActiveSection('Activities')}
              >
                <ListTodo size={20} /> Activities
              </button>
              {/* Activities submenu in sidebar */}
              {activeSection === 'Activities' && (
                <div style={{ marginLeft: 36, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {['Task', 'Class', 'Exam'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActivityTab(tab)}
                      style={{
                        background: activityTab === tab ? '#e9f1ff' : '#f7f7f7',
                        color: activityTab === tab ? '#1565d8' : '#555',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 18px',
                        fontWeight: 500,
                        fontSize: 15,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.18s',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
              {/* AI Features option removed */}
              <button style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#555', background: 'none', width: '100%', padding: '12px 18px', borderRadius: 16, fontWeight: 500, fontSize: 16, border: 'none', marginBottom: 4, cursor: 'pointer' }}>
                <Timer size={20} /> Focus Timer
              </button>
            </nav>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 2 }}>
            {/* Add New button with popup options above when clicked, vertically stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 0, marginBottom: 32, gap: 12, position: 'relative', alignItems: 'center' }}>
              {/* Popup options above Add New button, vertically stacked */}
              {showAddMenu && (
                <div style={{
                  position: 'absolute',
                  bottom: '110%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  zIndex: 300,
                  background: 'rgba(255,255,255,0.98)',
                  borderRadius: 18,
                  boxShadow: '0 4px 24px 0 rgba(31,38,135,0.13)',
                  padding: '18px 18px 14px 18px',
                  border: '1.5px solid #d6e6fa',
                  animation: 'fadeIn 0.16s',
                  minWidth: 180,
                  alignItems: 'stretch',
                }}>
                  {addMenuOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => { setShowAddMenu(false); handleAddMenuClick(opt.label); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: '#fff',
                        color: '#1565d8',
                        border: '1.5px solid #d6e6fa',
                        borderRadius: 14,
                        padding: '13px 20px',
                        fontWeight: 600,
                        fontSize: 18,
                        cursor: 'pointer',
                        boxShadow: '0 1px 5px #e6f6ff',
                        transition: 'background 0.17s',
                        margin: 0,
                        width: '100%',
                        justifyContent: 'flex-start',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#f6f8fa'}
                      onMouseOut={e => e.currentTarget.style.background = '#fff'}
                    >
                      <span style={{ width: 26, display: 'inline-flex', justifyContent: 'center' }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                style={{ width: '100%', background: '#09f', color: '#fff', border: 'none', borderRadius: 24, padding: '15px 0', fontWeight: 700, fontSize: 24, cursor: 'pointer', boxShadow: '0 4px 16px #e6f6ff', zIndex: 101, position: 'relative', marginBottom: 0 }}
                onClick={() => setShowAddMenu((v) => !v)}
              >
                ＋ Add new
              </button>
            </div>
          </div>
        </aside>

      </div>
      {/* Main Content */}
      <main style={{ marginLeft: '285px', width: 'calc(100% - 320px)', height: '95vh', display: 'flex', flexDirection: 'column', borderRadius: 18, background: '#fff', boxShadow: '0 6px 32px 0 rgba(31,38,135,0.07)', marginTop: 24, marginBottom: 24, padding: '0 18px' }}>
        {/* Fixed Header with Time and Profile */}
        <div style={{ position: 'sticky', top: 0, background: '#f6f8fa', padding: '24px 32px', zIndex: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
          {/* Time and Date */}
          <div style={{ marginLeft: 80 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#222', letterSpacing: 2 }}>{currentTime}</div>
            <div style={{ color: '#888', fontSize: 20, marginTop: 2 }}>{currentDate}</div>
          </div>
          {/* Profile Button and Logout Button Side by Side */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => navigate('/profile')}
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(90deg,#43b2fc,#1565d8)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 8px rgba(67, 178, 252, 0.3)',
                fontWeight: 600,
                fontSize: 15,
                transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                ':hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(67, 178, 252, 0.4)',
                }
              }}
            >
              <div style={{ 
                width: 28, 
                height: 28, 
                borderRadius: '50%', 
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              My Profile
            </button>
            <DashboardLogout />
          </div>
        </div>
        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {/* AI Features Section - Always visible on Dashboard */}
          {activeSection === 'Dashboard' && (
            <div className="space-y-6 mb-8">
              {/* Analytics Dashboard */}
              <Analytics />
              {/* Tips & Insights */}
              <TipsCard />
              {/* Insights & Recommendations */}
              <Insights />
            </div>
          )}
          {/* Calendar View: Only show when 'Calendar' is selected */}
          {activeSection === 'Calendar' && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '32px 36px', minHeight: 400, boxShadow: '0 2px 12px 0 rgba(31,38,135,0.05)', marginTop: 32 }}>
              <SmartSchedule viewMode="month" showAllMonths={true} />
            </div>
          )}
          {/* Classic Calendar View: Only show when 'ClassicCalendar' is selected */}
          {activeSection === 'ClassicCalendar' && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '24px 12px', minHeight: 400, boxShadow: '0 2px 12px 0 rgba(31,38,135,0.05)', marginTop: 32 }}>
              <YearCalendarGrid tasks={tasks} />
            </div>
          )}
          {/* Activities Tab Content: Only show when 'Tasks' is selected */}
          {activeSection === 'Activities' && activityTab === 'Task' && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '32px 36px', minHeight: 400, boxShadow: '0 2px 12px 0 rgba(31,38,135,0.05)', marginTop: 32 }}>
              {/* Header with icon and title */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                <svg width="28" height="28" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#222' }}>Tasks</span>
                <div style={{ flex: 1 }} />
                <button style={{ background: '#1565d8', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginLeft: 16 }}>Filter by subject</button>
              </div>
              {/* Filter buttons */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
                {['Current', 'Past', 'Overdue'].map((filter, i) => (
                  <button
                    key={filter}
                    style={{
                      background: i === 0 ? '#f3f0ff' : '#f7f7f7',
                      color: i === 0 ? '#1565d8' : '#888',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 22px',
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: 'pointer',
                      boxShadow: i === 0 ? '0 2px 8px #e6f6ff' : 'none',
                      outline: i === 0 ? '2px solid #e9f1ff' : 'none',
                      transition: 'background 0.18s',
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              {/* Tasks List or Empty State */}
              {loadingTasks ? (
                <div style={{ color: '#888', marginTop: 48 }}>Loading tasks...</div>
              ) : taskError ? (
                <div style={{ color: 'red', marginTop: 48 }}>{taskError}</div>
              ) : tasks.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 48 }}>
                  <svg width="80" height="80" fill="none" stroke="#b3d7fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}><path d="M40 70V30"/><path d="M20 50h40"/><ellipse cx="40" cy="20" rx="12" ry="7"/><ellipse cx="40" cy="60" rx="24" ry="10"/></svg>
                  <span style={{ color: '#b3d7fa', fontSize: 19, fontWeight: 500, marginBottom: 6 }}>Add task</span>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {tasks.map((task, idx) => (
                    <li key={task._id || task.id || idx} style={{ background: '#f7fbff', borderRadius: 14, marginBottom: 18, boxShadow: '0 2px 10px 0 rgba(31,38,135,0.05)', padding: '18px 20px', position: 'relative' }}>
                      <div style={{ fontWeight: 700, fontSize: 17, color: '#1565d8', marginBottom: 4 }}>{task.title || 'Untitled'}</div>
                      <div style={{ fontSize: 15, color: '#333', marginBottom: 2 }}>Subject: {task.subject || 'N/A'}</div>
                      <div style={{ fontSize: 14, color: '#555', marginBottom: 2 }}>{task.description || ''}</div>
                      <div style={{ fontSize: 13, color: '#888' }}>
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'N/A'} |
                        Priority: {task.priority || 'N/A'} |
                        Duration: {typeof task.duration === 'number' && task.duration > 0 ? `${task.duration} min` : 'N/A'}
                      </div>
                      <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', gap: 10 }}>
                        <button onClick={() => handleEditTask(task)} style={{ background: '#e3f0ff', color: '#1565d8', border: 'none', borderRadius: 6, padding: '5px 12px', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => handleDeleteTask(task._id || task.id)} style={{ background: '#ffe3e3', color: '#e53935', border: 'none', borderRadius: 6, padding: '5px 12px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Activities Tab Content: Only show when 'Classes' is selected */}
          {activeSection === 'Activities' && activityTab === 'Class' && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '32px 36px', minHeight: 400, boxShadow: '0 2px 12px 0 rgba(31,38,135,0.05)', marginTop: 32 }}>
              {/* Header with icon and title */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                <svg width="28" height="28" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#222' }}>Classes</span>
                <div style={{ flex: 1 }} />
                <button style={{ background: '#1565d8', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginLeft: 16 }} onClick={() => setShowClassModal(true)}>Add Class</button>
              </div>
              {/* Classes List or Empty State */}
              {loadingClasses ? (
                <div style={{ color: '#888', marginTop: 48 }}>Loading classes...</div>
              ) : classError ? (
                <div style={{ color: 'red', marginTop: 48 }}>{classError}</div>
              ) : classes.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 48 }}>
                  <svg width="80" height="80" fill="none" stroke="#b3d7fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}><path d="M40 70V30"/><path d="M20 50h40"/><ellipse cx="40" cy="20" rx="12" ry="7"/><ellipse cx="40" cy="60" rx="24" ry="10"/></svg>
                  <span style={{ color: '#b3d7fa', fontSize: 19, fontWeight: 500, marginBottom: 6 }}>Add a class</span>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {classes.map((cls, idx) => (
                    <li key={cls._id || cls.id || idx} style={{ background: '#f7fbff', borderRadius: 14, marginBottom: 18, boxShadow: '0 2px 10px 0 rgba(31,38,135,0.05)', padding: '18px 20px', position: 'relative' }}>
                      <div style={{ fontWeight: 700, fontSize: 17, color: '#1565d8', marginBottom: 4 }}>{cls.subject || 'Untitled'}</div>
                      <div style={{ fontSize: 15, color: '#333', marginBottom: 2 }}>Day: {cls.day_of_week || 'N/A'}</div>
                      <div style={{ fontSize: 14, color: '#555', marginBottom: 2 }}>Time: {cls.start_time} - {cls.end_time}</div>
                      <div style={{ fontSize: 13, color: '#888' }}>Location: {cls.location || 'N/A'} | Repeat: {cls.repeat_weekly ? 'Yes' : 'No'}</div>
                      <div style={{ position: 'absolute', top: 16, right: 20, display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEditClass(cls)} style={{ background: '#fff', border: '1px solid #1565d8', color: '#1565d8', borderRadius: 6, padding: '4px 12px', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => handleDeleteClass(cls._id)} style={{ background: '#fff', border: '1px solid #e53935', color: '#e53935', borderRadius: 6, padding: '4px 12px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* AI Features Section moved to Dashboard */}

          {/* Activities Tab Content: Only show when 'Exams' is selected */}
          {activeSection === 'Activities' && activityTab === 'Exam' && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '32px 36px', minHeight: 400, boxShadow: '0 2px 12px 0 rgba(31,38,135,0.05)', marginTop: 32 }}>
              {/* Header with icon and title */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                <svg width="28" height="28" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#222' }}>Exams</span>
                <div style={{ flex: 1 }} />
                <button style={{ background: '#1565d8', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginLeft: 16 }} onClick={() => setShowExamModal(true)}>Add Exam</button>
              </div>
              {/* Exams List or Empty State */}
              {loadingExams ? (
                <div style={{ color: '#888', marginTop: 48 }}>Loading exams...</div>
              ) : examError ? (
                <div style={{ color: 'red', marginTop: 48 }}>{examError}</div>
              ) : exams.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 48 }}>
                  <svg width="80" height="80" fill="none" stroke="#b3d7fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}><path d="M40 70V30"/><path d="M20 50h40"/><ellipse cx="40" cy="20" rx="12" ry="7"/><ellipse cx="40" cy="60" rx="24" ry="10"/></svg>
                  <span style={{ color: '#b3d7fa', fontSize: 19, fontWeight: 500, marginBottom: 6 }}>Add an exam</span>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {exams.map((exam, idx) => (
                    <li key={exam._id || exam.id || idx} style={{ background: '#f7fbff', borderRadius: 14, marginBottom: 18, boxShadow: '0 2px 10px 0 rgba(31,38,135,0.05)', padding: '18px 20px', position: 'relative' }}>
                      <div style={{ fontWeight: 700, fontSize: 17, color: '#1565d8', marginBottom: 4 }}>{exam.subject || 'Untitled'}</div>
                      <div style={{ fontSize: 15, color: '#333', marginBottom: 2 }}>Date: {exam.date ? new Date(exam.date).toLocaleDateString() : 'N/A'}</div>
                      <div style={{ fontSize: 14, color: '#555', marginBottom: 2 }}>Time: {exam.start_time} - {exam.end_time}</div>
                      <div style={{ fontSize: 13, color: '#888' }}>
                        Location: {exam.location || 'N/A'} | Duration: {exam.duration || 'N/A'}
                      </div>
                      <div style={{ position: 'absolute', right: 18, top: 18, display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEditExam(exam)} style={{ background: 'none', border: 'none', color: '#1565d8', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 6 }}>Edit</button>
                        <button onClick={() => handleDeleteExam(exam._id || exam.id)} style={{ background: 'none', border: 'none', color: '#e53935', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </main>
      {/* Edit Task Modal */}
      {editTaskId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <form
            onSubmit={handleEditTaskSave}
            style={{ background: '#fff', borderRadius: 22, width: 500, maxWidth: '95vw', padding: '34px 36px 24px 36px', boxShadow: '0 8px 48px 0 rgba(31,38,135,0.15)', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#1565d8' }}>Edit Task</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>Title <span style={{ color: '#e53935' }}>*</span></div>
            <input name="title" value={editTaskForm.title} onChange={handleEditTaskChange} placeholder="Task title" required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15, marginBottom: 4 }} />
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>Details</div>
            <textarea name="description" value={editTaskForm.description} onChange={handleEditTaskChange} placeholder="Task description" rows={3} style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15, resize: 'vertical', marginBottom: 4 }} />
            <div style={{ display: 'flex', gap: 36, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Select subject <span style={{ color: '#e53935' }}>*</span></div>
                <input name="subject" value={editTaskForm.subject} onChange={handleEditTaskChange} placeholder="Select" required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Type</div>
                <input name="type" value={editTaskForm.type || ''} onChange={handleEditTaskChange} placeholder="Select" style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, margin: '8px 0 2px 0' }}>Scheduling</div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Occurs <span style={{ color: '#e53935' }}>*</span></div>
                <input name="occurs" value={editTaskForm.occurs || 'Once'} onChange={handleEditTaskChange} placeholder="Once" style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Due Date <span style={{ color: '#e53935' }}>*</span></div>
                <input name="dueDate" type="datetime-local" value={editTaskForm.dueDate} onChange={handleEditTaskChange} required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Priority</div>
                <select name="priority" value={editTaskForm.priority} onChange={handleEditTaskChange} style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Duration (min)</div>
                <input name="duration" value={editTaskForm.duration} onChange={handleEditTaskChange} placeholder="Duration in minutes" style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
              <button type="button" onClick={handleEditTaskCancel} style={{ background: '#f0f0f0', color: '#888', border: 'none', borderRadius: 8, padding: '12px 30px', fontWeight: 600, fontSize: 17, cursor: 'pointer', marginRight: 8 }}>Cancel</button>
              <button type="submit" style={{ background: '#1565d8', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 30px', fontWeight: 600, fontSize: 17, cursor: 'pointer' }}>Save</button>
            </div>
          </form>
        </div>
      )}
      {/* Edit Class Modal */}
      {showEditClassModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <form
            onSubmit={handleEditClassSave}
            style={{ background: '#fff', borderRadius: 22, width: 500, maxWidth: '95vw', padding: '34px 36px 24px 36px', boxShadow: '0 8px 48px 0 rgba(31,38,135,0.15)', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#1565d8' }}>Edit Class</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>Subject <span style={{ color: '#e53935' }}>*</span></div>
            <input name="subject" value={editClassForm.subject} onChange={handleEditClassChange} placeholder="Subject" required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15, marginBottom: 4 }} />
            <div style={{ display: 'flex', gap: 36, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Day of Week <span style={{ color: '#e53935' }}>*</span></div>
                <select name="day_of_week" value={editClassForm.day_of_week} onChange={handleEditClassChange} required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }}>
                  <option value="">Select</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Location</div>
                <input name="location" value={editClassForm.location} onChange={handleEditClassChange} placeholder="Location" style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Start Time <span style={{ color: '#e53935' }}>*</span></div>
                <input name="start_time" type="time" value={editClassForm.start_time} onChange={handleEditClassChange} required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>End Time <span style={{ color: '#e53935' }}>*</span></div>
                <input name="end_time" type="time" value={editClassForm.end_time} onChange={handleEditClassChange} required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <input name="repeat_weekly" type="checkbox" checked={editClassForm.repeat_weekly} onChange={handleEditClassChange} style={{ marginRight: 8 }} />
              <span style={{ fontSize: 15 }}>Repeat Weekly</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
              <button type="button" onClick={handleEditClassCancel} style={{ background: '#f0f0f0', color: '#888', border: 'none', borderRadius: 8, padding: '12px 30px', fontWeight: 600, fontSize: 17, cursor: 'pointer', marginRight: 8 }}>Cancel</button>
              <button type="submit" style={{ background: '#1565d8', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 30px', fontWeight: 600, fontSize: 17, cursor: 'pointer' }}>Save</button>
            </div>
          </form>
        </div>
      )}
      {/* Exam Edit Modal */}
      {showEditExamModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <form
            onSubmit={handleEditExamSave}
            style={{ background: '#fff', borderRadius: 22, width: 500, maxWidth: '95vw', padding: '34px 36px 24px 36px', boxShadow: '0 8px 48px 0 rgba(31,38,135,0.15)', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#1565d8' }}>Edit Exam</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>Subject <span style={{ color: '#e53935' }}>*</span></div>
            <input name="subject" value={editExamForm.subject} onChange={handleEditExamChange} placeholder="Subject" required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15, marginBottom: 4 }} />
            <div style={{ display: 'flex', gap: 36, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Date <span style={{ color: '#e53935' }}>*</span></div>
                <input name="date" type="date" value={editExamForm.date} onChange={handleEditExamChange} required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Location</div>
                <input name="location" value={editExamForm.location} onChange={handleEditExamChange} placeholder="Location" style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Start Time <span style={{ color: '#e53935' }}>*</span></div>
                <input name="start_time" type="time" value={editExamForm.start_time} onChange={handleEditExamChange} required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>End Time <span style={{ color: '#e53935' }}>*</span></div>
                <input name="end_time" type="time" value={editExamForm.end_time} onChange={handleEditExamChange} required style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Duration</div>
                <input name="duration" value={editExamForm.duration} onChange={handleEditExamChange} placeholder="e.g. 2h" style={{ width: '100%', padding: '10px', borderRadius: 7, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
              <button type="button" onClick={handleEditExamCancel} style={{ background: '#f0f0f0', color: '#888', border: 'none', borderRadius: 8, padding: '12px 30px', fontWeight: 600, fontSize: 17, cursor: 'pointer', marginRight: 8 }}>Cancel</button>
              <button type="submit" style={{ background: '#1565d8', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 30px', fontWeight: 600, fontSize: 17, cursor: 'pointer' }}>Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Year Calendar Grid Component ---
function YearCalendarGrid({ tasks }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [showMonthOnly, setShowMonthOnly] = useState(true); // show only current month by default
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Helper: get tasks for a particular date (yyyy-mm-dd)
  const getTasksForDate = (date) => {
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      const td = new Date(t.dueDate);
      return td.getFullYear() === date.getFullYear() && td.getMonth() === date.getMonth() && td.getDate() === date.getDate();
    });
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Year navigation (when in year view)
  const handlePrevYear = () => setCurrentYear(y => y - 1);
  const handleNextYear = () => setCurrentYear(y => y + 1);

  // Toggle between month and year view
  const handleShowAllMonths = () => setShowMonthOnly(false);
  const handleShowCurrentMonth = () => setShowMonthOnly(true);

  return (
    <div>
      {/* Top Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        {showMonthOnly ? (
          <>
            <button onClick={handlePrevMonth} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#1565d8' }}>{'<'}</button>
            <span style={{ fontWeight: 800, fontSize: 24 }}>{new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button onClick={handleNextMonth} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#1565d8' }}>{'>'}</button>
            <button onClick={() => { setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth()); }} style={{ marginLeft: 10, fontSize: 13, background: '#f3f8fd', border: '1px solid #1565d8', color: '#1565d8', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Today</button>
          </>
        ) : (
          <>
            <button onClick={handlePrevYear} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#1565d8' }}>{'<'}</button>
            <span style={{ fontWeight: 800, fontSize: 24 }}>{currentYear}</span>
            <button onClick={handleNextYear} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#1565d8' }}>{'>'}</button>
            <button onClick={() => { setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth()); }} style={{ marginLeft: 10, fontSize: 13, background: '#f3f8fd', border: '1px solid #1565d8', color: '#1565d8', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Today</button>
          </>
        )}
        <div style={{ flex: 1 }} />
        {showMonthOnly ? <button disabled style={{ fontSize: 13, background: '#1565d8', color: '#fff', borderRadius: 8, padding: '4px 10px', marginRight: 6, border: 'none', fontWeight: 700 }}>Month</button>
          : <button onClick={handleShowCurrentMonth} style={{ fontSize: 13, background: '#fff', border: '1px solid #1565d8', color: '#1565d8', borderRadius: 8, padding: '4px 10px', marginRight: 6, cursor: 'pointer', fontWeight: 700 }}>Month</button>}
        <button onClick={handleShowAllMonths} style={{ fontSize: 13, background: !showMonthOnly ? '#1565d8' : '#fff', border: '1px solid #1565d8', color: !showMonthOnly ? '#fff' : '#1565d8', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontWeight: !showMonthOnly ? 700 : 500 }}>Year</button>
      </div>
      {showMonthOnly
        ? <MonthCalendar month={currentMonth} year={currentYear} tasks={tasks} today={today} />
        : <YearCalendar year={currentYear} tasks={tasks} today={today} />}
    </div>
  );
}

export default Dashboard;
