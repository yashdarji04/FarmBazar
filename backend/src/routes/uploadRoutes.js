const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No image uploaded');
  }
  res.json({
    success: true,
    data: {
      url: `/uploads/${req.file.filename}`,
    }
  });
});

router.post('/multiple', protect, upload.array('images', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No images uploaded');
  }
  const urls = req.files.map((file) => `/uploads/${file.filename}`);
  res.json({
    success: true,
    data: {
      urls,
    }
  });
});

module.exports = router;
