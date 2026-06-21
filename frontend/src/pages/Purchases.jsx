import React, { useState, useEffect } from 'react';
import { X, Building2, FileText, Plus, Trash2, Printer } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

import * as purchasesApi from '../api/purchases';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    date: '', vendor: '', particular: '', discount: '', vatRate: '13%', taxable: '', vat: '', total: '', paid: '', credit: ''
  });

  // Vendor modal state
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [modalVendor, setModalVendor] = useState(null);
  const [modalAccountDetails, setModalAccountDetails] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '', address: '', phone: '', pan: '', contact1: '', contact2: ''
  });
  const [showAccForm, setShowAccForm] = useState(false);
  const [accForm, setAccForm] = useState({
    invoiceNo: '', date: '', programs: '', debit: '', bank: '', acNo: '', recDate: '', discount: '', balance: ''
  });
  const [activePurchase, setActivePurchase] = useState(null);
  const [filterOnlyActivePurchase, setFilterOnlyActivePurchase] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const data = await purchasesApi.listPurchases();
        setPurchases(data);
      } catch (err) {
        console.error('Failed to fetch purchases:', err);
      }
    };
    fetchPurchases();
  }, []);

  const nextSn = purchases.length > 0 ? Math.max(...purchases.map(p => p.sn)) + 1 : 1;

  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    let updated = { ...formData, [name]: value };

    if (name === 'taxable' || name === 'vatRate' || name === 'discount') {
      const taxableVal = parseFloat(name === 'taxable' ? value : updated.taxable) || 0;
      let vatPercentStr = name === 'vatRate' ? value : updated.vatRate;
      if (typeof vatPercentStr === 'string' && vatPercentStr.endsWith('%')) {
        vatPercentStr = vatPercentStr.slice(0, -1);
      }
      const vatPercent = parseFloat(vatPercentStr) || 0;
      const discountVal = parseFloat(name === 'discount' ? value : updated.discount) || 0;
      const vatVal = taxableVal * (vatPercent / 100);
      const totalVal = taxableVal + vatVal - discountVal;
      updated.vat = vatVal.toFixed(2);
      updated.total = totalVal.toFixed(2);
      
      // Calculate credit (due balance)
      const paidVal = parseFloat(updated.paid) || 0;
      const creditVal = totalVal - paidVal;
      updated.credit = creditVal.toFixed(2);
    }

    if (name === 'paid' || name === 'total') {
      const totalVal = parseFloat(name === 'total' ? value : updated.total) || 0;
      const paidVal = parseFloat(name === 'paid' ? value : updated.paid) || 0;
      const creditVal = totalVal - paidVal;
      updated.credit = creditVal.toFixed(2);
    }

    setFormData(updated);
  };

  const handleSave = async () => {
    if (!formData.date || formData.date.trim() === '' || !formData.vendor || formData.vendor.trim() === '' || !formData.particular || formData.particular.trim() === '' || !formData.taxable || String(formData.taxable).trim() === '') {
      alert('Date, Vendor, Particular, and Taxable Amount are required.');
      return;
    }
    const hasOnlySpaces = Object.values(formData).some(val => typeof val === 'string' && val.length > 0 && val.trim() === '');
    if (hasOnlySpaces) {
      alert('Fields cannot contain only blank spaces.');
      return;
    }
    try {
      const isEdit = !!editId;
      const payload = isEdit ? formData : { sn: nextSn, ...formData };
      const saved = isEdit ? await purchasesApi.updatePurchase(editId, payload) : await purchasesApi.createPurchase(payload);
      if (isEdit) {
        setPurchases(purchases.map(p => p._id === editId ? saved : p));
      } else {
        setPurchases([...purchases, saved]);
      }
      setFormData({ date: '', vendor: '', particular: '', discount: '', vatRate: '13%', taxable: '', vat: '', total: '', paid: '', credit: '' });
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save purchase:', err);
    }
  };

  const handleEdit = (p) => {
    setFormData({
      date: p.date, vendor: p.vendor, particular: p.particular,
      discount: p.discount, vatRate: p.vatRate, taxable: p.taxable,
      vat: p.vat, total: p.total, paid: p.paid, credit: p.credit
    });
    setEditId(p._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase?')) return;
    try {
      await purchasesApi.deletePurchase(id);
      setPurchases(purchases.filter(p => p._id !== id));
    } catch (err) {
      console.error('Failed to delete purchase:', err);
    }
  };

  const filteredPurchases = purchases
    .filter(p => p.vendor && p.vendor.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.vendor.localeCompare(b.vendor));

  // ─── Vendor Modal Logic ───
  // ─── Vendor Modal Logic ───
  const openVendorModal = async (vendorName, purchaseItem) => {
    setModalLoading(true);
    setShowVendorModal(true);
    setShowAccForm(false);
    setActivePurchase(purchaseItem);
    setFilterOnlyActivePurchase(true);

    console.log('Purchase Item:', purchaseItem);
    console.log('Discount value:', purchaseItem?.discount);

    const discountValue = purchaseItem?.discount !== undefined && purchaseItem?.discount !== null && purchaseItem?.discount !== '' ? String(purchaseItem.discount) : '';
    const totalValue = parseFloat(purchaseItem?.total) || 0;
    const discountNum = parseFloat(purchaseItem?.discount) || 0;
    const balanceValue = totalValue - discountNum;

    console.log('Setting discount to:', discountValue);
    console.log('Balance calculated:', balanceValue);

    setAccForm({
      invoiceNo: purchaseItem ? `INV-${purchaseItem.sn}` : '',
      date: purchaseItem ? purchaseItem.date : '',
      programs: purchaseItem ? purchaseItem.particular : '',
      debit: purchaseItem ? String(purchaseItem.total) : '',
      bank: '',
      acNo: '',
      recDate: '',
      discount: discountValue,
      balance: String(balanceValue)
    });

    console.log('accForm after setting:', {
      invoiceNo: purchaseItem ? `INV-${purchaseItem.sn}` : '',
      date: purchaseItem ? purchaseItem.date : '',
      programs: purchaseItem ? purchaseItem.particular : '',
      debit: purchaseItem ? String(purchaseItem.total) : '',
      discount: discountValue,
      balance: String(balanceValue)
    });

    try {
      const res = await fetch(`${API_BASE}/api/vendors?name=${encodeURIComponent(vendorName.trim())}`);
      const data = await res.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const v = data.find(item => item.name.toLowerCase() === vendorName.toLowerCase().trim()) || data[0];
        setModalVendor(v);
        setVendorForm({
          name: v.name || '',
          address: v.address || '',
          phone: v.phone || '',
          pan: v.pan || '',
          contact1: v.contact1 || '',
          contact2: v.contact2 || ''
        });
        setModalAccountDetails(v.accountDetails || []);
      } else {
        setModalVendor(null);
        setVendorForm({ name: vendorName, address: '', phone: '', pan: '', contact1: '', contact2: '' });
        setModalAccountDetails([]);
      }
    } catch (err) {
      console.error('Error fetching vendor:', err);
      setModalVendor(null);
      setVendorForm({ name: vendorName, address: '', phone: '', pan: '', contact1: '', contact2: '' });
      setModalAccountDetails([]);
    }
    setModalLoading(false);
  };

  const handleVendorFormChange = (e) => {
    setVendorForm({ ...vendorForm, [e.target.name]: e.target.value });
  };

  const handleSaveVendor = async () => {
    if (!vendorForm.name || vendorForm.name.trim() === '') {
      alert('Vendor name is required.');
      return;
    }
    const hasOnlySpaces = Object.values(vendorForm).some(val => typeof val === 'string' && val.length > 0 && val.trim() === '');
    if (hasOnlySpaces) {
      alert('Fields cannot contain only blank spaces.');
      return;
    }
    try {
      const payload = { ...vendorForm, accountDetails: modalAccountDetails.map((item, idx) => ({ ...item, sn: idx + 1 })) };
      const res = await fetch(`${API_BASE}/api/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        setModalVendor(saved);
        setModalAccountDetails(saved.accountDetails || []);
        alert('Vendor saved successfully!');
        window.location.reload();
      }
    } catch (err) {
      console.error('Error saving vendor:', err);
    }
  };

  const handleAccFormChange = (e) => {
    setAccForm({ ...accForm, [e.target.name]: e.target.value });
  };

  const handleAddAccountDetail = () => {
    if (!accForm.date || accForm.date.trim() === '' || !accForm.programs || accForm.programs.trim() === '' || !accForm.debit || String(accForm.debit).trim() === '') {
      alert('Date, Particulars, and Debit Amount are required.');
      return;
    }
    const hasOnlySpaces = Object.values(accForm).some(val => typeof val === 'string' && val.length > 0 && val.trim() === '');
    if (hasOnlySpaces) {
      alert('Fields cannot contain only blank spaces.');
      return;
    }
    
    // Check if invoice number already exists
    const invoiceNo = String(accForm.invoiceNo || '').trim();
    const existingIndex = invoiceNo !== '' 
      ? modalAccountDetails.findIndex(a => String(a.invoiceNo || '').trim() === invoiceNo)
      : -1;

    if (existingIndex !== -1) {
      // UPDATE existing row
      const updated = [...modalAccountDetails];
      updated[existingIndex] = {
        sn: updated[existingIndex].sn,
        invoiceNo: accForm.invoiceNo || updated[existingIndex].invoiceNo,
        date: accForm.date || updated[existingIndex].date,
        programs: accForm.programs || updated[existingIndex].programs,
        debit: accForm.debit ? Number(accForm.debit) : updated[existingIndex].debit,
        bank: accForm.bank || updated[existingIndex].bank,
        acNo: accForm.acNo || updated[existingIndex].acNo,
        recDate: accForm.recDate || updated[existingIndex].recDate,
        discount: accForm.discount ? Number(accForm.discount) : updated[existingIndex].discount,
        balance: accForm.balance ? Number(accForm.balance) : updated[existingIndex].balance
      };
      setModalAccountDetails(updated);
      alert('Account detail updated for invoice: ' + invoiceNo);
    } else {
      // ADD new row
      const newSn = modalAccountDetails.length > 0
        ? Math.max(...modalAccountDetails.map(a => a.sn || 0)) + 1
        : 1;
      const newEntry = {
        sn: newSn,
        invoiceNo: accForm.invoiceNo,
        date: accForm.date,
        programs: accForm.programs,
        debit: Number(accForm.debit) || 0,
        bank: accForm.bank,
        acNo: accForm.acNo,
        recDate: accForm.recDate,
        discount: Number(accForm.discount) || 0,
        balance: Number(accForm.balance) || 0
      };
      setModalAccountDetails([...modalAccountDetails, newEntry]);
    }
    setAccForm({ invoiceNo: '', date: '', programs: '', debit: '', bank: '', acNo: '', recDate: '', discount: '', balance: '' });
    setShowAccForm(false);
  };

  const handleDeleteAccountDetail = (indexToDel) => {
    const updated = modalAccountDetails.filter((_, idx) => idx !== indexToDel);
    const recalculated = updated.map((item, idx) => ({
      ...item,
      sn: idx + 1
    }));
    setModalAccountDetails(recalculated);
  };

  const closeModal = () => {
    setShowVendorModal(false);
    setModalVendor(null);
    setModalAccountDetails([]);
    setActivePurchase(null);
  };

  // ─── Modal styles ───
  const backdropStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    zIndex: 1000, padding: '2rem', overflowY: 'auto',
    backdropFilter: 'blur(6px)'
  };
  const modalStyle = {
    backgroundColor: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    width: '100%', maxWidth: '900px',
    padding: '2rem',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
    marginTop: '1rem', marginBottom: '2rem'
  };

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 className="page-title" style={{marginBottom: 0}}>4. Purchases Details</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="Search by vendor name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ minWidth: '200px', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
          />
          <button className="btn" style={{backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'}} onClick={() => window.print()}>
            <Printer size={18} /> Print
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); if(showForm) setEditId(null); }}>
            {showForm ? 'Cancel' : (editId ? 'Cancel Edit' : 'Add Purchase')}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6 border-primary">
          <h2 className="card-header" style={{fontSize: '1.25rem', marginBottom: '1rem', textTransform: 'none', color: 'var(--primary-color)'}}>
            {editId ? 'Edit Purchase' : 'Add New Purchase'}
          </h2>
          <div className="form-grid mb-4">
            <div>
              <label className="form-label">Date</label>
              <input type="text" name="date" value={formData.date} onChange={handleChange} placeholder="Date" />
            </div>
            <div>
              <label className="form-label">Vender name</label>
              <input type="text" name="vendor" value={formData.vendor} onChange={handleChange} placeholder="Vendor Name" />
            </div>
            <div>
              <label className="form-label">Particulars</label>
              <input type="text" name="particular" value={formData.particular} onChange={handleChange} placeholder="Particulars" />
            </div>
            <div>
              <label className="form-label">discount</label>
              <input type="number" name="discount" value={formData.discount} onChange={handleChange} placeholder="Discount Amount" />
            </div>
            <div>
              <label className="form-label">VAT Rate 13%</label>
              <input type="text" name="vatRate" value={formData.vatRate} onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">Taxable Amount</label>
              <input type="number" name="taxable" value={formData.taxable} onChange={handleChange} placeholder="Taxable Amount" />
            </div>
            <div>
              <label className="form-label">VAT Amount</label>
              <input type="number" name="vat" value={formData.vat} onChange={handleChange} placeholder="VAT Amount" />
            </div>
            <div>
              <label className="form-label">Debit Amt</label>
              <input type="number" name="total" value={formData.total} onChange={handleChange} placeholder="Total Amount" />
            </div>
            <div>
              <label className="form-label">Paid Amount</label>
              <input type="number" name="paid" value={formData.paid} onChange={handleChange} placeholder="Paid Amount" />
            </div>
            <div>
              <label className="form-label">Credit Amt</label>
              <input type="number" name="credit" value={formData.credit} onChange={handleChange} placeholder="Credit Amount" readOnly style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSave}>
            {editId ? 'Update Purchase' : 'Save Purchase'}
          </button>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SN</th>
              <th>Date</th>
              <th>Vender name</th>
              <th>Particulars</th>
              <th>discount</th>
              <th>VAT Rate 13%</th>
              <th>Taxable Amount</th>
              <th>VAT Amount</th>
              <th>Debit Amt</th>
              <th>Paid Amount</th>
              <th>Credit Amt</th>
              <th>Actions</th>
              <th>View Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.map((p, index) => (
              <tr key={p._id || index}>
                <td>{index + 1}</td>
                <td>{p.date}</td>
                <td>{p.vendor}</td>
                <td>{p.particular}</td>
                <td>{p.discount}</td>
                <td>{p.vatRate}</td>
                <td>{p.taxable}</td>
                <td>{p.vat}</td>
                <td>{p.total}</td>
                <td>{p.paid}</td>
                <td>{p.credit}</td>
                <td>
                  <button className="btn btn-primary" style={{marginRight: '0.5rem', padding: '0.25rem 0.5rem'}} onClick={() => handleEdit(p)}>Edit</button>
                  <button className="btn" style={{backgroundColor: '#dc3545', color: 'white', padding: '0.25rem 0.5rem'}} onClick={() => handleDelete(p._id)}>Delete</button>
                </td>
                <td>
                  <button className="btn btn-outline" onClick={() => openVendorModal(p.vendor, p)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Vendor Details Modal ─── */}
      {showVendorModal && (
        <div style={backdropStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex-between mb-6" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Building2 size={22} style={{ color: 'var(--primary-color)' }} />
                Vendor Details
              </h2>
              <button onClick={closeModal} style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>
                <X size={22} />
              </button>
            </div>

            {modalLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading...</p>
            ) : (
              <>
                {/* Vendor Info Form */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>
                    {modalVendor ? 'Edit Vendor Info' : 'Add New Vendor'}
                  </h3>
                  <div className="form-grid mb-4">
                    <div>
                      <label className="form-label">Name</label>
                      <input type="text" name="name" value={vendorForm.name} onChange={handleVendorFormChange}
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }} readOnly />
                    </div>
                    <div>
                      <label className="form-label">Address</label>
                      <input type="text" name="address" value={vendorForm.address} onChange={handleVendorFormChange} placeholder="Vendor address" />
                    </div>
                    <div>
                      <label className="form-label">Phone No</label>
                      <input type="text" name="phone" value={vendorForm.phone} onChange={handleVendorFormChange} placeholder="Phone number" />
                    </div>
                    <div>
                      <label className="form-label">PAN/VAT</label>
                      <input type="text" name="pan" value={vendorForm.pan} onChange={handleVendorFormChange} placeholder="PAN/VAT number" />
                    </div>
                    <div>
                      <label className="form-label">Contact Person 1</label>
                      <input type="text" name="contact1" value={vendorForm.contact1} onChange={handleVendorFormChange} placeholder="Contact person 1" />
                    </div>
                    <div>
                      <label className="form-label">Contact Person 2</label>
                      <input type="text" name="contact2" value={vendorForm.contact2} onChange={handleVendorFormChange} placeholder="Contact person 2" />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveVendor}>
                    {modalVendor ? 'Update Vendor' : 'Save Vendor'}
                  </button>
                </div>

                {/* Account Details Section */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                      <FileText size={16} />
                      Account Details
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {activePurchase && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', margin: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={filterOnlyActivePurchase} 
                            onChange={(e) => setFilterOnlyActivePurchase(e.target.checked)} 
                            style={{ width: 'auto', margin: 0 }}
                          />
                          Show only this purchase ({activePurchase.particular})
                        </label>
                      )}
                      <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={() => setShowAccForm(!showAccForm)}>
                        {showAccForm ? 'Cancel' : <><Plus size={14} /> Add Entry</>}
                      </button>
                    </div>
                  </div>

                  {showAccForm && (
                    <div className="card mb-4" style={{ borderColor: 'var(--primary-color)' }}>
                      <div className="form-grid mb-4">
                        <div>
                          <label className="form-label">Invoice No</label>
                          <input type="text" name="invoiceNo" value={accForm.invoiceNo} onChange={handleAccFormChange} placeholder="INV-001" />
                        </div>
                        <div>
                          <label className="form-label">Date</label>
                          <input type="text" name="date" value={accForm.date} onChange={handleAccFormChange} placeholder="YYYY/MM/DD" />
                        </div>
                        <div>
                          <label className="form-label">Programs</label>
                          <input type="text" name="programs" value={accForm.programs} onChange={handleAccFormChange} placeholder="Service/Program" />
                        </div>
                        <div>
                          <label className="form-label">Debit</label>
                          <input type="number" name="debit" value={accForm.debit} onChange={handleAccFormChange} placeholder="Debit amount" />
                        </div>
                        <div>
                          <label className="form-label">Bank</label>
                          <input type="text" name="bank" value={accForm.bank} onChange={handleAccFormChange} placeholder="Bank name" />
                        </div>
                        <div>
                          <label className="form-label">A/C No</label>
                          <input type="text" name="acNo" value={accForm.acNo} onChange={handleAccFormChange} placeholder="Account number" />
                        </div>
                        <div>
                          <label className="form-label">Received Date</label>
                          <input type="text" name="recDate" value={accForm.recDate} onChange={handleAccFormChange} placeholder="YYYY/MM/DD" />
                        </div>
                        <div>
                          <label className="form-label">Discount</label>
                          <input type="number" name="discount" value={accForm.discount} onChange={handleAccFormChange} placeholder="Discount" />
                        </div>
                        <div>
                          <label className="form-label">Balance</label>
                          <input type="number" name="balance" value={accForm.balance} onChange={handleAccFormChange} placeholder="Balance" />
                        </div>
                      </div>
                      <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={handleAddAccountDetail}>Add to Table</button>
                    </div>
                  )}

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>SN</th>
                          <th>Invoice No</th>
                          <th>Date</th>
                          <th>Programs</th>
                          <th>Debit</th>
                          <th>Bank</th>
                          <th>A/C No</th>
                          <th>Rec. Date</th>
                          <th>Discount</th>
                          <th>Balance</th>
                          <th style={{ textAlign: 'center' }}>Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const displayed = (activePurchase && filterOnlyActivePurchase)
                            ? modalAccountDetails.filter(d => 
                                (d.programs && activePurchase.particular && d.programs.toLowerCase().includes(activePurchase.particular.toLowerCase())) ||
                                (d.invoiceNo && d.invoiceNo.toLowerCase() === `INV-${activePurchase.sn}`.toLowerCase()) ||
                                (d.debit === activePurchase.total)
                              )
                            : modalAccountDetails;
                          return displayed.length > 0 ? displayed.map((d, i) => (
                            <tr key={d.sn || i}>
                              <td>{i + 1}</td>
                              <td>{d.invoiceNo}</td>
                              <td>{d.date}</td>
                              <td>{d.programs}</td>
                              <td>{d.debit}</td>
                              <td>{d.bank}</td>
                              <td>{d.acNo}</td>
                              <td>{d.recDate}</td>
                              <td>{d.discount}</td>
                              <td>{d.balance}</td>
                              <td style={{ textAlign: 'center' }}>
                                <button 
                                  onClick={() => handleDeleteAccountDetail(modalAccountDetails.indexOf(d))} 
                                  style={{ color: 'var(--danger)', cursor: 'pointer' }}
                                  title="Delete row"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                                {activePurchase && filterOnlyActivePurchase 
                                  ? 'No account details matching this purchase. Uncheck the filter to see all.' 
                                  : 'No account details yet. Click "Add Entry" to add one.'}
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {modalVendor && (
                    <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                      <button className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }} onClick={handleSaveVendor}>
                        Save All Changes
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
