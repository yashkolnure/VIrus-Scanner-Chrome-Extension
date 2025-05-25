const express = require('express');
const fs = require('fs');
const { enqueueScan } = require('../services/scanService');

const router = express.Router();

router.post('/scan-file', (req, res) => {
  const { filePath } = req.body;

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: "Invalid or missing filePath" });
  }

  enqueueScan(filePath, res);
});

module.exports = router;
