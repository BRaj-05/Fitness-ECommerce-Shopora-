const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  bodyPart: { type: String },
  target: { type: String },
  equipment: { type: String },
  gifUrl: { type: String }
}, { _id: false });

const checklistItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true, trim: true, maxlength: 160 },
  completed: { type: Boolean, default: false }
}, { _id: false });

const fitnessPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  focus: { type: String, default: '', trim: true },
  duration: { type: String, default: '', trim: true },
  durationWeeks: { type: Number, required: true, min: 1, max: 104 },
  difficulty: { type: String, default: '', trim: true },
  startDate: { type: String, required: true },
  startedAt: { type: Date, required: true }
}, { _id: false });

const workoutLogSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  date: { 
    type: String, 
    required: true,
    index: true 
  },
  title: { type: String, default: 'Logged Workout' },
  notes: { type: String, default: '' },
  exercises: { type: [exerciseSchema], default: [] },
  checklist: { type: [checklistItemSchema], default: [] },
  checkInAt: { type: Date, default: null },
  checkOutAt: { type: Date, default: null },
  plan: { type: fitnessPlanSchema, default: null }
}, {
  timestamps: true
});

// A user can only have one workout log per day
workoutLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
