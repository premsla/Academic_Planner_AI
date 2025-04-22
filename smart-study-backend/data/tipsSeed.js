/**
 * Tips Seeding Script
 *
 * This script seeds the database with initial tips.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Tip = require('../models/Tip');
const logger = require('../utils/logger');

const tips = [
  {
    title: 'Use the Pomodoro Technique',
    content: 'Work for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer 15-30 minute break. This helps maintain focus and prevent burnout.',
    category: 'productivity',
    tags: ['time management', 'focus', 'study technique'],
    subjects: [],
    difficulty: 2,
    learningStyles: ['any']
  },
  {
    title: 'Create Mind Maps for Complex Topics',
    content: 'Mind maps help visualize connections between concepts. Start with a central idea and branch out with related concepts.',
    category: 'study technique',
    tags: ['visualization', 'organization', 'comprehension'],
    subjects: [],
    difficulty: 3,
    learningStyles: ['visual']
  },
  {
    title: 'Practice Active Recall',
    content: 'Instead of re-reading notes, test yourself on the material. Try to recall information from memory before checking your notes.',
    category: 'study technique',
    tags: ['memory', 'retention', 'exam preparation'],
    subjects: [],
    difficulty: 3,
    learningStyles: ['any']
  },
  {
    title: 'Use Spaced Repetition',
    content: 'Review material at increasing intervals over time. This improves long-term retention compared to cramming.',
    category: 'study technique',
    tags: ['memory', 'retention', 'long-term learning'],
    subjects: [],
    difficulty: 3,
    learningStyles: ['any']
  },
  {
    title: 'Create Flashcards for Key Concepts',
    content: 'Flashcards are excellent for memorizing definitions, formulas, and key facts. Digital tools like Anki can automate spaced repetition.',
    category: 'study technique',
    tags: ['memory', 'retention', 'tools'],
    subjects: [],
    difficulty: 2,
    learningStyles: ['visual', 'reading/writing']
  },
  {
    title: 'Teach Concepts to Someone Else',
    content: 'Explaining a concept to someone else (or even to an imaginary person) helps solidify your understanding and identify gaps in knowledge.',
    category: 'study technique',
    tags: ['comprehension', 'retention'],
    subjects: [],
    difficulty: 3,
    learningStyles: ['auditory']
  },
  {
    title: 'Use the Feynman Technique',
    content: 'To truly understand a concept: 1) Study it 2) Explain it simply 3) Identify gaps in understanding 4) Review and simplify explanation.',
    category: 'study technique',
    tags: ['comprehension', 'simplification'],
    subjects: [],
    difficulty: 4,
    learningStyles: ['any']
  },
  {
    title: 'Create a Dedicated Study Space',
    content: 'Having a consistent, distraction-free environment for studying helps your brain associate that space with focus and productivity.',
    category: 'productivity',
    tags: ['environment', 'focus'],
    subjects: [],
    difficulty: 2,
    learningStyles: ['any']
  },
  {
    title: 'Practice Math Problems Regularly',
    content: 'Mathematics requires practice. Solve a variety of problems to build problem-solving skills and reinforce concepts.',
    category: 'subject specific',
    tags: ['practice', 'problem-solving'],
    subjects: ['math'],
    difficulty: 3,
    learningStyles: ['kinesthetic']
  },
  {
    title: 'Use Mnemonics for Memorization',
    content: 'Create acronyms, rhymes, or visual associations to remember lists, sequences, or complex information.',
    category: 'study technique',
    tags: ['memory', 'retention'],
    subjects: [],
    difficulty: 2,
    learningStyles: ['visual', 'auditory']
  },
  {
    title: 'Take Effective Notes',
    content: 'Don\'t write everything down. Focus on main ideas, connections, and questions. Consider using the Cornell method or mind mapping.',
    category: 'study technique',
    tags: ['organization', 'comprehension'],
    subjects: [],
    difficulty: 3,
    learningStyles: ['reading/writing']
  },
  {
    title: 'Study in Short, Focused Sessions',
    content: 'Multiple short study sessions are more effective than one long marathon. Aim for 30-50 minute sessions with breaks in between.',
    category: 'productivity',
    tags: ['time management', 'focus'],
    subjects: [],
    difficulty: 2,
    learningStyles: ['any']
  },
  {
    title: 'Review Notes Within 24 Hours',
    content: 'Reviewing your notes within 24 hours of taking them significantly improves retention and helps identify areas needing clarification.',
    category: 'study technique',
    tags: ['retention', 'organization'],
    subjects: [],
    difficulty: 2,
    learningStyles: ['any']
  },
  {
    title: 'Use Practice Exams',
    content: 'Taking practice tests under exam-like conditions is one of the most effective ways to prepare for exams.',
    category: 'study technique',
    tags: ['exam preparation', 'assessment'],
    subjects: [],
    difficulty: 3,
    learningStyles: ['any']
  },
  {
    title: 'Draw Diagrams for Science Concepts',
    content: 'Visual representations help understand processes and relationships in biology, chemistry, and physics.',
    category: 'subject specific',
    tags: ['visualization', 'comprehension'],
    subjects: ['biology', 'chemistry', 'physics'],
    difficulty: 3,
    learningStyles: ['visual']
  },
  {
    title: 'Create a Study Schedule',
    content: 'Plan specific times for studying different subjects. Include breaks and stick to the schedule to build a routine.',
    category: 'time management',
    tags: ['organization', 'planning'],
    subjects: [],
    difficulty: 2,
    learningStyles: ['any']
  },
  {
    title: 'Use the SQ3R Method for Reading',
    content: 'Survey, Question, Read, Recite, Review. This structured approach improves comprehension and retention of reading material.',
    category: 'study technique',
    tags: ['reading', 'comprehension'],
    subjects: ['literature', 'history'],
    difficulty: 3,
    learningStyles: ['reading/writing']
  },
  {
    title: 'Take Care of Your Physical Health',
    content: 'Regular exercise, adequate sleep, and proper nutrition significantly impact cognitive function and learning ability.',
    category: 'general',
    tags: ['health', 'wellness'],
    subjects: [],
    difficulty: 2,
    learningStyles: ['any']
  },
  {
    title: 'Practice Coding Problems Regularly',
    content: 'For programming courses, regular practice with different problems helps build problem-solving skills and familiarity with syntax.',
    category: 'subject specific',
    tags: ['practice', 'problem-solving'],
    subjects: ['programming'],
    difficulty: 4,
    learningStyles: ['kinesthetic']
  },
  {
    title: 'Use Color-Coding in Notes',
    content: 'Assign different colors to different types of information (definitions, examples, important points) to organize and visualize your notes.',
    category: 'study technique',
    tags: ['organization', 'visualization'],
    subjects: [],
    difficulty: 2,
    learningStyles: ['visual']
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    seedTips();
  })
  .catch(err => {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  });

// Seed tips
async function seedTips() {
  try {
    // Check if tips already exist
    const existingTipsCount = await Tip.countDocuments();

    if (existingTipsCount > 0) {
      logger.info(`Database already has ${existingTipsCount} tips. Skipping seeding.`);
      process.exit(0);
    }

    // Insert tips
    await Tip.insertMany(tips);
    logger.info(`Successfully seeded ${tips.length} tips`);
    process.exit(0);
  } catch (error) {
    logger.error(`Error seeding tips: ${error.message}`);
    process.exit(1);
  }
};


