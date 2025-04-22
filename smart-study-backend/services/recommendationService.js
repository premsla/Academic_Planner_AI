const Preference = require('../models/Preference');
const Task = require('../models/Task');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Tip = require('../models/Tip');
const UserTipInteraction = require('../models/UserTipInteraction');
const StudySlot = require('../models/StudySlot');
const nlpService = require('./nlpService');

// Calculate priority score for a task based on due date, type, and complexity
const calculateTaskPriority = (task, taskMetadata) => {
  if (!task) return 0;
  
  // Base priority
  let priority = 3;
  
  // Due date factor (higher priority for closer due dates)
  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const daysUntilDue = Math.max(0, Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)));
  
  if (daysUntilDue <= 1) {
    priority += 2; // Due today or tomorrow
  } else if (daysUntilDue <= 3) {
    priority += 1; // Due within 3 days
  } else if (daysUntilDue >= 7) {
    priority -= 1; // Due in more than a week
  }
  
  // Task type factor
  if (taskMetadata && taskMetadata.taskType) {
    if (['exam', 'test', 'quiz'].includes(taskMetadata.taskType)) {
      priority += 1; // Exams are higher priority
    }
  }
  
  // Complexity factor
  if (taskMetadata && taskMetadata.complexity) {
    if (taskMetadata.complexity >= 4) {
      priority += 1; // Complex tasks need more attention
    }
  }
  
  // Cap priority between 1-5
  return Math.max(1, Math.min(5, priority));
};

