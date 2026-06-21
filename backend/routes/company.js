const express = require('express');
const router = express.Router();
const Company = require('../models/Company');

router.get('/', async (req, res) => {
  try {
    const company = await Company.findOne();
    res.json(company);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();
    res.json(company);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
