const StudySlot = require('../models/StudySlot');
const Task = require('../models/Task');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Preference = require('../models/Preference');
const llmService = require('../services/llmService');
const logger = require('../utils/logger');
const config = require('../config/llm');

// Generate a smart schedule based on student data
exports.generateSmartSchedule = async (req, res) => {
  try {
    console.log('Generate Smart Schedule request received:', req.body);
    console.log('User ID from JWT:', req.userId);

    const userId = req.userId; // From JWT middleware
    // Default to 30 days if not specified
    const { days = 30, includeClasses = true, includeTasks = true, includeExams = true } = req.body;

    if (!userId) {
      console.error('User ID not found in token');
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    console.log(`Generating smart schedule for user ${userId} for ${days} days`);

    // Fetch student data
    console.log('Fetching student data from database...');

    // Prepare promises based on include flags
    const promises = [];

    // Always include classes as they are required for scheduling
    promises.push(Class.find({ userId }));

    // Conditionally include tasks and exams
    if (includeTasks) {
      promises.push(Task.find({ userId, completed: { $ne: true } }));
    } else {
      promises.push([]);
    }

    if (includeExams) {
      promises.push(Exam.find({ userId }));
    } else {
      promises.push([]);
    }

    // Always include preferences
    promises.push(Preference.findOne({ userId }) || { userId });

    // Execute all promises
    const [classes, tasks, exams, preferences] = await Promise.all(promises);

    console.log(`Found ${tasks.length} tasks, ${classes.length} classes, ${exams.length} exams`);
    console.log('Preferences:', preferences ? 'Found' : 'Not found');

    // Check if we have the minimum required data (classes)
    if (!classes || classes.length === 0) {
      return res.status(400).json({
        message: 'No class data available. Please add your classes before generating a schedule.'
      });
    }

    // Generate study schedule using LLM service
    console.log('Calling LLM service to generate study schedule...');
    const scheduleData = await llmService.generateStudySchedule({
      tasks,
      classes,
      exams,
      preferences,
      days
    });

    console.log(`LLM service returned ${scheduleData.studySlots?.length || 0} study slots`);
    console.log('Source:', scheduleData.source);

    // Delete existing unconfirmed study slots
    console.log('Deleting existing unconfirmed study slots...');
    const deleteResult = await StudySlot.deleteMany({ userId, isConfirmed: false });
    console.log(`Deleted ${deleteResult.deletedCount} existing study slots`);

    // Save generated study slots to database
    console.log('Saving new study slots to database...');
    const studySlots = [];

    // Create a map to track unique time slots to prevent duplicates
    const timeSlotMap = new Map();

    // Function to generate consecutive study slots for a day
    const generateConsecutiveSlots = (baseSlotData, subjectData) => {
      const slots = [];
      const startTime = new Date(baseSlotData.startTime);
      const dayOfWeek = startTime.getDay(); // 0 = Sunday, 6 = Saturday
      const date = startTime.getDate();

      // Check if it's a Sunday (no study slots)
      if (dayOfWeek === 0) {
        console.log('Skipping Sunday - no slots generated');
        return slots;
      }

      // Check if it's an odd Saturday (no study slots)
      if (dayOfWeek === 6) {
        // Calculate if it's an odd or even Saturday
        // Odd Saturdays are the 1st, 3rd, 5th Saturdays of the month
        const weekNumber = Math.ceil(date / 7);
        if (weekNumber % 2 === 1) { // Odd week number
          console.log('Skipping odd Saturday - no slots generated');
          return slots;
        }

        // For even Saturdays, create slots throughout the day (9 AM to 9 PM)
        console.log('Generating slots for even Saturday (9 AM to 9 PM)');
        const saturdayStartHour = 9; // 9 AM
        const saturdayEndHour = 21; // 9 PM

        // Create slots for each subject with 1-hour duration
        for (let hour = saturdayStartHour; hour < saturdayEndHour; hour++) {
          // Rotate through subjects
          const subjectIndex = (hour - saturdayStartHour) % subjectData.length;
          const subject = subjectData[subjectIndex];

          const slotStartTime = new Date(startTime);
          slotStartTime.setHours(hour, 0, 0, 0);

          const slotEndTime = new Date(slotStartTime);
          slotEndTime.setHours(hour + 1, 0, 0, 0);

          const newSlot = {
            ...baseSlotData,
            title: `Study ${subject.name || subject.subject}: Review Today's Material`,
            startTime: slotStartTime.toISOString(),
            endTime: slotEndTime.toISOString(),
            duration: 60, // 1 hour
            subject: subject.name || subject.subject,
            subjectId: subject._id
          };

          slots.push(newSlot);
        }

        return slots;
      }

      // For weekdays (Monday-Friday), create slots from 6 PM to 10 PM
      console.log('Generating slots for weekday (6 PM to 10 PM)');
      const weekdayStartHour = 18; // 6 PM
      const weekdayEndHour = 22; // 10 PM

      // Create slots for each subject with 1-hour duration
      for (let hour = weekdayStartHour; hour < weekdayEndHour; hour++) {
        // Rotate through subjects
        const subjectIndex = (hour - weekdayStartHour) % subjectData.length;
        const subject = subjectData[subjectIndex];

        const slotStartTime = new Date(startTime);
        slotStartTime.setHours(hour, 0, 0, 0);

        const slotEndTime = new Date(slotStartTime);
        slotEndTime.setHours(hour + 1, 0, 0, 0);

        const newSlot = {
          ...baseSlotData,
          title: `Study ${subject.name || subject.subject}: Review Today's Material`,
          startTime: slotStartTime.toISOString(),
          endTime: slotEndTime.toISOString(),
          duration: 60, // 1 hour
          subject: subject.name || subject.subject,
          subjectId: subject._id
        };

        slots.push(newSlot);
      }

      return slots;
    };

    // Function to adjust study slot times according to scheduling rules
    const adjustStudySlotTime = (slotData) => {
      const startTime = new Date(slotData.startTime);
      const dayOfWeek = startTime.getDay(); // 0 = Sunday, 6 = Saturday
      const month = startTime.getMonth();
      const date = startTime.getDate();

      // Check if it's a Sunday (no study slots)
      if (dayOfWeek === 0) {
        console.log('Skipping Sunday slot');
        return null;
      }

      // Check if it's an odd Saturday (no study slots)
      if (dayOfWeek === 6) {
        // Calculate if it's an odd or even Saturday
        // Odd Saturdays are the 1st, 3rd, 5th Saturdays of the month
        const weekNumber = Math.ceil(date / 7);
        if (weekNumber % 2 === 1) { // Odd week number
          console.log('Skipping odd Saturday slot');
          return null;
        }

        // For even Saturdays, allow slots throughout the day (no adjustment needed)
        console.log('Keeping even Saturday slot');
        return slotData;
      }

      // For weekdays (Monday-Friday), ensure study slots are after 6 PM
      const hour = startTime.getHours();
      if (hour < 18) { // Before 6 PM
        console.log(`Adjusting weekday slot from ${hour}:00 to 18:00`);
        startTime.setHours(18, 0, 0, 0); // Set to 6 PM

        // Update the start time
        slotData.startTime = startTime.toISOString();

        // Update the end time based on duration
        const endTime = new Date(startTime);
        endTime.setMinutes(startTime.getMinutes() + slotData.duration);
        slotData.endTime = endTime.toISOString();
      }

      return slotData;
    };

    // Create or update analytics collection for tracking user actions
    const Analytics = require('../models/Analytics');

    // Check if analytics already exists for this user
    let analytics = await Analytics.findOne({ userId }).sort({ generatedAt: -1 });

    if (!analytics) {
      // Create new analytics if none exists
      analytics = new Analytics({
        userId,
        generatedAt: new Date(),
        weekStartDate: null, // Set to null to avoid unique constraint issues
        totalSlots: 0,
        confirmedSlots: 0,
        completedSlots: 0,
        deletedSlots: 0,
        subjects: {}
      });
    } else {
      // Update existing analytics
      analytics.generatedAt = new Date();
    }

    // Initialize or update analytics for each subject
    classes.forEach(cls => {
      const subject = cls.name || cls.subject;
      if (subject) {
        if (!analytics.subjects[subject]) {
          analytics.subjects[subject] = {
            totalSlots: 0,
            confirmedSlots: 0,
            completedSlots: 0,
            deletedSlots: 0
          };
        }
      }
    });

    // Save analytics
    await analytics.save();

    // Generate consecutive study slots for each day in the requested period
    console.log('Generating consecutive study slots for the next', days, 'days');
    const today = new Date();
    const generatedSlots = [];

    // Generate slots for each day in the requested period
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      currentDate.setHours(0, 0, 0, 0); // Start of day

      // Base slot data template
      const baseSlotData = {
        userId,
        duration: 60, // Default 1 hour
        isAiGenerated: true,
        isConfirmed: false,
        priority: 3,
        notes: '',
        source: scheduleData.source || 'gemini'
      };

      // Generate slots for this day
      const dailySlots = generateConsecutiveSlots({
        ...baseSlotData,
        startTime: currentDate.toISOString()
      }, classes);

      // Add to our collection
      generatedSlots.push(...dailySlots);
    }

    console.log(`Generated ${generatedSlots.length} consecutive study slots`);

    // Process the generated slots
    for (const slotData of generatedSlots) {
      // Find the associated task
      let taskId = slotData.taskId ||
        (tasks.find(t =>
          slotData.subject && t.subject && slotData.subject.toLowerCase().includes(t.subject.toLowerCase()) ||
          (t.title && slotData.title && slotData.title.toLowerCase().includes(t.title.toLowerCase()))
        )?._id);

      // Update analytics
      if (slotData.subject && analytics.subjects[slotData.subject]) {
        analytics.subjects[slotData.subject].totalSlots++;
        analytics.totalSlots++;
      }

      console.log(`Processing study slot: ${slotData.title}`);

      // If no task is found, use the first task as a fallback or create a dummy task
      if (!taskId) {
        if (tasks.length > 0) {
          taskId = tasks[0]._id;
          console.log(`No matching task found for "${slotData.title}", using first task as fallback`);
        } else {
          // Create a dummy task if no tasks exist
          const dummyTask = new Task({
            userId,
            title: 'Study Session',
            subject: slotData.subject || 'General',
            description: 'Auto-generated task for study slot',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            priority: 'Medium',
            duration: slotData.duration || 60,
            status: 'pending'
          });
          await dummyTask.save();
          taskId = dummyTask._id;
          console.log(`Created dummy task for "${slotData.title}"`);
        }
      }

      // Create study slot
      console.log('Creating study slot with taskId:', taskId || 'none');

      // Prepare study slot data
      const studySlotData = {
        userId,
        title: slotData.title,
        startTime: new Date(slotData.startTime),
        endTime: new Date(slotData.endTime || new Date(new Date(slotData.startTime).getTime() + slotData.duration * 60000)),
        duration: slotData.duration || Math.round((new Date(slotData.endTime) - new Date(slotData.startTime)) / 60000),
        isAiGenerated: true,
        isConfirmed: false,
        priority: slotData.priority || 3,
        notes: slotData.notes || '',
        source: scheduleData.source || 'gemini'
      };

      // Add taskId only if it exists
      if (taskId) {
        studySlotData.taskId = taskId;
      }

      const studySlot = new StudySlot(studySlotData);

      try {
        await studySlot.save();
        console.log('Study slot saved successfully with ID:', studySlot._id);
        studySlots.push(studySlot);
      } catch (error) {
        console.error('Error saving study slot:', error.message);
      }
    }

    console.log(`Successfully generated ${studySlots.length} study slots`);

    res.status(200).json({
      message: 'Smart schedule generated successfully',
      source: scheduleData.source || 'gemini',
      count: studySlots.length,
      studySlots
    });
  } catch (error) {
    logger.error(`Error generating smart schedule: ${error.message}`);
    res.status(500).json({
      message: 'Error generating smart schedule',
      error: error.message
    });
  }
};