// Find available time slots based on user's schedule
const findAvailableTimeSlots = async (userId, date) => {
  try {
    // Get user's classes for the day
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const classes = await Class.find({ 
      userId, 
      day_of_week: dayOfWeek 
    });
    
    // Get user's exams for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const exams = await Exam.find({
      userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    // Get already scheduled study slots
    const existingStudySlots = await StudySlot.find({
      userId,
      startTime: { $gte: startOfDay },
      endTime: { $lte: endOfDay }
    });
    
    // Define standard day hours (8 AM to 10 PM)
    const dayStart = new Date(date);
    dayStart.setHours(8, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(22, 0, 0, 0);
    
    // Create busy time blocks from classes, exams, and existing study slots
    const busyBlocks = [
      ...classes.map(cls => ({
        start: new Date(date.setHours(
          parseInt(cls.start_time.split(':')[0]),
          parseInt(cls.start_time.split(':')[1]),
          0, 0
        )),
        end: new Date(date.setHours(
          parseInt(cls.end_time.split(':')[0]),
          parseInt(cls.end_time.split(':')[1]),
          0, 0
        ))
      })),
      ...exams.map(exam => ({
        start: new Date(date.setHours(
          parseInt(exam.start_time.split(':')[0]),
          parseInt(exam.start_time.split(':')[1]),
          0, 0
        )),
        end: new Date(date.setHours(
          parseInt(exam.end_time.split(':')[0]),
          parseInt(exam.end_time.split(':')[1]),
          0, 0
        ))
      })),
      ...existingStudySlots.map(slot => ({
        start: new Date(slot.startTime),
        end: new Date(slot.endTime)
      }))
    ];
    
    // Sort busy blocks by start time
    busyBlocks.sort((a, b) => a.start - b.start);
    
    // Find free time blocks
    const freeBlocks = [];
    let currentTime = new Date(dayStart);
    
    for (const block of busyBlocks) {
      if (block.start > currentTime) {
        freeBlocks.push({
          start: new Date(currentTime),
          end: new Date(block.start)
        });
      }
      currentTime = new Date(Math.max(currentTime.getTime(), block.end.getTime()));
    }
    
    // Add final free block if there's time left in the day
    if (currentTime < dayEnd) {
      freeBlocks.push({
        start: new Date(currentTime),
        end: new Date(dayEnd)
      });
    }
    
    // Filter out blocks that are too short (less than 30 minutes)
    return freeBlocks.filter(block => {
      const durationMinutes = (block.end - block.start) / (1000 * 60);
      return durationMinutes >= 30;
    });
  } catch (error) {
    console.error('Error finding available time slots:', error);
    return [];
  }
};

// Generate study slot suggestions based on tasks and available time
const generateStudySlotSuggestions = async (userId, days = 3) => {
  try {
    // Get user preferences
    let userPreference = await Preference.findOne({ userId });
    
    // Create default preferences if none exist
    if (!userPreference) {
      userPreference = {
        studyPreferences: {
          preferredTimes: ['afternoon'],
          preferredDuration: 45
        }
      };
    }
    
    // Get user's pending tasks
    const tasks = await Task.find({
      userId,
      completed: { $ne: true }
    }).sort({ dueDate: 1 });
    
    if (tasks.length === 0) {
      return [];
    }
    
    // Analyze tasks and calculate priorities
    const analyzedTasks = tasks.map(task => {
      const metadata = nlpService.analyzeTaskDescription(task.description || task.title);
      const priority = calculateTaskPriority(task, metadata);
      
      return {
        task,
        metadata,
        priority
      };
    });
    
    // Sort tasks by priority (highest first)
    analyzedTasks.sort((a, b) => b.priority - a.priority);
    
    // Generate suggestions for the next few days
    const suggestions = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Find available time slots for this day
      const availableSlots = await findAvailableTimeSlots(userId, date);
      
      // Match tasks to available slots
      for (const analyzedTask of analyzedTasks) {
        // Skip if task is already assigned a slot for this day
        const existingSlot = suggestions.find(s => 
          s.taskId.toString() === analyzedTask.task._id.toString() &&
          new Date(s.startTime).toDateString() === date.toDateString()
        );
        
        if (existingSlot) continue;
        
        // Find best slot for this task
        const preferredDuration = userPreference.studyPreferences.preferredDuration || 45;
        const bestSlot = findBestTimeSlot(availableSlots, preferredDuration, userPreference.studyPreferences.preferredTimes);
        
        if (bestSlot) {
          // Create study slot suggestion
          const startTime = new Date(bestSlot.start);
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + preferredDuration);
          
          // Ensure end time doesn't exceed the available slot's end time
          if (endTime > bestSlot.end) {
            endTime.setTime(bestSlot.end.getTime());
          }
          
          // Calculate actual duration
          const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
          
          if (durationMinutes >= 30) { // Only add if at least 30 minutes
            suggestions.push({
              userId,
              taskId: analyzedTask.task._id,
              title: `Study ${analyzedTask.task.title || analyzedTask.task.subject}`,
              startTime,
              endTime,
              duration: durationMinutes,
              isAiGenerated: true,
              isConfirmed: false,
              priority: analyzedTask.priority,
              notes: `AI-suggested study slot for ${analyzedTask.task.title || analyzedTask.task.subject}`
            });
            
            // Update available slots by removing or shrinking the used slot
            updateAvailableSlots(availableSlots, bestSlot, startTime, endTime);
          }
        }
      }
    }
    
    return suggestions;
  } catch (error) {
    console.error('Error generating study slot suggestions:', error);
    return [];
  }
};

// Find the best time slot based on user preferences
const findBestTimeSlot = (availableSlots, preferredDuration, preferredTimes) => {
  if (availableSlots.length === 0) return null;
  
  // Convert preferred times to hour ranges
  const timeRanges = {
    morning: { start: 8, end: 12 },
    afternoon: { start: 12, end: 17 },
    evening: { start: 17, end: 20 },
    night: { start: 20, end: 23 }
  };
  
  // Default to all times if no preferences
  const timesToCheck = preferredTimes && preferredTimes.length > 0 
    ? preferredTimes 
    : ['morning', 'afternoon', 'evening', 'night'];
  
  // First try to find slots that match preferred times
  for (const timeOfDay of timesToCheck) {
    const range = timeRanges[timeOfDay];
    
    for (const slot of availableSlots) {
      const slotStartHour = slot.start.getHours();
      const slotEndHour = slot.end.getHours();
      
      // Check if slot overlaps with preferred time range
      if ((slotStartHour >= range.start && slotStartHour < range.end) || 
          (slotEndHour > range.start && slotEndHour <= range.end) ||
          (slotStartHour <= range.start && slotEndHour >= range.end)) {
        
        // Check if slot is long enough
        const durationMinutes = (slot.end - slot.start) / (1000 * 60);
        if (durationMinutes >= preferredDuration) {
          return slot;
        }
      }
    }
  }
  
  // If no preferred time slots found, return the longest available slot
  return availableSlots.sort((a, b) => 
    (b.end - b.start) - (a.end - a.start)
  )[0];
};

