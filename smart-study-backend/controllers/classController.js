const Class = require('../models/Class');


exports.createClass = async (req, res) => {
  try {
    const { subject, day_of_week, start_time, end_time, repeat_weekly, location } = req.body;

    const newClass = new Class({
      userId: req.userId, // Corrected: Extracted from JWT middleware
      subject,
      day_of_week,
      start_time,
      end_time,
      repeat_weekly,
      location
    });

    const savedClass = await newClass.save();
    res.status(201).json({ message: 'Class created', class: savedClass });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all classes for a user
exports.getUserClasses = async (req, res) => {
  try {
    const classes = await Class.find({ userId: req.userId });
    res.status(200).json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a class
exports.deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findOneAndDelete({ _id: req.params.id, userId: req.userId })

    if (!deletedClass) return res.status(404).json({ message: 'Class not found' });

    res.status(200).json({ message: 'Class deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a class
exports.updateClass = async (req, res) => {
  try {
    const { subject, day_of_week, start_time, end_time, repeat_weekly, location } = req.body;
    const updated = await Class.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { subject, day_of_week, start_time, end_time, repeat_weekly, location },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Class not found' });
    res.status(200).json({ message: 'Class updated', class: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
