const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { uploadMiddleware } = require('../middleware/uploadMiddleware');
const {
  uploadFiles,
  getMyFiles,
  downloadFile,
  getFileInfo,
  deleteFile,
} = require('../controllers/fileController');

const router = express.Router();

// Public routes
router.get('/download/:token', downloadFile);
router.get('/info/:token', getFileInfo);

// Protected routes
router.use(protect);
router.post('/upload', uploadMiddleware, uploadFiles);
router.get('/', getMyFiles);
router.delete('/:id', deleteFile);

module.exports = router;
