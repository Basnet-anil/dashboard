const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const Purchase = require('../models/Purchase');

router.get('/', async (req, res) => {
  try {
    const q = req.query.name ? { name: new RegExp(req.query.name, 'i') } : {};
    const data = await Vendor.find(q);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const existing = await Vendor.findOne({ name: req.body.name });
    if (existing) {
      Object.assign(existing, req.body);
      await existing.save();
      return res.json(existing);
    }
    const newData = new Vendor(req.body);
    await newData.save();
    res.json(newData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Vendor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Vendor not found' });

    const vendorName = deleted.name?.trim();
    if (vendorName) {
      await Purchase.deleteMany({ vendor: new RegExp('^\\s*' + vendorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i') });
    }

    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
