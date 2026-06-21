const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Vendor = require('../models/Vendor');
const escapeRegex = require('../utils/escapeRegex');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const parseDateParts = (date) => {
  if (!date || typeof date !== 'string') return null;
  const normalized = date.replace(/-/g, '/').trim();
  const match = normalized.match(/^(\d{2,4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return { year, month, day };
};

const getLatestPeriod = (docs) => {
  const items = docs
    .map(doc => ({ doc, parts: parseDateParts(doc.date) }))
    .filter(item => item.parts);

  items.sort((a, b) => {
    if (b.parts.year !== a.parts.year) return b.parts.year - a.parts.year;
    if (b.parts.month !== a.parts.month) return b.parts.month - a.parts.month;
    return b.parts.day - a.parts.day;
  });

  return items[0]?.parts || null;
};

const filterByYearMonth = (docs, year, month) => {
  return docs.filter(doc => {
    const parts = parseDateParts(doc.date);
    return parts && parts.year === year && parts.month === month;
  });
};

// Get monthly purchase metrics
router.get('/metrics/monthly', async (req, res) => {
  try {
    const purchases = await Purchase.find({}).select('total date').limit(5000);
    const latest = getLatestPeriod(purchases);
    const targetYear = (req.query.year && Number(req.query.year)) || latest?.year || null;
    const targetMonth = (req.query.month && Number(req.query.month)) || latest?.month || null;
    const filteredPurchases = targetYear && targetMonth ? filterByYearMonth(purchases, targetYear, targetMonth) : [];

    const totalAmount = filteredPurchases.reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0);

    res.json({
      month: targetMonth,
      year: targetYear,
      totalAmount,
      invoiceCount: filteredPurchases.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get yearly purchase metrics
router.get('/metrics/yearly', async (req, res) => {
  try {
    const purchases = await Purchase.find({}).select('total date').limit(5000);
    const latest = getLatestPeriod(purchases);
    const targetYear = (req.query.year && Number(req.query.year)) || latest?.year || null;
    const filteredPurchases = targetYear ? purchases.filter(doc => {
      const parts = parseDateParts(doc.date);
      return parts && parts.year === targetYear;
    }) : [];

    const totalAmount = filteredPurchases.reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0);

    res.json({
      year: targetYear,
      totalAmount,
      invoiceCount: filteredPurchases.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', [ query('vendor').optional().isString().trim().isLength({ max: 100 }) ], validate, async (req, res) => {
  try {
    const q = req.query.vendor ? { vendor: new RegExp('^' + escapeRegex(req.query.vendor) + '$', 'i') } : {};
    const data = await Purchase.find(q).sort({ sn: 1 }).limit(2000);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

router.post('/', [ body('vendor').optional().isString().trim().isLength({ max: 100 }), body('total').optional().isNumeric() ], validate, async (req, res) => {
  try {
    const newData = new Purchase(req.body);
    await newData.save();

    // Link to Vendor data
    if (req.body.vendor) {
      const vendorName = req.body.vendor.trim();
      let vendor = await Vendor.findOne({ name: new RegExp('^' + escapeRegex(vendorName) + '$', 'i') });
      
      if (!vendor) {
        vendor = new Vendor({
          name: vendorName,
          accountDetails: []
        });
      }

      const newSn = vendor.accountDetails.length > 0 
        ? Math.max(...vendor.accountDetails.map(a => a.sn || 0)) + 1 
        : 1;
      
      const lastBalance = vendor.accountDetails.length > 0 
        ? (vendor.accountDetails[vendor.accountDetails.length - 1].balance || 0) 
        : 0;
        
      const debit = Number(req.body.total) || 0;
      // Purchases don't have a specific 'received' amount in the schema, but there's a 'paid' concept missing. 
      // We'll just use 0 for the payment (credit) side for now, meaning the balance increases by the total debit.
      const paid = 0; 
      const currentBalance = lastBalance + debit - paid;

      vendor.accountDetails.push({
        sn: newSn,
        invoiceNo: `INV-${newData.sn}`,
        date: req.body.date,
        programs: req.body.particular,
        debit: debit,
        recDate: '', // Not provided in Purchase schema
        discount: req.body.discount,
        balance: currentBalance
      });
      await vendor.save();
    }

    res.status(201).json(newData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save purchase' });
  }
});

router.put('/:id', [ param('id').isMongoId() ], validate, async (req, res) => {
  try {
    const oldPurchase = await Purchase.findById(req.params.id);
    const updatedData = await Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!oldPurchase || !updatedData) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const oldVendorName = oldPurchase.vendor?.trim();
    const updatedVendorName = updatedData.vendor?.trim();
    const invoiceNo = `INV-${oldPurchase.sn}`;

    if (oldVendorName) {
      const oldVendor = await Vendor.findOne({ name: new RegExp('^' + escapeRegex(oldVendorName) + '$', 'i') });
      if (oldVendor) {
        const existingIndex = oldVendor.accountDetails.findIndex(a => a.invoiceNo === invoiceNo);
        if (existingIndex !== -1 && oldVendorName.toLowerCase() !== updatedVendorName?.toLowerCase()) {
          oldVendor.accountDetails.splice(existingIndex, 1);
          oldVendor.accountDetails.forEach((a, idx) => { a.sn = idx + 1; });
          await oldVendor.save();
        }
      }
    }

    if (updatedVendorName) {
      let vendor = await Vendor.findOne({ name: new RegExp('^' + escapeRegex(updatedVendorName) + '$', 'i') });
      if (!vendor) {
        vendor = new Vendor({ name: updatedVendorName, accountDetails: [] });
      }

      const existingIndex = vendor.accountDetails.findIndex(a => a.invoiceNo === invoiceNo);
      const debit = Number(updatedData.total) || 0;
      const paid = 0;
      const lastBalance = vendor.accountDetails.length > 0
        ? (vendor.accountDetails[vendor.accountDetails.length - 1].balance || 0)
        : 0;
      const currentBalance = lastBalance + debit - paid;

      const updatedEntry = {
        sn: existingIndex !== -1
          ? vendor.accountDetails[existingIndex].sn
          : (vendor.accountDetails.length > 0 ? Math.max(...vendor.accountDetails.map(a => a.sn || 0)) + 1 : 1),
        invoiceNo,
        date: updatedData.date,
        programs: updatedData.particular,
        debit,
        bank: existingIndex !== -1 ? vendor.accountDetails[existingIndex].bank : '',
        acNo: existingIndex !== -1 ? vendor.accountDetails[existingIndex].acNo : '',
        recDate: '',
        discount: updatedData.discount,
        balance: currentBalance
      };

      if (existingIndex !== -1) {
        vendor.accountDetails[existingIndex] = { ...vendor.accountDetails[existingIndex], ...updatedEntry };
      } else {
        vendor.accountDetails.push(updatedEntry);
      }

      await vendor.save();
    }

    res.json(updatedData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update purchase' });
  }
});

router.delete('/:id', [ param('id').isMongoId() ], validate, async (req, res) => {
  try {
    const deletedData = await Purchase.findByIdAndDelete(req.params.id);
    if (deletedData && deletedData.vendor) {
      const vendorName = deletedData.vendor.trim();
      const vendor = await Vendor.findOne({ name: new RegExp('^' + escapeRegex(vendorName) + '$', 'i') });
      if (vendor) {
        vendor.accountDetails = vendor.accountDetails.filter(a => 
          a.invoiceNo !== String(deletedData.sn) && a.invoiceNo !== `INV-${deletedData.sn}`
        );
        vendor.accountDetails = vendor.accountDetails.map((a, idx) => {
          a.sn = idx + 1;
          return a;
        });
        await vendor.save();
      }
    }
    res.json(deletedData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete purchase' });
  }
});

module.exports = router;
