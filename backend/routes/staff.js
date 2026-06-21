const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');

router.get('/', async (req, res) => {
  try {
    const q = req.query.name ? { name: new RegExp(req.query.name, 'i') } : {};
    const data = await Staff.find(q);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const existing = await Staff.findOne({ name: req.body.name });
    if (existing) {
      Object.assign(existing, req.body);
      await existing.save();
      return res.json(existing);
    }
    const newData = new Staff(req.body);
    await newData.save();
    res.json(newData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