// Get AI-suggested study slots
exports.getSmartSchedule = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const days = req.query.days ? parseInt(req.query.days) : 3;

    console.log(`Getting smart schedule for user ${userId} for ${days} days`);

    // Get study slots that are AI-generated and not confirmed
    const suggestions = await StudySlot.find({
      userId,
      isAiGenerated: true,
      isConfirmed: false
    }).populate('taskId');

    console.log(`Found ${suggestions.length} study slot suggestions`);

    res.status(200).json(suggestions);
  } catch (error) {
    logger.error(`Error getting smart schedule: ${error.message}`);
    res.status(500).json({ message: 'Error getting smart schedule', error: error.message });
  }
};

// Confirm a suggested study slot
exports.confirmStudySlot = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const { slotId } = req.params;

    // Find the study slot
    const studySlot = await StudySlot.findOne({ _id: slotId, userId }).populate('taskId');

    if (!studySlot) {
      return res.status(404).json({ message: 'Study slot not found' });
    }

    // Update the study slot
    studySlot.isConfirmed = true;
    await studySlot.save();

    // Update analytics
    try {
      const Analytics = require('../models/Analytics');
      const latestAnalytics = await Analytics.findOne({ userId }).sort({ generatedAt: -1 });

      if (latestAnalytics) {
        // Increment confirmed slots count
        latestAnalytics.confirmedSlots += 1;

        // Get subject from study slot
        const subject = studySlot.subject ||
                       (studySlot.taskId && studySlot.taskId.subject) ||
                       (studySlot.title && studySlot.title.split(' ')[1]);

        // Update subject-specific analytics if subject exists
        if (subject && latestAnalytics.subjects && latestAnalytics.subjects[subject]) {
          latestAnalytics.subjects[subject].confirmedSlots += 1;
        }

        await latestAnalytics.save();
        console.log(`Updated analytics for confirmed slot: ${slotId}`);
      }
    } catch (analyticsError) {
      console.error('Error updating analytics:', analyticsError.message);
      // Continue with the response even if analytics update fails
    }

    res.status(200).json({ message: 'Study slot confirmed', studySlot });
  } catch (error) {
    logger.error(`Error confirming study slot: ${error.message}`);
    res.status(500).json({ message: 'Error confirming study slot', error: error.message });
  }
};

