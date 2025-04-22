const Exam = require('../models/Exam');

// Create a new exam
exports.createExam = async (req, res) => {
  try {
    const { subject, date, start_time, end_time, duration, location } = req.body;

    const newExam = new Exam({
      userId: req.userId,  // From JWT middleware
      subject,
      date,
      start_time,
      end_time,
      duration,
      location
    });

    const savedExam = await newExam.save();
    res.status(201).json({ message: 'Exam created successfully', exam: savedExam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all exams for the user
exports.getUserExams = async (req, res) => {
  try {
    const exams = await Exam.find({ userId: req.userId });
    res.status(200).json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update an exam
exports.updateExam = async (req, res) => {
  try {
    const { subject, date, start_time, end_time, duration, location } = req.body;
    const updated = await Exam.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { subject, date, start_time, end_time, duration, location },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Exam not found' });
    res.status(200).json({ message: 'Exam updated', exam: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete an exam
exports.deleteExam = async (req, res) => {
  try {
    const deleted = await Exam.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!deleted) return res.status(404).json({ message: 'Exam not found' });

    res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