// Update available slots after scheduling a study session
const updateAvailableSlots = (availableSlots, usedSlot, startTime, endTime) => {
  const slotIndex = availableSlots.indexOf(usedSlot);
  if (slotIndex === -1) return;
  
  // Remove the original slot
  availableSlots.splice(slotIndex, 1);
  
  // Add back any remaining time before the study session
  if (startTime > usedSlot.start) {
    availableSlots.push({
      start: new Date(usedSlot.start),
      end: new Date(startTime)
    });
  }
  
  // Add back any remaining time after the study session
  if (endTime < usedSlot.end) {
    availableSlots.push({
      start: new Date(endTime),
      end: new Date(usedSlot.end)
    });
  }
  
  // Sort slots by start time
  availableSlots.sort((a, b) => a.start - b.start);
};

// Get personalized tips for a user based on their tasks and preferences
const getPersonalizedTips = async (userId, limit = 5) => {
  try {
    // Get user preferences
    const userPreference = await Preference.findOne({ userId });
    
    // Get user's tasks
    const tasks = await Task.find({
      userId,
      completed: { $ne: true }
    });
    
    // Get tips the user has already marked as helpful
    const helpfulTipInteractions = await UserTipInteraction.find({
      userId,
      isHelpful: true
    }).populate('tipId');
    
    // Get all tips
    const allTips = await Tip.find({});
    
    // If no tasks or preferences, return general tips
    if (!tasks.length && !userPreference) {
      return allTips
        .sort(() => 0.5 - Math.random()) // Shuffle
        .slice(0, limit);
    }
    
    // Score tips based on relevance to user's tasks and preferences
    const scoredTips = allTips.map(tip => {
      let score = 0;
      
      // Task relevance
      for (const task of tasks) {
        const taskMetadata = nlpService.analyzeTaskDescription(task.description || task.title);
        
        // Subject match
        if (tip.subjects.includes(taskMetadata.subject)) {
          score += 2;
        }
        
        // Task type match (e.g., exam tips for exam tasks)
        if (taskMetadata.taskType === 'exam' && tip.category === 'study technique') {
          score += 1;
        }
        
        // Content similarity
        const contentSimilarity = nlpService.calculateTextSimilarity(
          task.description || task.title,
          tip.title + ' ' + tip.content
        );
        score += contentSimilarity * 3;
      }
      
      // Preference relevance
      if (userPreference) {
        // Learning style match
        if (userPreference.studyPreferences.learningStyle !== 'unknown' &&
            tip.learningStyles.includes(userPreference.studyPreferences.learningStyle)) {
          score += 2;
        }
        
        // Subject preference match
        for (const subjectPref of userPreference.subjectPreferences || []) {
          if (tip.subjects.includes(subjectPref.subject)) {
            score += 1;
          }
        }
      }
      
      // Boost score for tips similar to ones the user found helpful
      for (const interaction of helpfulTipInteractions) {
        const helpfulTip = interaction.tipId;
        if (helpfulTip) {
          // Same category
          if (tip.category === helpfulTip.category) {
            score += 1;
          }
          
          // Similar content
          const contentSimilarity = nlpService.calculateTextSimilarity(
            helpfulTip.title + ' ' + helpfulTip.content,
            tip.title + ' ' + tip.content
          );
          score += contentSimilarity * 2;
        }
      }
      
      return { tip, score };
    });
    
    // Sort by score (highest first) and return top tips
    return scoredTips
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(scoredTip => scoredTip.tip);
  } catch (error) {
    console.error('Error getting personalized tips:', error);
    return [];
  }
};

module.exports = {
  generateStudySlotSuggestions,
  getPersonalizedTips
};