// Save a new study slot
exports.saveStudySlot = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const {
      taskId,
      title,
      startTime,
      endTime,
      duration,
      priority,
      notes
    } = req.body;

    // Validate required fields
    if (!taskId || !title || !startTime || !endTime || !duration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify task exists and belongs to user
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Create new study slot
    const newStudySlot = new StudySlot({
      userId,
      taskId,
      title,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      isAiGenerated: true,
      isConfirmed: true,
      priority: priority || 3,
      notes
    });

    await newStudySlot.save();

    res.status(201).json({ message: 'Study slot created', studySlot: newStudySlot });
  } catch (error) {
    logger.error(`Error saving study slot: ${error.message}`);
    res.status(500).json({ message: 'Error saving study slot', error: error.message });
  }
};

// Get all confirmed study slots
exports.getConfirmedStudySlots = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware

    const studySlots = await StudySlot.find({
      userId,
      isConfirmed: true
    }).populate('taskId');

    res.status(200).json(studySlots);
  } catch (error) {
    logger.error(`Error getting confirmed study slots: ${error.message}`);
    res.status(500).json({ message: 'Error getting confirmed study slots', error: error.message });
  }
};

// Delete a study slot
exports.deleteStudySlot = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const { slotId } = req.params;

    // Find the study slot first to get its data before deletion
    const studySlot = await StudySlot.findOne({ _id: slotId, userId }).populate('taskId');

    if (!studySlot) {
      return res.status(404).json({ message: 'Study slot not found' });
    }

    // Get subject information before deleting
    const subject = studySlot.subject ||
                   (studySlot.taskId && studySlot.taskId.subject) ||
                   (studySlot.title && studySlot.title.split(' ')[1]);

    // Delete the study slot
    await StudySlot.findOneAndDelete({ _id: slotId, userId });

    // Update analytics
    try {
      const Analytics = require('../models/Analytics');
      const latestAnalytics = await Analytics.findOne({ userId }).sort({ generatedAt: -1 });

      if (latestAnalytics) {
        // Increment deleted slots count
        latestAnalytics.deletedSlots += 1;

        // Update subject-specific analytics if subject exists
        if (subject && latestAnalytics.subjects && latestAnalytics.subjects[subject]) {
          latestAnalytics.subjects[subject].deletedSlots += 1;
        }

        await latestAnalytics.save();
        console.log(`Updated analytics for deleted slot: ${slotId}`);
      }
    } catch (analyticsError) {
      console.error('Error updating analytics:', analyticsError.message);
      // Continue with the response even if analytics update fails
    }

    res.status(200).json({ message: 'Study slot deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting study slot: ${error.message}`);
    res.status(500).json({ message: 'Error deleting study slot', error: error.message });
  }
};

