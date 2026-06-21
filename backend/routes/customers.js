const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const router = express.Router();
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const escapeRegex = require('../utils/escapeRegex');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.get('/', [
  query('name').optional().isString().trim().isLength({ max: 100 })
], validate, async (req, res) => {
  try {
    const name = req.query.name;
    const q = name ? { name: new RegExp(escapeRegex(name), 'i') } : {};
    const data = await Customer.find(q).limit(1000);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.post('/', [
  body('name').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Name is required'),
  body('address').optional().isString().trim().isLength({ max: 300 }),
  body('phone').optional().custom((value) => {
    if (value && value.trim() !== '' && !/^\d+$/.test(value)) {
      throw new Error('Phone number must contain only digits');
    }
    return true;
  }).isLength({ max: 30 })
], validate, async (req, res) => {
  try {
    const payload = {
      name: req.body.name,
      address: req.body.address,
      phone: req.body.phone,
      pan: req.body.pan,
      contact1: req.body.contact1,
      contact2: req.body.contact2
    };
    if (req.body.accountDetails) {
      payload.accountDetails = req.body.accountDetails;
    }

    const existing = await Customer.findOne({ name: payload.name });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      return res.json(existing);
    }

    const newData = new Customer(payload);
    await newData.save();
    res.status(201).json(newData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save customer' });
  }
});

router.put('/:id', [ param('id').isMongoId().withMessage('Invalid customer ID') ], validate, async (req, res) => {
  console.log('=== PUT /api/customers/:id ===');
  console.log('Customer ID:', req.params.id);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Validate phone if provided
    if (req.body.phone && req.body.phone.trim() !== '' && !/^\d+$/.test(req.body.phone)) {
      return res.status(400).json({ 
        error: 'Invalid Phone Number',
        message: 'Phone number must contain only digits (0-9)'
      });
    }
    
    const payload = {
      address: req.body.address,
      phone: req.body.phone,
      pan: req.body.pan,
      contact1: req.body.contact1,
      contact2: req.body.contact2
    };
    if (req.body.accountDetails !== undefined) {
      payload.accountDetails = req.body.accountDetails;
    }
    
    const updated = await Customer.findByIdAndUpdate(req.params.id, payload, { new: true });
    
    if (!updated) {
      console.log('Customer not found with ID:', req.params.id);
      return res.status(404).json({ 
        error: 'Customer Not Found',
        message: `Customer with ID "${req.params.id}" does not exist. The customer may have been deleted. Please refresh and try again.`
      });
    }
    
    console.log('Customer updated successfully');
    res.json(updated);
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ 
      error: 'Update Failed',
      message: `Failed to update customer: ${err.message}. Check if the database is accessible.`
    });
  }
});

router.delete('/:id', [ param('id').isMongoId() ], validate, async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Customer not found' });

    const customerName = deleted.name?.trim();
    if (customerName) {
      await Sale.deleteMany({ customer: new RegExp('^\\s*' + escapeRegex(customerName) + '\\s*$', 'i') });
    }

    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;
