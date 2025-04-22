import { api } from './api';

// Generate analytics
export const generateAnalytics = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${api.baseUrl}/api/analytics/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate analytics');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating analytics:', error);
    throw error;
  }
};

// Get analytics for a specific week
export const getAnalytics = async (week) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    let url = `${api.baseUrl}/api/analytics`;
    if (week) {
      url += `?week=${week}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch analytics');
    }
    
    const serverAnalytics = await response.json();
    
    // Check if server returned empty analytics
    if (!serverAnalytics || 
        (serverAnalytics.totalSlots === 0 && 
         serverAnalytics.confirmedSlots === 0 && 
         serverAnalytics.completedSlots === 0)) {
      console.log('Using client-side analytics calculation');
      return await generateMockAnalytics();
    }
    
    return serverAnalytics;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    
    // If server request fails, generate mock analytics
    try {
      console.log('Using client-side analytics calculation');
      return await generateMockAnalytics();
    } catch (mockError) {
      console.error('Error generating mock analytics:', mockError);
      throw error; // Throw the original error
    }
  }
};

// Get analytics history
export const getAnalyticsHistory = async (limit = 10) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${api.baseUrl}/api/analytics/history?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch analytics history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics history:', error);
    throw error;
  }
};

// Generate mock analytics data based on confirmed slots, tasks, and exams
const generateMockAnalytics = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Fetch confirmed study slots
    const slotsResponse = await fetch(`${api.baseUrl}/api/smart-schedule/confirmed`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!slotsResponse.ok) {
      throw new Error('Failed to fetch confirmed study slots');
    }
    
    // Fetch tasks to include in analytics
    const tasksResponse = await fetch(`${api.baseUrl}/api/tasks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!tasksResponse.ok) {
      throw new Error('Failed to fetch tasks');
    }
    
    // Fetch exams to include in analytics
    const examsResponse = await fetch(`${api.baseUrl}/api/exams`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!examsResponse.ok) {
      throw new Error('Failed to fetch exams');
    }
    
    const confirmedSlotsData = await slotsResponse.json();
    const tasksData = await tasksResponse.json();
    const examsData = await examsResponse.json();
    
    // Make sure we have arrays of slots, tasks, and exams
    const confirmedSlots = Array.isArray(confirmedSlotsData) ? confirmedSlotsData : 
                          (confirmedSlotsData.slots || confirmedSlotsData.studySlots || []);
    
    const tasks = Array.isArray(tasksData) ? tasksData : 
                 (tasksData.tasks || []);
                 
    const exams = Array.isArray(examsData) ? examsData : 
                 (examsData.exams || []);
    
    console.log('Confirmed slots for analytics:', confirmedSlots);
    console.log('Tasks for analytics:', tasks);
    console.log('Exams for analytics:', exams);
    
    // Calculate analytics based on confirmed slots, tasks, and exams
    const totalSlots = confirmedSlots.length;
    const completedSlots = confirmedSlots.filter(slot => 
      slot.status === 'completed' || slot.completed === true
    ).length;
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => 
      task.status === 'completed' || task.completed === true || task.isCompleted === true
    ).length;
    
    const totalExams = exams.length;
    const completedExams = exams.filter(exam => 
      exam.status === 'completed' || exam.completed === true || exam.isCompleted === true
    ).length;
    
    // Combine slots, tasks, and exams for subject breakdown
    const subjectMap = {};
    let totalHours = 0;
    
    // Process confirmed slots
    confirmedSlots.forEach(slot => {
      const subject = slot.subject || slot.category || 'General';
      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          subject,
          hours: 0,
          taskCount: 0,
          completedTaskCount: 0,
          examCount: 0,
          completedExamCount: 0
        };
      }
      
      // Calculate hours based on duration or default to 1 hour
      let hours = 1; // Default 1 hour per slot
      
      if (slot.duration) {
        // If duration is in minutes, convert to hours
        hours = slot.duration / 60;
      } else if (slot.startTime && slot.endTime) {
        // If we have start and end times, calculate duration
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);
        const durationMs = end - start;
        hours = durationMs / (1000 * 60 * 60); // Convert ms to hours
      }
      
      // Ensure hours is a reasonable value
      hours = Math.max(0.25, Math.min(hours, 8)); // Between 15 minutes and 8 hours
      
      subjectMap[subject].hours += hours;
      totalHours += hours;
      subjectMap[subject].taskCount += 1;
      
      if (slot.status === 'completed' || slot.completed === true) {
        subjectMap[subject].completedTaskCount += 1;
      }
    });
    
    // Process tasks
    tasks.forEach(task => {
      const subject = task.subject || task.category || task.type || 'General';
      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          subject,
          hours: 0,
          taskCount: 0,
          completedTaskCount: 0,
          examCount: 0,
          completedExamCount: 0
        };
      }
      
      // Estimate hours based on task complexity or estimated time
      let hours = 0.5; // Default 30 minutes per task
      
      if (task.estimatedTime) {
        hours = task.estimatedTime / 60; // Convert minutes to hours
      } else if (task.complexity) {
        // Estimate hours based on complexity (1-5)
        const complexity = parseInt(task.complexity) || 1;
        hours = complexity * 0.5; // 30 minutes per complexity point
      }
      
      // Ensure hours is a reasonable value
      hours = Math.max(0.25, Math.min(hours, 8)); // Between 15 minutes and 8 hours
      
      subjectMap[subject].hours += hours;
      totalHours += hours;
      subjectMap[subject].taskCount += 1;
      
      if (task.status === 'completed' || task.completed === true || task.isCompleted === true) {
        subjectMap[subject].completedTaskCount += 1;
      }
    });
    
    // Process exams
    exams.forEach(exam => {
      const subject = exam.subject || exam.course || 'General';
      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          subject,
          hours: 0,
          taskCount: 0,
          completedTaskCount: 0,
          examCount: 0,
          completedExamCount: 0
        };
      }
      
      // Add exam to subject breakdown
      subjectMap[subject].examCount += 1;
      
      if (exam.status === 'completed' || exam.completed === true) {
        subjectMap[subject].completedExamCount += 1;
      }
      
      // Estimate study hours needed for exam
      // Base on exam difficulty, weight, or days until exam
      let studyHoursForExam = 0;
      
      if (exam.date) {
        // Calculate days until exam
        const examDate = new Date(exam.date);
        const today = new Date();
        const daysUntilExam = Math.max(1, Math.ceil((examDate - today) / (1000 * 60 * 60 * 24)));
        
        // Estimate study hours based on days until exam
        // Closer exams need more hours per day
        if (daysUntilExam <= 3) {
          studyHoursForExam = 3; // 3 hours per day for very close exams
        } else if (daysUntilExam <= 7) {
          studyHoursForExam = 2; // 2 hours per day for exams within a week
        } else {
          studyHoursForExam = 1; // 1 hour per day for exams more than a week away
        }
      } else {
        // Default if no date is specified
        studyHoursForExam = 2;
      }
      
      // Add exam study hours to subject and total
      subjectMap[subject].hours += studyHoursForExam;
      totalHours += studyHoursForExam;
    });
    
    const subjectBreakdown = Object.values(subjectMap);
    
    // Calculate combined completion rate
    const totalItems = totalSlots + totalTasks + totalExams;
    const completedItems = completedSlots + completedTasks + completedExams;
    const taskCompletionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    // Create analytics object with comprehensive data
    const mockAnalytics = {
      totalSlots,
      confirmedSlots: totalSlots,
      completedSlots,
      totalTasks,
      completedTasks,
      totalExams,
      completedExams,
      totalItems,
      completedItems,
      totalHours: parseFloat(totalHours.toFixed(1)),
      totalStudyHours: parseFloat(totalHours.toFixed(1)),
      taskCompletionRate,
      subjectBreakdown,
      weekStartDate: new Date().toISOString(),
      weekEndDate: new Date().toISOString(),
      _id: 'mock-analytics-' + new Date().getTime(),
      insights: [
        {
          text: `You've completed ${completedItems} out of ${totalItems} academic items this week.`,
          category: 'achievement',
          source: 'Task Completion'
        },
        {
          text: `You've studied for a total of ${totalHours.toFixed(1)} hours this week.`,
          category: 'achievement',
          source: 'Study Hours'
        }
      ]
    };
    
    // Add exam-specific insights
    if (exams.length > 0) {
      // Find upcoming exams
      const upcomingExams = exams.filter(exam => {
        if (!exam.date) return false;
        const examDate = new Date(exam.date);
        const today = new Date();
        return examDate > today;
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      if (upcomingExams.length > 0) {
        const nextExam = upcomingExams[0];
        const examDate = new Date(nextExam.date);
        const today = new Date();
        const daysUntilExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
        
        mockAnalytics.insights.push({
          text: `Your next exam (${nextExam.title || nextExam.subject}) is in ${daysUntilExam} days. Make sure to prioritize studying for it.`,
          category: 'suggestion',
          source: 'Exam Planning'
        });
      }
    }
    
    // Add subject-specific insights
    if (subjectBreakdown.length > 0) {
      // Find subject with highest completion rate
      const subjectsWithTasks = subjectBreakdown.filter(s => s.taskCount > 0);
      if (subjectsWithTasks.length > 0) {
        const bestSubject = subjectsWithTasks.reduce((best, current) => {
          const bestRate = best.completedTaskCount / best.taskCount;
          const currentRate = current.completedTaskCount / current.taskCount;
          return currentRate > bestRate ? current : best;
        }, subjectsWithTasks[0]);
        
        if (bestSubject.completedTaskCount > 0) {
          const completionRate = Math.round((bestSubject.completedTaskCount / bestSubject.taskCount) * 100);
          mockAnalytics.insights.push({
            text: `You're doing great in ${bestSubject.subject} with a ${completionRate}% completion rate!`,
            category: 'achievement',
            source: 'Subject Analysis'
          });
        }
      }
      
      // Find subject with lowest completion rate (needs improvement)
      const subjectsNeedingWork = subjectBreakdown.filter(s => s.taskCount > 2 && s.completedTaskCount / s.taskCount < 0.5);
      if (subjectsNeedingWork.length > 0) {
        const worstSubject = subjectsNeedingWork.reduce((worst, current) => {
          const worstRate = worst.completedTaskCount / worst.taskCount;
          const currentRate = current.completedTaskCount / current.taskCount;
          return currentRate < worstRate ? current : worst;
        }, subjectsNeedingWork[0]);
        
        const completionRate = Math.round((worstSubject.completedTaskCount / worstSubject.taskCount) * 100);
        mockAnalytics.insights.push({
          text: `Consider focusing more on ${worstSubject.subject} where your completion rate is ${completionRate}%.`,
          category: 'improvement',
          source: 'Subject Analysis'
        });
      }
    }
    
    console.log('Generated comprehensive analytics:', mockAnalytics);
    return mockAnalytics;
  } catch (error) {
    console.error('Error generating comprehensive analytics:', error);
    throw error;
  }
};

// Update analytics after confirming or completing a study slot
export const updateAnalyticsAfterConfirmation = async () => {
  try {
    // Try to use the backend endpoint first
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    try {
      // Try the server endpoint first
      const response = await fetch(`${api.baseUrl}/api/analytics/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Server analytics generation failed');
      }
      
      return await response.json();
    } catch (serverError) {
      console.log('Using client-side analytics calculation');
      
      // If server fails, generate mock analytics on the client
      const mockAnalytics = await generateMockAnalytics();
      return { analytics: mockAnalytics };
    }
  } catch (error) {
    console.error('Error updating analytics:', error);
    throw error;
  }
};