/**
 * Mark a study slot as completed
 * @route PUT /api/smart-schedule/:slotId/complete
 */
exports.completeStudySlot = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const { slotId } = req.params;

    // Find the study slot
    const studySlot = await StudySlot.findOne({ _id: slotId, userId }).populate('taskId');

    if (!studySlot) {
      return res.status(404).json({ message: 'Study slot not found' });
    }

    // Update the study slot
    studySlot.isCompleted = true;
    await studySlot.save();

    // Update analytics
    try {
      const Analytics = require('../models/Analytics');
      const latestAnalytics = await Analytics.findOne({ userId }).sort({ generatedAt: -1 });

      if (latestAnalytics) {
        // Increment completed slots count
        latestAnalytics.completedSlots += 1;

        // Get subject from study slot
        const subject = studySlot.subject ||
                       (studySlot.taskId && studySlot.taskId.subject) ||
                       (studySlot.title && studySlot.title.split(' ')[1]);

        // Update subject-specific analytics if subject exists
        if (subject && latestAnalytics.subjects && latestAnalytics.subjects[subject]) {
          latestAnalytics.subjects[subject].completedSlots += 1;
        }

        // Update total study hours
        latestAnalytics.totalStudyHours += (studySlot.duration / 60); // Convert minutes to hours

        await latestAnalytics.save();
        console.log(`Updated analytics for completed slot: ${slotId}`);
      }
    } catch (analyticsError) {
      console.error('Error updating analytics:', analyticsError.message);
      // Continue with the response even if analytics update fails
    }

    res.status(200).json({
      message: 'Study slot marked as completed',
      studySlot
    });
  } catch (error) {
    logger.error(`Error completing study slot: ${error.message}`);
    res.status(500).json({
      message: 'Error completing study slot',
      error: error.message
    });
  }
};

