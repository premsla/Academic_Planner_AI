/**
 * Analytics Controller
 * 
 * Handles API endpoints for generating and retrieving student analytics
 */

const Task = require('../models/Task');
const StudySlot = require('../models/StudySlot');
const Analytics = require('../models/Analytics');
const Preference = require('../models/Preference');
const llmService = require('../services/llmService');
const logger = require('../utils/logger');

/**
 * Generate analytics for a user
 * @route POST /api/analytics/generate
 */
exports.generateAnalytics = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    
    // Get start and end dates for the week
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate the start of the week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate the end of the week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Check if analytics already exist for this week
    let analytics = await Analytics.findOne({
      userId,
      weekStartDate: startOfWeek,
      weekEndDate: endOfWeek
    });
    
    if (!analytics) {
      // Fetch data for analytics
      const [tasks, studySlots, preferences] = await Promise.all([
        Task.find({ userId }),
        StudySlot.find({
          userId,
          startTime: { $gte: startOfWeek },
          endTime: { $lte: endOfWeek }
        }).populate('taskId'),
        Preference.findOne({ userId }) || { userId }
      ]);
      
      // Calculate task completion rate
      const completedTasks = tasks.filter(task => task.completed).length;
      const totalTasks = tasks.length;
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      // Calculate total study hours
      const totalStudyHours = studySlots.reduce((total, slot) => {
        if (slot.isCompleted) {
          return total + (slot.duration / 60); // Convert minutes to hours
        }
        return total;
      }, 0);
      
      // Calculate subject breakdown
      const subjectMap = new Map();
      
      for (const slot of studySlots) {
        if (!slot.taskId) continue;
        
        const subject = slot.taskId.subject;
        if (!subject) continue;
        
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, {
            subject,
            hours: 0,
            taskCount: 0,
            completedTaskCount: 0
          });
        }
        
        const subjectData = subjectMap.get(subject);
        
        if (slot.isCompleted) {
          subjectData.hours += slot.duration / 60; // Convert minutes to hours
        }
        
        subjectData.taskCount++;
        if (slot.isCompleted) {
          subjectData.completedTaskCount++;
        }
      }
      
      const subjectBreakdown = Array.from(subjectMap.values());
      
      // Generate insights using LLM service
      const insightsData = await llmService.generateAnalyticsInsights({
        taskCompletionRate,
        totalStudyHours,
        subjectBreakdown,
        preferences
      });
      
      // Create analytics record
      analytics = new Analytics({
        userId,
        weekStartDate: startOfWeek,
        weekEndDate: endOfWeek,
        taskCompletionRate,
        totalStudyHours,
        subjectBreakdown,
        insights: insightsData.insights || []
      });
      
      await analytics.save();
    }
    
    res.status(200).json({
      message: 'Analytics generated successfully',
      analytics
    });
  } catch (error) {
    logger.error(`Error generating analytics: ${error.message}`);
    res.status(500).json({ 
      message: 'Error generating analytics', 
      error: error.message 
    });
  }
};

/**
 * Get analytics for a user
 * @route GET /api/analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const { week } = req.query;
    
    let startOfWeek, endOfWeek;
    
    if (week) {
      // Parse the week parameter (format: YYYY-MM-DD for the start of the week)
      startOfWeek = new Date(week);
      if (isNaN(startOfWeek.getTime())) {
        return res.status(400).json({ message: 'Invalid week format. Use YYYY-MM-DD.' });
      }
      
      endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
    } else {
      // Get current week
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      
      endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
    }
    
    // Find analytics for the specified week
    const analytics = await Analytics.findOne({
      userId,
      weekStartDate: startOfWeek,
      weekEndDate: endOfWeek
    });
    
    if (!analytics) {
      return res.status(404).json({ 
        message: 'Analytics not found for the specified week',
        weekStartDate: startOfWeek,
        weekEndDate: endOfWeek
      });
    }
    
    res.status(200).json(analytics);
  } catch (error) {
    logger.error(`Error getting analytics: ${error.message}`);
    res.status(500).json({ 
      message: 'Error getting analytics', 
      error: error.message 
    });
  }
};

/**
 * Get analytics history for a user
 * @route GET /api/analytics/history
 */
exports.getAnalyticsHistory = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const { limit = 10 } = req.query;
    
    // Find analytics history
    const analyticsHistory = await Analytics.find({ userId })
      .sort({ weekStartDate: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json(analyticsHistory);
  } catch (error) {
    logger.error(`Error getting analytics history: ${error.message}`);
    res.status(500).json({ 
      message: 'Error getting analytics history', 
      error: error.message 
    });
  }
};
