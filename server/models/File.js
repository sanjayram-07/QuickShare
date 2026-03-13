const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    downloadToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
  },
  { timestamps: true }
);

// Virtual: check if file is expired
fileSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiresAt;
});

// Virtual: time remaining in ms
fileSchema.virtual('timeRemaining').get(function () {
  return Math.max(0, this.expiresAt - new Date());
});

fileSchema.set('toJSON', { virtuals: true });

// Index for cleanup job
fileSchema.index({ expiresAt: 1, isActive: 1 });

module.exports = mongoose.model('File', fileSchema);