/**
 * Create a custom study slot
 * @route POST /api/smart-schedule/custom
 */
exports.createCustomStudySlot = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const {
      taskId,
      title,
      startTime,
      endTime,
      duration,
      priority,
      notes
    } = req.body;

    // Validate required fields
    if (!taskId || !title || !startTime || (!endTime && !duration)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify task exists and belongs to user
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Calculate endTime if not provided
    let calculatedEndTime = endTime;
    if (!endTime && duration) {
      calculatedEndTime = new Date(new Date(startTime).getTime() + duration * 60000);
    }

    // Calculate duration if not provided
    let calculatedDuration = duration;
    if (!duration && endTime) {
      calculatedDuration = Math.round((new Date(endTime) - new Date(startTime)) / 60000);
    }

    // Create new study slot
    const studySlot = new StudySlot({
      userId,
      taskId,
      title,
      startTime: new Date(startTime),
      endTime: new Date(calculatedEndTime),
      duration: calculatedDuration,
      isAiGenerated: false,
      isConfirmed: true,
      priority: priority || 3,
      notes: notes || '',
      source: 'manual'
    });

    await studySlot.save();

    res.status(201).json({
      message: 'Custom study slot created',
      studySlot
    });
  } catch (error) {
    logger.error(`Error creating custom study slot: ${error.message}`);
    res.status(500).json({
      message: 'Error creating custom study slot',
      error: error.message
    });
  }
};
