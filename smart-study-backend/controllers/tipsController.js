/**
 * Tips Controller
 *
 * Handles API endpoints for generating and managing personalized study tips
 */

const Tip = require('../models/Tip');
const UserTipInteraction = require('../models/UserTipInteraction');
const Task = require('../models/Task');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Preference = require('../models/Preference');
const llmService = require('../services/llmService');
const logger = require('../utils/logger');

/**
 * Generate personalized tips for a user
 * @route POST /api/tips/generate
 */
exports.generateTips = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const { limit = 5 } = req.body;

    // Fetch user data
    const [tasks, classes, exams, preferences, feedback] = await Promise.all([
      Task.find({ userId, completed: { $ne: true } }),
      Class.find({ userId }),
      Exam.find({ userId }),
      Preference.findOne({ userId }) || { userId },
      UserTipInteraction.find({ userId }).populate('tipId')
    ]);

    // Generate tips using LLM service
    const tipsData = await llmService.generateStudyTips({
      tasks,
      classes,
      exams,
      preferences,
      feedback,
      limit
    });

    // Save generated tips to database
    const tips = [];

    if (tipsData.tips && Array.isArray(tipsData.tips)) {
      for (const tipData of tipsData.tips) {
        // Create tip
        const tip = new Tip({
          title: tipData.title,
          content: tipData.content,
          category: tipData.category,
          tags: tipData.tags || [],
          subjects: tipData.subjects || [],
          difficulty: tipData.difficulty || 3,
          learningStyles: tipData.learningStyles || ['any'],
          source: tipsData.source || 'gemini'
        });

        await tip.save();

        // Create user interaction
        await UserTipInteraction.create({
          userId,
          tipId: tip._id,
          isViewed: true,
          viewCount: 1
        });

        tips.push(tip);
      }
    }

    res.status(200).json({
      message: 'Personalized tips generated successfully',
      source: tipsData.source || 'gemini',
      tips
    });
  } catch (error) {
    logger.error(`Error generating personalized tips: ${error.message}`);
    res.status(500).json({
      message: 'Error generating personalized tips',
      error: error.message
    });
  }
};

/**
 * Get personalized tips for a user
 * @route GET /api/tips
 */
exports.getPersonalizedTips = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const { limit = 5 } = req.query;

    // Get tips with user interactions
    const interactions = await UserTipInteraction.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .populate('tipId');

    // Extract tips from interactions
    const tips = interactions
      .filter(interaction => interaction.tipId)
      .map(interaction => {
        const tip = interaction.tipId.toObject();
        tip.userFeedback = interaction.isHelpful;
        tip.viewCount = interaction.viewCount;
        return tip;
      });

    // If we don't have enough tips, get more from the database
    if (tips.length < parseInt(limit)) {
      const existingTipIds = tips.map(tip => tip._id);
      const additionalTips = await Tip.find({ _id: { $nin: existingTipIds } })
        .limit(parseInt(limit) - tips.length);

      // Create interactions for these tips
      for (const tip of additionalTips) {
        await UserTipInteraction.create({
          userId,
          tipId: tip._id,
          isViewed: true,
          viewCount: 1
        });

        tips.push(tip.toObject());
      }
    }

    res.status(200).json(tips);
  } catch (error) {
    logger.error(`Error getting personalized tips: ${error.message}`);
    res.status(500).json({
      message: 'Error getting personalized tips',
      error: error.message
    });
  }
};

/**
 * Mark a tip as helpful or not helpful
 * @route PUT /api/tips/:tipId/feedback
 */
exports.markTipHelpfulness = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const { tipId } = req.params;
    const { isHelpful } = req.body;

    // Validate input
    if (isHelpful === undefined) {
      return res.status(400).json({ message: 'isHelpful field is required' });
    }

    // Check if tip exists
    const tip = await Tip.findById(tipId);
    if (!tip) {
      return res.status(404).json({ message: 'Tip not found' });
    }

    // Update or create interaction
    const interaction = await UserTipInteraction.findOneAndUpdate(
      { userId, tipId },
      {
        $set: {
          isHelpful,
          updatedAt: Date.now()
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Tip feedback recorded', interaction });
  } catch (error) {
    logger.error(`Error marking tip helpfulness: ${error.message}`);
    res.status(500).json({
      message: 'Error marking tip helpfulness',
      error: error.message
    });
  }
};

/**
 * Get all tips (admin only)
 * @route GET /api/tips/all
 */
exports.getAllTips = async (req, res) => {
  try {
    const tips = await Tip.find({});
    res.status(200).json(tips);
  } catch (error) {
    logger.error(`Error getting all tips: ${error.message}`);
    res.status(500).json({
      message: 'Error getting all tips',
      error: error.message
    });
  }
};

/**
 * Create a new tip (admin only)
 * @route POST /api/tips/create
 */
exports.createTip = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      tags,
      subjects,
      difficulty,
      learningStyles
    } = req.body;

    // Validate required fields
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required' });
    }

    // Create new tip
    const newTip = new Tip({
      title,
      content,
      category,
      tags: tags || [],
      subjects: subjects || [],
      difficulty: difficulty || 3,
      learningStyles: learningStyles || ['any'],
      source: 'static'
    });

    await newTip.save();

    res.status(201).json({ message: 'Tip created successfully', tip: newTip });
  } catch (error) {
    logger.error(`Error creating tip: ${error.message}`);
    res.status(500).json({
      message: 'Error creating tip',
      error: error.message
    });
  }
};
