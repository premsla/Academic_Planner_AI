/**
 * LLM Service
 *
 * This service handles interactions with LLM providers (Gemini, OpenAI, Claude)
 * based on the configuration in config/llm.js.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');
const axios = require('axios');
const config = require('../config/llm');
const logger = require('../utils/logger');

class LLMService {
  constructor() {
    this.provider = config.provider;
    this.config = config.providers[this.provider];
    this.fallbackEnabled = config.fallback.enabled;
    this.logErrors = config.fallback.logErrors;

    this.initializeClient();
  }

  initializeClient() {
    try {
      switch (this.provider) {
        case 'gemini':
          if (!this.config.apiKey) {
            throw new Error('Gemini API key is missing');
          }
          this.client = new GoogleGenerativeAI(this.config.apiKey);
          this.model = this.client.getGenerativeModel({ model: this.config.model });
          break;

        case 'openai':
          if (!this.config.apiKey) {
            throw new Error('OpenAI API key is missing');
          }
          this.client = new OpenAI({ apiKey: this.config.apiKey });
          break;

        case 'anthropic':
          if (!this.config.apiKey) {
            throw new Error('Anthropic API key is missing');
          }
          // Anthropic doesn't have an official Node.js client, so we'll use axios
          this.client = axios.create({
            baseURL: 'https://api.anthropic.com',
            headers: {
              'x-api-key': this.config.apiKey,
              'Content-Type': 'application/json'
            }
          });
          break;

        default:
          throw new Error(`Unsupported LLM provider: ${this.provider}`);
      }
    } catch (error) {
      if (this.logErrors) {
        logger.error(`Failed to initialize LLM client: ${error.message}`);
      }
      if (!this.fallbackEnabled) {
        throw error;
      }
    }
  }

  /**
   * Generate a response from the LLM
   * @param {string} prompt - The prompt to send to the LLM
   * @param {Object} options - Additional options for the LLM
   * @returns {Promise<string>} - The generated response
   */
  async generateResponse(prompt, options = {}) {
    try {
      switch (this.provider) {
        case 'gemini':
          return await this.generateGeminiResponse(prompt, options);

        case 'openai':
          return await this.generateOpenAIResponse(prompt, options);

        case 'anthropic':
          return await this.generateAnthropicResponse(prompt, options);

        default:
          throw new Error(`Unsupported LLM provider: ${this.provider}`);
      }
    } catch (error) {
      if (this.logErrors) {
        logger.error(`LLM generation error: ${error.message}`);
      }
      if (this.fallbackEnabled) {
        return this.fallbackResponse(prompt, options);
      }
      throw error;
    }
  }

  /**
   * Generate a response from Gemini
   * @param {string} prompt - The prompt to send to Gemini
   * @param {Object} options - Additional options for Gemini
   * @returns {Promise<string>} - The generated response
   */
  async generateGeminiResponse(prompt, options = {}) {
    try {
      console.log('Generating Gemini response with prompt length:', prompt.length);

      // Check if the API key is valid
      if (!this.config.apiKey || this.config.apiKey === 'YOUR_GEMINI_API_KEY') {
        console.error('Invalid Gemini API key');
        throw new Error('Invalid Gemini API key');
      }

      // Configure generation parameters
      const generationConfig = {
        temperature: options.temperature || this.config.temperature || 0.7,
        topP: options.topP || this.config.topP || 0.8,
        topK: options.topK || this.config.topK || 40,
        maxOutputTokens: options.maxTokens || this.config.maxTokens || 2048,
      };

      console.log('Generation config:', generationConfig);

      // If the prompt is too long, truncate it
      let processedPrompt = prompt;
      if (prompt.length > 30000) {
        console.log('Prompt is too long, truncating...');
        processedPrompt = prompt.substring(0, 30000);
      }

      // Add explicit instructions for JSON formatting
      if (prompt.includes('JSON') || prompt.includes('json')) {
        processedPrompt += '\n\nIMPORTANT: Your response MUST be valid JSON. Do not include any explanatory text before or after the JSON.\n';
      }

      // Generate the response
      console.log('Calling Gemini API...');
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: processedPrompt }] }],
        generationConfig,
      });

      console.log('Gemini API response received');
      const responseText = result.response.text();
      console.log('Response length:', responseText.length);

      return responseText;
    } catch (error) {
      console.error(`Gemini generation error: ${error.message}`);
      if (this.logErrors) {
        logger.error(`Gemini generation error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Generate a response from OpenAI
   * @param {string} prompt - The prompt to send to OpenAI
   * @param {Object} options - Additional options for OpenAI
   * @returns {Promise<string>} - The generated response
   */
  async generateOpenAIResponse(prompt, options = {}) {
    try {
      const completion = await this.client.chat.completions.create({
        model: options.model || this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || this.config.temperature,
        max_tokens: options.maxTokens || this.config.maxTokens,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      if (this.logErrors) {
        logger.error(`OpenAI generation error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Generate a response from Anthropic (Claude)
   * @param {string} prompt - The prompt to send to Anthropic
   * @param {Object} options - Additional options for Anthropic
   * @returns {Promise<string>} - The generated response
   */
  async generateAnthropicResponse(prompt, options = {}) {
    try {
      const response = await this.client.post('/v1/messages', {
        model: options.model || this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || this.config.temperature,
        max_tokens: options.maxTokens || this.config.maxTokens,
      });

      return response.data.content[0].text;
    } catch (error) {
      if (this.logErrors) {
        logger.error(`Anthropic generation error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fallback response when LLM generation fails
   * @param {string} prompt - The original prompt
   * @param {Object} options - The original options
   * @returns {string} - A fallback response
   */
  fallbackResponse(prompt, options) {
    // Extract data from the prompt to create a more meaningful fallback
    if (prompt.includes('schedule') || prompt.includes('study slot')) {
      // Try to extract class data from the prompt
      const classesMatch = prompt.match(/CLASSES:\s*(\[.*?\])/s);
      let classes = [];

      if (classesMatch && classesMatch[1]) {
        try {
          classes = JSON.parse(classesMatch[1]);
          console.log('Successfully extracted classes from prompt:', classes.length);
        } catch (error) {
          console.error('Failed to parse classes from prompt:', error.message);
        }
      }

      // If we have classes, generate study slots based on them
      if (classes.length > 0) {
        const studySlots = [];
        const now = new Date();

        // Generate study slots for each class for the next 7 days
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const currentDate = new Date(now);
          currentDate.setDate(now.getDate() + dayOffset);

          // Get day of week (0 = Sunday, 6 = Saturday)
          const dayOfWeek = currentDate.getDay();
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

          // Skip Sundays and odd Saturdays
          if (dayOfWeek === 0 || (dayOfWeek === 6 && Math.floor(currentDate.getDate() / 7) % 2 === 0)) {
            continue;
          }

          // Find classes for this day
          const classesForDay = classes.filter(c => c.day_of_week === dayNames[dayOfWeek]);

          for (const classItem of classesForDay) {
            // Create study slot after class
            const [endHour, endMinute] = classItem.end_time.split(':').map(Number);

            // Schedule study 1-2 hours after class ends
            const startTime = new Date(currentDate);
            startTime.setHours(endHour + 1, endMinute, 0, 0);

            // If class ends after 8 PM, schedule for next morning
            if (endHour >= 20) {
              startTime.setDate(startTime.getDate() + 1);
              startTime.setHours(8, 0, 0, 0);
            }

            const endTime = new Date(startTime);
            endTime.setMinutes(startTime.getMinutes() + 60);

            studySlots.push({
              title: `Study ${classItem.subject}: Review Today's Material`,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              duration: 60,
              priority: 3,
              notes: `Review material from today's ${classItem.subject} class`
            });
          }
        }

        return JSON.stringify({
          message: 'Generated using fallback system based on your class schedule',
          studySlots: studySlots.length > 0 ? studySlots : [
            {
              title: 'Study Session',
              startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
              endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
              duration: 60,
              priority: 3,
              notes: 'This is a fallback study slot. Please try again later for AI-generated slots.'
            }
          ]
        });
      } else {
        return JSON.stringify({
          message: 'Generated using fallback system due to LLM service unavailability',
          studySlots: [
            {
              title: 'Study Session',
              startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
              endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
              duration: 60,
              priority: 3,
              notes: 'This is a fallback study slot. Please try again later for AI-generated slots.'
            }
          ]
        });
      }
    } else if (prompt.includes('tip') || prompt.includes('advice')) {
      return JSON.stringify({
        message: 'Generated using fallback system due to LLM service unavailability',
        tips: [
          {
            title: 'Effective Study Technique',
            content: 'Break your study sessions into 25-minute focused blocks with 5-minute breaks (Pomodoro Technique).',
            category: 'productivity'
          }
        ]
      });
    } else if (prompt.includes('analytics') || prompt.includes('insight')) {
      return JSON.stringify({
        message: 'Generated using fallback system due to LLM service unavailability',
        insights: [
          {
            text: 'Try to maintain a consistent study schedule to improve retention.',
            category: 'suggestion'
          }
        ]
      });
    } else {
      return JSON.stringify({
        message: 'Generated using fallback system due to LLM service unavailability',
        content: 'The AI service is currently unavailable. Please try again later.'
      });
    }
  }

  /**
   * Generate a study schedule
   * @param {Object} data - Student data including tasks, classes, exams, preferences
   * @returns {Promise<Object>} - The generated study schedule
   */
  async generateStudySchedule(data) {
    const { tasks = [], classes = [], exams = [], preferences = {}, days = 30 } = data;

    console.log('Generating study schedule with data:');
    console.log('Tasks:', tasks.length > 0 ? JSON.stringify(tasks.slice(0, 2)) + '... (truncated)' : 'No tasks');
    console.log('Classes:', classes.length > 0 ? JSON.stringify(classes.slice(0, 2)) + '... (truncated)' : 'No classes');
    console.log('Exams:', exams.length > 0 ? JSON.stringify(exams) : 'No exams');
    console.log('Preferences:', preferences ? JSON.stringify(preferences) : 'No preferences');
    console.log('Days:', days);

    // Check if we have the minimum required data (classes)
    if (!classes || classes.length === 0) {
      console.log('No class data available, using generic fallback schedule');
      return {
        source: 'rule-based',
        message: 'Generated using fallback system due to missing class data',
        studySlots: this.generateFallbackSchedule(data)
      };
    }

    // Construct the prompt for the LLM
    const prompt = `
    You are an AI academic planner assistant. Generate a personalized study schedule for a student based on the following information:

    TASKS:
    ${JSON.stringify(tasks)}

    CLASSES:
    ${JSON.stringify(classes)}

    EXAMS:
    ${JSON.stringify(exams)}

    PREFERENCES:
    ${JSON.stringify(preferences)}

    SCHEDULING RULES:
    1. Weekdays (Monday-Friday): Plan study slots ONLY after working hours (after 6 PM).
    2. Odd Saturdays and ALL Sundays: Treat as leave days (no study slots).
    3. Even Saturdays: Plan study slots throughout the day (morning, afternoon, and evening).
    4. For weekdays, prioritize evening slots (6-10 PM) with appropriate breaks for meals (${preferences?.dailyRoutine?.mealTime || 60} minutes).
    5. For even Saturdays, include morning study slots (9-11 AM), afternoon slots (2-4 PM), and evening slots (6-8 PM) with breaks for play time (${preferences?.dailyRoutine?.playTime || 60} minutes).
    6. Prioritize high-impact tasks (exams due soon) using a weighted scoring system (exams: weight 0.8, assignments: weight 0.5).
    7. Consider student energy levels inferred from task completion rates (lower completion rate → shorter study slots).

    Generate a study schedule for the next ${days} days. For each study slot, provide:
    1. Title (e.g., "Study Physics Chapter 5")
    2. Start time (ISO format)
    3. Duration (in minutes)
    4. Priority (1-5 scale, 5 being highest)
    5. Notes (optional)

    Return the response as a JSON object with an array of study slots. Each slot should have the properties: title, startTime, endTime, duration, taskId (if applicable), priority, and notes.

    IMPORTANT REQUIREMENTS:
    1. You MUST return at least 5 study slots, even if there are limited tasks or exams.
    2. If no tasks or exams are provided, create study slots for each subject from the classes (1-hour slots after class times).
    3. Ensure the schedule follows the specified rules for weekdays, weekends, and time preferences.
    4. Make sure to generate a full 30-day schedule with appropriate distribution of study slots.
    5. Return the response in valid JSON format with an array of studySlots.
    `;

    console.log('Prompt for LLM:', prompt);

    try {
      const response = await this.generateResponse(prompt);
      console.log('Raw LLM response:', response);

      // Parse the response as JSON
      let parsedResponse;
      try {
        // First, try to extract and parse JSON array
        const arrayMatch = response.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          console.log('Extracted array match:', arrayMatch[0]);
          const studySlots = JSON.parse(arrayMatch[0]);
          parsedResponse = { studySlots };
        }
        // If not an array, try to extract and parse JSON object
        else {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            console.log('Extracted JSON match:', jsonMatch[0]);
            parsedResponse = JSON.parse(jsonMatch[0]);
          } else {
            // If no JSON object or array found, try to parse the entire response
            parsedResponse = JSON.parse(response);
          }
        }

        console.log('Parsed response:', parsedResponse);

        // Ensure studySlots exists and is an array
        if (!parsedResponse.studySlots || !Array.isArray(parsedResponse.studySlots) || parsedResponse.studySlots.length === 0) {
          console.log('No study slots found in response, using fallback');
          parsedResponse.studySlots = this.generateFallbackSchedule(data);
        }
      } catch (error) {
        console.error(`Failed to parse LLM response as JSON: ${error.message}`);
        if (this.logErrors) {
          logger.error(`Failed to parse LLM response as JSON: ${error.message}`);
        }

        // If parsing fails, return a structured fallback
        return {
          source: this.provider,
          message: 'Failed to parse LLM response as JSON',
          studySlots: this.generateFallbackSchedule(data)
        };
      }

      return {
        source: this.provider,
        ...parsedResponse
      };
    } catch (error) {
      if (this.logErrors) {
        logger.error(`Failed to generate study schedule: ${error.message}`);
      }

      // If LLM generation fails, return a fallback schedule
      return {
        source: 'rule-based',
        message: 'Generated using fallback system due to LLM service unavailability',
        studySlots: this.generateFallbackSchedule(data)
      };
    }
  }

  /**
   * Generate personalized study tips
   * @param {Object} data - Student data including tasks, classes, exams, preferences, feedback
   * @returns {Promise<Object>} - The generated study tips
   */
  async generateStudyTips(data) {
    const { tasks, classes, exams, preferences, feedback, limit = 5 } = data;

    // Construct the prompt for the LLM
    const prompt = `
    You are an AI academic planner assistant. Generate personalized study tips for a student based on the following information:

    TASKS:
    ${JSON.stringify(tasks)}

    CLASSES:
    ${JSON.stringify(classes)}

    EXAMS:
    ${JSON.stringify(exams)}

    PREFERENCES:
    ${JSON.stringify(preferences)}

    PREVIOUS FEEDBACK:
    ${JSON.stringify(feedback)}

    Generate ${limit} personalized study tips tailored to the student's context. For each tip, provide:
    1. Title (brief, catchy)
    2. Content (detailed explanation)
    3. Category (one of: productivity, study technique, subject specific, time management, motivation, general)
    4. Tags (relevant keywords)
    5. Subjects (if applicable)

    Return the response as a JSON object with an array of tips. Each tip should have the properties: title, content, category, tags, and subjects.
    `;

    try {
      const response = await this.generateResponse(prompt);

      // Parse the response as JSON
      let parsedResponse;
      try {
        // Extract JSON if the response contains text before or after the JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(response);
        }
      } catch (error) {
        if (this.logErrors) {
          logger.error(`Failed to parse LLM response as JSON: ${error.message}`);
        }

        // If parsing fails, return a structured fallback
        return {
          source: this.provider,
          message: 'Failed to parse LLM response as JSON',
          tips: this.generateFallbackTips(data)
        };
      }

      return {
        source: this.provider,
        ...parsedResponse
      };
    } catch (error) {
      if (this.logErrors) {
        logger.error(`Failed to generate study tips: ${error.message}`);
      }

      // If LLM generation fails, return fallback tips
      return {
        source: 'rule-based',
        message: 'Generated using fallback system due to LLM service unavailability',
        tips: this.generateFallbackTips(data)
      };
    }
  }

  /**
   * Generate analytics insights
   * @param {Object} data - Student analytics data
   * @returns {Promise<Object>} - The generated insights
   */
  async generateAnalyticsInsights(data) {
    const { taskCompletionRate, totalStudyHours, subjectBreakdown, preferences } = data;

    // Construct the prompt for the LLM
    const prompt = `
    You are an AI academic planner assistant. Generate insights based on the student's analytics data:

    TASK COMPLETION RATE: ${taskCompletionRate}%

    TOTAL STUDY HOURS: ${totalStudyHours} hours

    SUBJECT BREAKDOWN:
    ${JSON.stringify(subjectBreakdown)}

    PREFERENCES:
    ${JSON.stringify(preferences)}

    Generate 3-5 insights based on this data. For each insight, provide:
    1. Text (the insight itself)
    2. Category (one of: achievement, improvement, suggestion, warning)

    Return the response as a JSON object with an array of insights. Each insight should have the properties: text and category.
    `;

    try {
      const response = await this.generateResponse(prompt);

      // Parse the response as JSON
      let parsedResponse;
      try {
        // Extract JSON if the response contains text before or after the JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(response);
        }
      } catch (error) {
        if (this.logErrors) {
          logger.error(`Failed to parse LLM response as JSON: ${error.message}`);
        }

        // If parsing fails, return a structured fallback
        return {
          source: this.provider,
          message: 'Failed to parse LLM response as JSON',
          insights: this.generateFallbackInsights(data)
        };
      }

      return {
        source: this.provider,
        ...parsedResponse
      };
    } catch (error) {
      if (this.logErrors) {
        logger.error(`Failed to generate analytics insights: ${error.message}`);
      }

      // If LLM generation fails, return fallback insights
      return {
        source: 'rule-based',
        message: 'Generated using fallback system due to LLM service unavailability',
        insights: this.generateFallbackInsights(data)
      };
    }
  }

  /**
   * Generate a fallback schedule when LLM generation fails
   * @param {Object} data - Student data
   * @returns {Array} - Fallback study slots
   */
  generateFallbackSchedule(data) {
    const { tasks = [], exams = [], classes = [], days = 30 } = data;
    const studySlots = [];
    const today = new Date();

    // Create a set to track unique slots and prevent duplicates
    const uniqueSlotKeys = new Set();

    console.log('Generating fallback schedule with:', {
      tasksCount: tasks.length,
      examsCount: exams.length,
      classesCount: classes.length,
      days: days
    });

    // Log the actual class data to help with debugging
    if (classes.length > 0) {
      console.log('Class data for fallback schedule:');
      classes.forEach((classItem, index) => {
        console.log(`Class ${index + 1}:`, {
          subject: classItem.subject,
          day: classItem.day_of_week,
          time: `${classItem.start_time} - ${classItem.end_time}`
        });
      });
    }

    // Helper function to add a study slot with deduplication
    const addUniqueStudySlot = (slot) => {
      // Create a unique key based on title, start time, and duration
      const slotKey = `${slot.title}|${slot.startTime}|${slot.duration}`;

      // Only add if this exact slot doesn't already exist
      if (!uniqueSlotKeys.has(slotKey)) {
        uniqueSlotKeys.add(slotKey);
        studySlots.push(slot);
        return true;
      }

      console.log(`Skipping duplicate slot: ${slot.title}`);
      return false;
    };

    // First, handle tasks if available
    if (tasks.length > 0) {
      // Sort tasks by due date (closest first)
      const sortedTasks = [...tasks].sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA - dateB;
      });

      // Generate a study slot for each task
      for (let i = 0; i < Math.min(sortedTasks.length, 10); i++) {
        const task = sortedTasks[i];
        const startTime = new Date(today);
        startTime.setDate(today.getDate() + i % 7); // Distribute across the first week

        // Apply scheduling rules
        const dayOfWeek = startTime.getDay(); // 0 = Sunday, 6 = Saturday

        // Skip odd Saturdays and all Sundays
        if (dayOfWeek === 0 || (dayOfWeek === 6 && Math.floor(startTime.getDate() / 7) % 2 === 0)) {
          continue;
        }

        // Set time based on day of week
        if (dayOfWeek === 6) { // Even Saturday
          // Randomly choose between morning, afternoon, and evening for Saturday
          const timeSlots = [
            { hour: 10, minute: 0 },  // 10 AM
            { hour: 14, minute: 0 },  // 2 PM
            { hour: 18, minute: 0 }   // 6 PM
          ];
          const randomSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
          startTime.setHours(randomSlot.hour, randomSlot.minute, 0, 0);
        } else { // Weekday (Monday-Friday)
          // After working hours (6 PM or later)
          startTime.setHours(18 + Math.floor(Math.random() * 3), 0, 0, 0); // Between 6 PM and 8 PM
        }

        const endTime = new Date(startTime);
        endTime.setMinutes(startTime.getMinutes() + 60); // 1 hour

        addUniqueStudySlot({
          title: `Study ${task.subject}: ${task.title}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: 60,
          taskId: task._id,
          priority: task.priority === 'High' ? 5 : task.priority === 'Medium' ? 3 : 1,
          notes: 'Generated by fallback system based on your task',
          source: 'rule-based'
        });
      }
    }

    // Next, handle exams if available
    if (exams.length > 0) {
      for (const exam of exams) {
        const examDate = new Date(exam.date);
        const daysUntilExam = Math.floor((examDate - today) / (1000 * 60 * 60 * 24));

        // Create multiple study slots for each exam based on proximity
        if (daysUntilExam > 0 && daysUntilExam <= 14) {
          // More frequent study sessions as exam approaches
          const sessionsCount = daysUntilExam <= 3 ? 3 : daysUntilExam <= 7 ? 2 : 1;

          for (let i = 0; i < sessionsCount; i++) {
            const startTime = new Date(today);
            startTime.setDate(today.getDate() + i + (daysUntilExam > 7 ? 3 : 1));

            // Apply scheduling rules
            const dayOfWeek = startTime.getDay();

            // Skip odd Saturdays and all Sundays
            if (dayOfWeek === 0 || (dayOfWeek === 6 && Math.floor(startTime.getDate() / 7) % 2 === 0)) {
              continue;
            }

            // Set time based on day of week
            if (dayOfWeek === 6) { // Even Saturday
              // For exam prep on Saturday, use different time slots throughout the day
              const examTimeSlots = [
                { hour: 9, minute: 0 },   // 9 AM
                { hour: 13, minute: 0 },  // 1 PM
                { hour: 17, minute: 0 }   // 5 PM
              ];
              const randomSlot = examTimeSlots[Math.floor(Math.random() * examTimeSlots.length)];
              startTime.setHours(randomSlot.hour, randomSlot.minute, 0, 0);
            } else { // Weekday (Monday-Friday)
              // After working hours for exam prep
              startTime.setHours(19, 0, 0, 0); // 7 PM
            }

            const endTime = new Date(startTime);
            endTime.setMinutes(startTime.getMinutes() + 90); // 1.5 hours

            addUniqueStudySlot({
              title: `Prepare for ${exam.subject} Exam`,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              duration: 90,
              priority: 5, // High priority for exams
              notes: `Exam preparation session (${daysUntilExam} days until exam)`,
              source: 'rule-based'
            });
          }
        }
      }
    }

    // Generate study slots from classes (this is the primary fallback when no tasks/exams)
    if (classes.length > 0) {
      console.log('Generating study slots from classes');

      // Get unique subjects from classes
      const subjects = [...new Set(classes.map(c => c.subject))];
      console.log('Unique subjects:', subjects);

      // Map day names to numbers (0 = Sunday, 6 = Saturday)
      const dayMap = {
        'Sunday': 0,
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6
      };

      // Get current day of week
      const currentDayOfWeek = today.getDay();
      console.log('Current day of week:', currentDayOfWeek);

      // Create a 2-week schedule to start (we'll add more if needed)
      for (let week = 0; week < 2; week++) {
        for (const classItem of classes) {
          // Skip if class data is incomplete
          if (!classItem.day_of_week || !classItem.end_time || !classItem.subject) {
            console.log('Skipping class with incomplete data:', classItem);
            continue;
          }

          const dayOfWeek = dayMap[classItem.day_of_week];
          if (dayOfWeek === undefined) {
            console.log('Invalid day of week:', classItem.day_of_week);
            continue;
          }

          // Skip odd Saturdays and all Sundays
          if (dayOfWeek === 0 || (dayOfWeek === 6 && week % 2 === 0)) {
            continue;
          }

          // Calculate the date for this class in the current week
          const classDate = new Date(today);
          const daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7 + (week * 7);
          classDate.setDate(today.getDate() + daysToAdd);

          console.log(`Scheduling for ${classItem.subject} on ${classItem.day_of_week} (${classDate.toDateString()})`);

          // Parse class end time
          let endHour, endMinute;
          try {
            [endHour, endMinute] = classItem.end_time.split(':').map(Number);
            if (isNaN(endHour) || isNaN(endMinute)) {
              throw new Error('Invalid time format');
            }
          } catch (error) {
            console.log(`Invalid end time format for ${classItem.subject}: ${classItem.end_time}`);
            // Default to 5 PM if time format is invalid
            endHour = 17;
            endMinute = 0;
          }

          // Create study slot after working hours (6 PM) on weekdays
          const startTime = new Date(classDate);

          // For weekdays (Monday-Friday), schedule after 6 PM
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            startTime.setHours(18, 0, 0, 0); // 6 PM
          }
          // For even Saturdays, can schedule throughout the day
          else if (dayOfWeek === 6) {
            // Morning slot for Saturday
            startTime.setHours(10, 0, 0, 0); // 10 AM
          }

          // If the adjusted time falls on a Sunday or odd Saturday, skip
          const adjustedDayOfWeek = startTime.getDay();
          if (adjustedDayOfWeek === 0 || (adjustedDayOfWeek === 6 && Math.floor(startTime.getDate() / 7) % 2 === 0)) {
            continue;
          }

          const endTime = new Date(startTime);
          endTime.setMinutes(startTime.getMinutes() + 60); // 1 hour

          addUniqueStudySlot({
            title: `Study ${classItem.subject}: Review Today's Material`,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: 60,
            priority: 3, // Medium priority
            notes: `Review material from today's ${classItem.subject} class`,
            source: 'rule-based'
          });

          // Add a second study slot for practice/homework 2 days after class
          const practiceDate = new Date(classDate);
          practiceDate.setDate(classDate.getDate() + 2);

          // Skip if it falls on a Sunday or odd Saturday
          const practiceDayOfWeek = practiceDate.getDay();
          if (practiceDayOfWeek === 0 || (practiceDayOfWeek === 6 && Math.floor(practiceDate.getDate() / 7) % 2 === 0)) {
            continue;
          }

          // Set time based on day of week
          if (practiceDayOfWeek === 6) { // Even Saturday
            // For Saturday, schedule in the afternoon
            practiceDate.setHours(14, 0, 0, 0); // 2 PM
          } else { // Weekday (Monday-Friday)
            // After working hours
            practiceDate.setHours(19, 0, 0, 0); // 7 PM
          }

          const practiceEndTime = new Date(practiceDate);
          practiceEndTime.setMinutes(practiceDate.getMinutes() + 60); // 1 hour

          addUniqueStudySlot({
            title: `Study ${classItem.subject}: Practice Problems`,
            startTime: practiceDate.toISOString(),
            endTime: practiceEndTime.toISOString(),
            duration: 60,
            priority: 2, // Lower priority
            notes: `Practice problems and homework for ${classItem.subject}`,
            source: 'rule-based'
          });
        }
      }

      // If we don't have enough study slots, add more for week 3 and 4
      if (studySlots.length < 5) {
        console.log('Not enough study slots, adding more for weeks 3-4');

        for (let week = 2; week < 4; week++) {
          for (const classItem of classes) {
            if (!classItem.day_of_week || !classItem.subject) continue;

            const dayOfWeek = dayMap[classItem.day_of_week];
            if (dayOfWeek === undefined) continue;

            // Skip odd Saturdays and all Sundays
            if (dayOfWeek === 0 || (dayOfWeek === 6 && week % 2 === 0)) {
              continue;
            }

            // Calculate the date for this class in the current week
            const classDate = new Date(today);
            const daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7 + (week * 7);
            classDate.setDate(today.getDate() + daysToAdd);

            // Set study time based on day of week
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              // Weekdays - after working hours
              classDate.setHours(20, 0, 0, 0); // 8 PM
            } else if (dayOfWeek === 6) {
              // Even Saturday - afternoon
              classDate.setHours(16, 0, 0, 0); // 4 PM
            }

            const endTime = new Date(classDate);
            endTime.setMinutes(classDate.getMinutes() + 60); // 1 hour

            addUniqueStudySlot({
              title: `Study ${classItem.subject}: Weekly Review`,
              startTime: classDate.toISOString(),
              endTime: endTime.toISOString(),
              duration: 60,
              priority: 2, // Medium-low priority
              notes: `Weekly review session for ${classItem.subject}`,
              source: 'rule-based'
            });
          }
        }
      }
    }

    // We no longer create generic study slots - only use real data
    if (studySlots.length === 0) {
      console.log('No study slots created from real data. Not adding generic fallback slots.');
    }

    // Sort study slots by start time
    studySlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    console.log('Generated', studySlots.length, 'fallback study slots');
    return studySlots;
  }

  /**
   * Generate fallback tips when LLM generation fails
   * @param {Object} data - Student data
   * @returns {Array} - Fallback study tips
   */
  generateFallbackTips(data) {
    const fallbackTips = [
      {
        title: 'Use the Pomodoro Technique',
        content: 'Break your study sessions into 25-minute focused blocks with 5-minute breaks. After 4 blocks, take a longer 15-30 minute break. This helps maintain focus and prevent burnout.',
        category: 'productivity',
        tags: ['time management', 'focus', 'efficiency'],
        subjects: [],
        source: 'rule-based'
      },
      {
        title: 'Create a Dedicated Study Space',
        content: 'Designate a specific area for studying that is free from distractions. This helps your brain associate that space with focus and productivity.',
        category: 'productivity',
        tags: ['environment', 'focus', 'habits'],
        subjects: [],
        source: 'rule-based'
      },
      {
        title: 'Practice Active Recall',
        content: 'Instead of passively re-reading notes, test yourself on the material. Try to recall information from memory before checking your notes. This strengthens memory pathways.',
        category: 'study technique',
        tags: ['memory', 'retention', 'effectiveness'],
        subjects: [],
        source: 'rule-based'
      },
      {
        title: 'Use Spaced Repetition',
        content: 'Review material at increasing intervals over time. This improves long-term retention compared to cramming everything at once.',
        category: 'study technique',
        tags: ['memory', 'retention', 'scheduling'],
        subjects: [],
        source: 'rule-based'
      },
      {
        title: 'Take Care of Your Physical Health',
        content: 'Regular exercise, adequate sleep, and proper nutrition significantly impact cognitive function and learning ability. Prioritize these aspects alongside your study schedule.',
        category: 'general',
        tags: ['health', 'wellness', 'performance'],
        subjects: [],
        source: 'rule-based'
      }
    ];

    // If we have tasks, add a subject-specific tip
    if (data.tasks && data.tasks.length > 0) {
      const subjects = [...new Set(data.tasks.map(task => task.subject))];

      if (subjects.includes('Mathematics') || subjects.includes('Math')) {
        fallbackTips.push({
          title: 'Practice Math Problems Regularly',
          content: 'For mathematics, consistent practice is key. Solve a variety of problems to build problem-solving skills and reinforce concepts.',
          category: 'subject specific',
          tags: ['practice', 'problem-solving', 'mathematics'],
          subjects: ['Mathematics', 'Math'],
          source: 'rule-based'
        });
      } else if (subjects.length > 0) {
        fallbackTips.push({
          title: `Focus on ${subjects[0]} Fundamentals`,
          content: `When studying ${subjects[0]}, ensure you have a solid understanding of the fundamental concepts before moving to more complex topics.`,
          category: 'subject specific',
          tags: ['fundamentals', 'understanding', subjects[0].toLowerCase()],
          subjects: [subjects[0]],
          source: 'rule-based'
        });
      }
    }

    return fallbackTips.slice(0, 5); // Return at most 5 tips
  }

  /**
   * Generate fallback insights when LLM generation fails
   * @param {Object} data - Analytics data
   * @returns {Array} - Fallback insights
   */
  generateFallbackInsights(data) {
    const { taskCompletionRate, totalStudyHours, subjectBreakdown = [] } = data;
    const insights = [];

    // Task completion insight
    if (taskCompletionRate !== undefined) {
      if (taskCompletionRate >= 80) {
        insights.push({
          text: `Great job maintaining a high task completion rate of ${taskCompletionRate}%! Keep up the good work.`,
          category: 'achievement',
          source: 'rule-based'
        });
      } else if (taskCompletionRate >= 50) {
        insights.push({
          text: `Your task completion rate is ${taskCompletionRate}%. Try breaking down larger tasks into smaller, more manageable steps to improve this rate.`,
          category: 'improvement',
          source: 'rule-based'
        });
      } else {
        insights.push({
          text: `Your task completion rate is ${taskCompletionRate}%, which is lower than ideal. Consider setting more realistic goals and using time management techniques.`,
          category: 'warning',
          source: 'rule-based'
        });
      }
    }

    // Study hours insight
    if (totalStudyHours !== undefined) {
      if (totalStudyHours >= 20) {
        insights.push({
          text: `You've studied for ${totalStudyHours} hours this week, which shows great dedication. Make sure to also include adequate rest time.`,
          category: 'achievement',
          source: 'rule-based'
        });
      } else if (totalStudyHours >= 10) {
        insights.push({
          text: `You've studied for ${totalStudyHours} hours this week. Consider increasing this slightly for better retention and coverage of material.`,
          category: 'suggestion',
          source: 'rule-based'
        });
      } else {
        insights.push({
          text: `You've studied for ${totalStudyHours} hours this week, which may not be sufficient. Try to allocate more time for studying to improve your understanding and performance.`,
          category: 'warning',
          source: 'rule-based'
        });
      }
    }

    // Subject balance insight
    if (subjectBreakdown.length > 0) {
      // Find subject with most and least hours
      const sortedSubjects = [...subjectBreakdown].sort((a, b) => b.hours - a.hours);
      const mostStudied = sortedSubjects[0];
      const leastStudied = sortedSubjects[sortedSubjects.length - 1];

      if (mostStudied && leastStudied && mostStudied.hours > 3 * leastStudied.hours) {
        insights.push({
          text: `You're spending significantly more time on ${mostStudied.subject} (${mostStudied.hours} hours) compared to ${leastStudied.subject} (${leastStudied.hours} hours). Consider balancing your study time more evenly.`,
          category: 'suggestion',
          source: 'rule-based'
        });
      }
    }

    // Add a general suggestion if we have few insights
    if (insights.length < 3) {
      insights.push({
        text: 'Try to maintain a consistent study schedule to improve retention and reduce stress before deadlines.',
        category: 'suggestion',
        source: 'rule-based'
      });
    }

    return insights;
  }
}

module.exports = new LLMService();
