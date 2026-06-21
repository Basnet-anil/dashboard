const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const Payroll = require('../models/Payroll');

router.get('/staff', async (req, res) => {
  try {
    const items = await Staff.find();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/staff', async (req, res) => {
  try {
    const item = new Staff(req.body);
    await item.save();
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/payroll', async (req, res) => {
  try {
    const items = await Payroll.find().populate('staff');
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/payroll', async (req, res) => {
  try {
    const item = new Payroll(req.body);
    await item.save();
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
