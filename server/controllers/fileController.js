const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const User = require('../models/User');

const EXPIRY_HOURS = parseInt(process.env.LINK_EXPIRY_HOURS) || 24;

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// POST /api/files/upload
const uploadFiles = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded.' });
  }

  const { description = '' } = req.body;
  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);

  try {
    const savedFiles = [];

    for (const file of req.files) {
      const downloadToken = crypto.randomBytes(32).toString('hex');

      const newFile = await File.create({
        originalName: file.originalname,
        storedName: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        size: file.size,
        uploader: req.user._id,
        downloadToken,
        expiresAt,
        description: description.slice(0, 200),
      });

      savedFiles.push(newFile);
    }

    // Update user stats
    const totalSize = req.files.reduce((sum, f) => sum + f.size, 0);
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalUploads: req.files.length, storageUsed: totalSize },
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.status(201).json({
      success: true,
      message: `${savedFiles.length} file(s) uploaded successfully.`,
      files: savedFiles.map((f) => ({
        id: f._id,
        originalName: f.originalName,
        size: f.size,
        sizeFormatted: formatBytes(f.size),
        mimeType: f.mimeType,
        downloadToken: f.downloadToken,
        downloadUrl: `${baseUrl}/api/files/download/${f.downloadToken}`,
        expiresAt: f.expiresAt,
        uploadedAt: f.createdAt,
      })),
    });
  } catch (error) {
    // Clean up uploaded files on DB error
    for (const file of req.files) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Error saving file metadata.' });
  }
};

// GET /api/files
const getMyFiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await File.countDocuments({ uploader: req.user._id, isActive: true });
    const files = await File.find({ uploader: req.user._id, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const now = new Date();

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      files: files.map((f) => ({
        id: f._id,
        originalName: f.originalName,
        size: f.size,
        sizeFormatted: formatBytes(f.size),
        mimeType: f.mimeType,
        downloadToken: f.downloadToken,
        downloadUrl: `${baseUrl}/api/files/download/${f.downloadToken}`,
        expiresAt: f.expiresAt,
        isExpired: now > new Date(f.expiresAt),
        downloadCount: f.downloadCount,
        description: f.description,
        uploadedAt: f.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ success: false, message: 'Error fetching files.' });
  }
};

// GET /api/files/download/:token
const downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({
      downloadToken: req.params.token,
      isActive: true,
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found or has been deleted.' });
    }

    if (new Date() > file.expiresAt) {
      return res.status(410).json({
        success: false,
        message: 'This download link has expired.',
        expiredAt: file.expiresAt,
      });
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server.' });
    }

    // Increment download count and update user stats
    file.downloadCount += 1;
    await file.save();
    await User.findByIdAndUpdate(file.uploader, { $inc: { totalDownloads: 1 } });

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);
    res.setHeader('X-Download-Count', file.downloadCount);

    const readStream = fs.createReadStream(file.filePath);
    readStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, message: 'Error downloading file.' });
  }
};

// GET /api/files/info/:token  (public - no auth needed)
const getFileInfo = async (req, res) => {
  try {
    const file = await File.findOne({
      downloadToken: req.params.token,
      isActive: true,
    }).populate('uploader', 'username');

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const now = new Date();
    const isExpired = now > file.expiresAt;

    res.json({
      success: true,
      file: {
        originalName: file.originalName,
        size: file.size,
        sizeFormatted: formatBytes(file.size),
        mimeType: file.mimeType,
        uploader: file.uploader.username,
        expiresAt: file.expiresAt,
        isExpired,
        timeRemaining: isExpired ? 0 : file.expiresAt - now,
        downloadCount: file.downloadCount,
        description: file.description,
        uploadedAt: file.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching file info.' });
  }
};

// DELETE /api/files/:id
const deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, uploader: req.user._id });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found or unauthorized.' });
    }

    // Delete physical file
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Update user storage
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { storageUsed: -file.size },
    });

    await File.findByIdAndDelete(file._id);

    res.json({ success: true, message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting file.' });
  }
};

// Cron job: cleanup expired files
const cleanupExpiredFiles = async () => {
  try {
    const expired = await File.find({
      expiresAt: { $lt: new Date() },
      isActive: true,
    });

    let cleaned = 0;
    for (const file of expired) {
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }
      await File.findByIdAndDelete(file._id);
      cleaned++;
    }

    if (cleaned > 0) {
      console.log(`🗑️  Cleaned up ${cleaned} expired files.`);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

module.exports = { uploadFiles, getMyFiles, downloadFile, getFileInfo, deleteFile, cleanupExpiredFiles };
