const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const router = express.Router();
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
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

// Get monthly sales metrics
router.get('/metrics/monthly', async (req, res) => {
  try {
    // limit the number of documents processed in-memory to avoid OOM for large collections
    const sales = await Sale.find({}).select('total received date').limit(5000);
    const latest = getLatestPeriod(sales);
    const targetYear = (req.query.year && Number(req.query.year)) || latest?.year || null;
    const targetMonth = (req.query.month && Number(req.query.month)) || latest?.month || null;
    const filteredSales = targetYear && targetMonth ? filterByYearMonth(sales, targetYear, targetMonth) : [];

    const totalBilled = filteredSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
    const totalReceived = filteredSales.reduce((sum, sale) => sum + (Number(sale.received) || 0), 0);
    const totalDue = totalBilled - totalReceived;

    res.json({
      month: targetMonth,
      year: targetYear,
      totalBilled,
      totalReceived,
      totalDue,
      invoiceCount: filteredSales.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get yearly sales metrics
router.get('/metrics/yearly', async (req, res) => {
  try {
    const sales = await Sale.find({}).select('total received date').limit(5000);
    const latest = getLatestPeriod(sales);
    const targetYear = (req.query.year && Number(req.query.year)) || latest?.year || null;
    const filteredSales = targetYear ? sales.filter(doc => {
      const parts = parseDateParts(doc.date);
      return parts && parts.year === targetYear;
    }) : [];

    const totalBilled = filteredSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
    const totalReceived = filteredSales.reduce((sum, sale) => sum + (Number(sale.received) || 0), 0);
    const totalDue = totalBilled - totalReceived;

    res.json({
      year: targetYear,
      totalBilled,
      totalReceived,
      totalDue,
      invoiceCount: filteredSales.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', [
  query('customer').optional().isString().trim().isLength({ max: 100 })
], validate, async (req, res) => {
  try {
    const customerName = req.query.customer?.trim();
    const q = customerName
      ? { customer: new RegExp('^\\s*' + escapeRegex(customerName) + '\\s*$', 'i') }
      : {};
    const data = await Sale.find(q).sort({ sn: 1 }).limit(2000);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

router.post('/', [
  body('sn').optional().isNumeric(),
  body('customer').optional().isString().trim().isLength({ max: 100 }),
  body('total').optional().isNumeric(),
  body('received').optional().isNumeric()
], validate, async (req, res) => {
  try {
    const newData = new Sale(req.body);
    await newData.save();

    // Link to Customer data
    if (req.body.customer) {
      const customerName = req.body.customer.trim();
      let customer = await Customer.findOne({ name: new RegExp('^' + escapeRegex(customerName) + '$', 'i') });
      
      if (!customer) {
        customer = new Customer({
          name: customerName,
          accountDetails: []
        });
      }

      const newSn = customer.accountDetails.length > 0 
        ? Math.max(...customer.accountDetails.map(a => a.sn || 0)) + 1 
        : 1;
      
      const lastBalance = customer.accountDetails.length > 0 
        ? (customer.accountDetails[customer.accountDetails.length - 1].balance || 0) 
        : 0;
        
      const debit = Number(req.body.total) || 0;
      const received = Number(req.body.received) || 0;
      const currentBalance = lastBalance + debit - received;

      customer.accountDetails.push({
        sn: newSn,
        invoiceNo: `INV-${newData.sn}`,
        date: req.body.date,
        programs: req.body.service,
        debit: debit,
        recDate: req.body.receivedDate,
        discount: req.body.discount,
        balance: currentBalance
      });
      await customer.save();
    }

    res.status(201).json(newData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save sale' });
  }
});

router.put('/:id', [ param('id').isMongoId() ], validate, async (req, res) => {
  try {
    const oldSale = await Sale.findById(req.params.id);
    const updatedData = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!oldSale || !updatedData) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const oldCustomerName = oldSale.customer?.trim();
    const updatedCustomerName = updatedData.customer?.trim();
    const invoiceNo = `INV-${oldSale.sn}`;

    if (oldCustomerName) {
      const oldCustomer = await Customer.findOne({ name: new RegExp('^' + escapeRegex(oldCustomerName) + '$', 'i') });
      if (oldCustomer) {
        const existingIndex = oldCustomer.accountDetails.findIndex(a => a.invoiceNo === invoiceNo);
        if (existingIndex !== -1) {
          if (oldCustomerName.toLowerCase() !== updatedCustomerName?.toLowerCase()) {
            oldCustomer.accountDetails.splice(existingIndex, 1);
            oldCustomer.accountDetails.forEach((a, idx) => { a.sn = idx + 1; });
            await oldCustomer.save();
          }
        }
      }
    }

    if (updatedCustomerName) {
      let customer = await Customer.findOne({ name: new RegExp('^' + escapeRegex(updatedCustomerName) + '$', 'i') });
      if (!customer) {
        customer = new Customer({ name: updatedCustomerName, accountDetails: [] });
      }

      const existingIndex = customer.accountDetails.findIndex(a => a.invoiceNo === invoiceNo);
      const debit = Number(updatedData.total) || 0;
      const received = Number(updatedData.received) || 0;
      const lastBalance = customer.accountDetails.length > 0
        ? (customer.accountDetails[customer.accountDetails.length - 1].balance || 0)
        : 0;
      const currentBalance = lastBalance + debit - received;

      const updatedEntry = {
        sn: existingIndex !== -1
          ? customer.accountDetails[existingIndex].sn
          : (customer.accountDetails.length > 0 ? Math.max(...customer.accountDetails.map(a => a.sn || 0)) + 1 : 1),
        invoiceNo,
        date: updatedData.date,
        programs: updatedData.service,
        debit,
        bank: existingIndex !== -1 ? customer.accountDetails[existingIndex].bank : '',
        acNo: existingIndex !== -1 ? customer.accountDetails[existingIndex].acNo : '',
        recDate: updatedData.receivedDate,
        discount: updatedData.discount,
        balance: currentBalance
      };

      if (existingIndex !== -1) {
        customer.accountDetails[existingIndex] = { ...customer.accountDetails[existingIndex], ...updatedEntry };
      } else {
        customer.accountDetails.push(updatedEntry);
      }

      await customer.save();
    }

    res.json(updatedData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update sale' });
  }
});

router.delete('/:id', [ param('id').isMongoId() ], validate, async (req, res) => {
  try {
    const deletedData = await Sale.findByIdAndDelete(req.params.id);
    if (deletedData && deletedData.customer) {
      const customerName = deletedData.customer.trim();
      const customer = await Customer.findOne({ name: new RegExp('^' + escapeRegex(customerName) + '$', 'i') });
      if (customer) {
        customer.accountDetails = customer.accountDetails.filter(a => 
          a.invoiceNo !== String(deletedData.sn) && a.invoiceNo !== `INV-${deletedData.sn}`
        );
        customer.accountDetails = customer.accountDetails.map((a, idx) => {
          a.sn = idx + 1;
          return a;
        });
        await customer.save();
      }
    }
    res.json(deletedData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

module.exports = router;
