const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');

router.get('/', async (req, res) => {
  try {
    const data = await Payroll.find().sort({ sn: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newData = new Payroll(req.body);
    await newData.save();
    res.json(newData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
