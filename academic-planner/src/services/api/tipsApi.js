import { api } from './api';

// Generate personalized tips
export const generateTips = async (limit = 5) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/tips/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ limit })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate personalized tips');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating personalized tips:', error);
    throw error;
  }
};

// Fetch personalized tips
export const fetchPersonalizedTips = async (limit = 5) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/tips?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch personalized tips');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching personalized tips:', error);
    throw error;
  }
};

// Mark a tip as helpful or not helpful
export const markTipHelpfulness = async (tipId, isHelpful) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${api.baseUrl}/api/tips/${tipId}/feedback`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isHelpful })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to mark tip helpfulness');
    }

    return await response.json();
  } catch (error) {
    console.error('Error marking tip helpfulness:', error);
    throw error;
  }
};

// Fetch daily personalized tips (2 per day)
export const fetchDailyTips = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Try to fetch from the backend first
    try {
      const response = await fetch(`${api.baseUrl}/api/tips/daily`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (backendError) {
      console.warn('Backend daily tips endpoint not available, using client-side generation');
    }

    // If backend fails or doesn't exist, generate tips on the client side
    return generateClientSideTips();
  } catch (error) {
    console.error('Error fetching daily tips:', error);
    throw error;
  }
};

// Generate client-side tips based on user data
const generateClientSideTips = async () => {
  try {
    // Fetch user data to personalize tips
    const tasksResponse = await fetch(`${api.baseUrl}/api/tasks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const examsResponse = await fetch(`${api.baseUrl}/api/exams`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const analyticsResponse = await fetch(`${api.baseUrl}/api/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    // Process the data
    const tasks = tasksResponse.ok ? await tasksResponse.json() : [];
    const exams = examsResponse.ok ? await examsResponse.json() : [];
    const analytics = analyticsResponse.ok ? await analyticsResponse.json() : {};

    // Extract useful information
    const tasksList = Array.isArray(tasks) ? tasks : (tasks.tasks || []);
    const examsList = Array.isArray(exams) ? exams : (exams.exams || []);
    
    // Get today's date as a string to use as a seed for consistent daily tips
    const today = new Date().toISOString().split('T')[0];
    
    // Generate tips based on user data
    const tips = [];
    
    // Check for upcoming exams
    const upcomingExams = examsList.filter(exam => {
      if (!exam.date) return false;
      const examDate = new Date(exam.date);
      const now = new Date();
      const daysUntil = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 14; // Exams within next 2 weeks
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcomingExams.length > 0) {
      const nextExam = upcomingExams[0];
      const examDate = new Date(nextExam.date);
      const now = new Date();
      const daysUntil = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
      
      tips.push({
        _id: `daily-exam-tip-${today}`,
        title: "Exam Preparation Strategy",
        content: `You have an exam (${nextExam.title || nextExam.subject}) in ${daysUntil} days. Break down your study material into ${Math.min(daysUntil, 5)} sections and focus on one section per day, with regular review sessions.`,
        category: "study technique",
        tags: ["exam prep", "time management", nextExam.subject || "academics"],
        createdAt: new Date().toISOString(),
        source: "Daily Tips"
      });
    }
    
    // Check for incomplete tasks
    const incompleteTasks = tasksList.filter(task => 
      !task.completed && !task.isCompleted && task.status !== 'completed'
    );
    
    if (incompleteTasks.length > 0) {
      // Find tasks due soon
      const tasksDueSoon = incompleteTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 3; // Due within next 3 days
      });
      
      if (tasksDueSoon.length > 0) {
        tips.push({
          _id: `daily-task-tip-${today}`,
          title: "Urgent Task Focus",
          content: `You have ${tasksDueSoon.length} task${tasksDueSoon.length > 1 ? 's' : ''} due within the next 3 days. Consider using the Pomodoro Technique: work for 25 minutes, then take a 5-minute break to maintain focus and productivity.`,
          category: "productivity",
          tags: ["urgent tasks", "focus", "time management"],
          createdAt: new Date().toISOString(),
          source: "Daily Tips"
        });
      }
    }
    
    // Check analytics data for study patterns
    if (analytics && analytics.totalStudyHours !== undefined) {
      const studyHours = analytics.totalStudyHours || 0;
      
      if (studyHours < 10) {
        tips.push({
          _id: `daily-study-tip-${today}`,
          title: "Boost Your Study Hours",
          content: "Your current study hours are below the recommended weekly target. Try to allocate specific time blocks in your calendar dedicated solely to studying, and treat them as non-negotiable appointments.",
          category: "time management",
          tags: ["study hours", "scheduling", "productivity"],
          createdAt: new Date().toISOString(),
          source: "Daily Tips"
        });
      } else if (studyHours > 30) {
        tips.push({
          _id: `daily-balance-tip-${today}`,
          title: "Maintain Work-Life Balance",
          content: "You're putting in significant study hours. Remember to take breaks and engage in activities you enjoy to prevent burnout. Research shows that regular breaks improve long-term productivity and retention.",
          category: "motivation",
          tags: ["balance", "wellness", "productivity"],
          createdAt: new Date().toISOString(),
          source: "Daily Tips"
        });
      }
    }
    
    // General tips to use if we don't have enough personalized ones
    const generalTips = [
      {
        _id: `daily-general-tip1-${today}`,
        title: "Active Recall Practice",
        content: "Instead of re-reading notes, try active recall: close your notes and quiz yourself on the material. This strengthens memory connections and improves long-term retention by up to 50%.",
        category: "study technique",
        tags: ["memory", "retention", "study method"],
        createdAt: new Date().toISOString(),
        source: "Daily Tips"
      },
      {
        _id: `daily-general-tip2-${today}`,
        title: "Spaced Repetition",
        content: "Review material at increasing intervals: first after 1 day, then 3 days, then a week. This spaced repetition technique is proven to enhance long-term memory retention.",
        category: "study technique",
        tags: ["memory", "retention", "scheduling"],
        createdAt: new Date().toISOString(),
        source: "Daily Tips"
      },
      {
        _id: `daily-general-tip3-${today}`,
        title: "Environment Matters",
        content: "Your study environment significantly impacts your focus. Find a quiet, well-lit space with minimal distractions. Consider using noise-cancelling headphones or ambient background sounds if needed.",
        category: "productivity",
        tags: ["focus", "environment", "concentration"],
        createdAt: new Date().toISOString(),
        source: "Daily Tips"
      },
      {
        _id: `daily-general-tip4-${today}`,
        title: "Teach to Learn",
        content: "Explaining concepts to others (even imaginary students) forces you to organize your thoughts and identify knowledge gaps. This 'teaching method' is one of the most effective ways to solidify understanding.",
        category: "study technique",
        tags: ["comprehension", "teaching", "understanding"],
        createdAt: new Date().toISOString(),
        source: "Daily Tips"
      },
      {
        _id: `daily-general-tip5-${today}`,
        title: "Morning Study Session",
        content: "Research shows that studying in the morning leads to better retention for most people. Try dedicating 30 minutes after breakfast to review your most challenging material.",
        category: "time management",
        tags: ["morning routine", "scheduling", "productivity"],
        createdAt: new Date().toISOString(),
        source: "Daily Tips"
      }
    ];
    
    // Add general tips if we don't have enough personalized ones
    while (tips.length < 2) {
      // Use the date as a seed to consistently select the same tips on the same day
      const dateNumber = parseInt(today.replace(/-/g, ''));
      const index = (dateNumber + tips.length) % generalTips.length;
      tips.push(generalTips[index]);
    }
    
    // Return exactly 2 tips
    return tips.slice(0, 2);
  } catch (error) {
    console.error('Error generating client-side tips:', error);
    // Return fallback tips if everything fails
    return [
      {
        _id: 'fallback-tip-1',
        title: "Effective Note-Taking",
        content: "Try the Cornell note-taking method: divide your page into sections for notes, cues, and summary to improve organization and retention of information.",
        category: "study technique",
        tags: ["notes", "organization", "study method"],
        createdAt: new Date().toISOString(),
        source: "Daily Tips"
      },
      {
        _id: 'fallback-tip-2',
        title: "Break Down Large Tasks",
        content: "When facing a large assignment, break it into smaller, manageable tasks. This reduces overwhelm and gives you a sense of progress as you complete each part.",
        category: "productivity",
        tags: ["task management", "focus", "organization"],
        createdAt: new Date().toISOString(),
        source: "Daily Tips"
      }
    ];
  }
};
