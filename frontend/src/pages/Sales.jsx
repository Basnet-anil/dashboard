import React, { useState, useEffect } from 'react';
import { X, User, FileText, Plus, Trash2, Printer } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

import * as salesApi from '../api/sales';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    date: '', customer: '', service: '', discount: '', vatRate: '13%', taxable: '', vat: '', total: '', received: '', receivedDate: '', balance: ''
  });

  // Customer modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [modalCustomer, setModalCustomer] = useState(null);
  const [modalAccountDetails, setModalAccountDetails] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '', address: '', phone: '', pan: '', contact1: '', contact2: ''
  });
  const [showAccForm, setShowAccForm] = useState(false);
  const [accForm, setAccForm] = useState({
    invoiceNo: '', date: '', programs: '', debit: '', bank: '', acNo: '', recDate: '', discount: '', balance: ''
  });
  const [activeSale, setActiveSale] = useState(null);
  const [filterOnlyActiveSale, setFilterOnlyActiveSale] = useState(true);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const data = await salesApi.listSales();
        setSales(data);
      } catch (err) {
        console.error('Failed to fetch sales:', err);
      }
    };
    fetchSales();
  }, []);

  const nextSn = sales.length > 0 ? Math.max(...sales.map(s => s.sn)) + 1 : 1;

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
      
      // Auto-fill received with total amount when calculating
      updated.received = totalVal.toFixed(2);
      
      // Calculate balance (credit/due)
      const receivedVal = parseFloat(updated.received) || 0;
      updated.balance = (totalVal - receivedVal).toFixed(2);
    }

    // When received or total changes, recalculate balance
    if (name === 'received' || name === 'total') {
      const totalVal = parseFloat(name === 'total' ? value : updated.total) || 0;
      const receivedVal = parseFloat(name === 'received' ? value : updated.received) || 0;
      updated.balance = (totalVal - receivedVal).toFixed(2);
    }

    setFormData(updated);
  };

  const handleSave = async () => {
    const requiredFields = [
      { key: 'date', label: 'Date' },
      { key: 'customer', label: 'Customer' },
      { key: 'service', label: 'Service' },
      { key: 'taxable', label: 'Taxable Amount' }
    ];
    const missingFields = requiredFields.filter(({ key }) => {
      const val = formData[key];
      return val === null || val === undefined || String(val).trim() === '';
    });
    if (missingFields.length > 0) {
      setFormError(`Please fill in ${missingFields.map((field) => field.label).join(', ')} before saving.`);
      return;
    }
    const hasOnlySpaces = Object.values(formData).some(val => typeof val === 'string' && val.length > 0 && val.trim() === '');
    if (hasOnlySpaces) {
      setFormError('Fields cannot contain only blank spaces.');
      return;
    }

    setFormError('');

    try {
      const isEdit = !!editId;
      const payload = isEdit ? formData : { sn: nextSn, ...formData };
      const saved = isEdit ? await salesApi.updateSale(editId, payload) : await salesApi.createSale(payload);
      if (isEdit) {
        setSales(sales.map(s => s._id === editId ? saved : s));
      } else {
        setSales([...sales, saved]);
      }
      setFormData({ date: '', customer: '', service: '', discount: '', vatRate: '13%', taxable: '', vat: '', total: '', received: '', receivedDate: '', balance: '' });
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save sale:', err);
      setFormError(err?.error || err?.message || 'Failed to save sale.');
    }
  };

  const handleEdit = (s) => {
    setFormData({
      date: s.date, customer: s.customer, service: s.service,
      discount: s.discount, vatRate: s.vatRate, taxable: s.taxable,
      vat: s.vat, total: s.total, received: s.received, 
      receivedDate: s.receivedDate, balance: s.balance
    });
    setEditId(s._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) return;
    try {
      await salesApi.deleteSale(id);
      setSales(sales.filter(s => s._id !== id));
    } catch (err) {
      console.error('Failed to delete sale:', err);
    }
  };

  // ─── Customer Modal Logic ───
  // ─── Customer Modal Logic ───
  const openCustomerModal = async (customerName, saleItem) => {
    setModalLoading(true);
    setShowCustomerModal(true);
    setShowAccForm(false);
    setActiveSale(saleItem);
    setFilterOnlyActiveSale(true);

    setAccForm({
      invoiceNo: saleItem ? `INV-${saleItem.sn}` : '',
      date: saleItem ? saleItem.date : '',
      programs: saleItem ? saleItem.service : '',
      debit: saleItem ? String(saleItem.total) : '',
      bank: '',
      acNo: '',
      recDate: saleItem ? saleItem.receivedDate : '',
      discount: saleItem ? String(saleItem.discount || '') : '',
      balance: saleItem ? String(saleItem.balance) : ''
    });

    try {
      const res = await fetch(`${API_BASE}/api/customers?name=${encodeURIComponent(customerName.trim())}`);
      const data = await res.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const c = data.find(item => item.name.toLowerCase() === customerName.toLowerCase().trim()) || data[0];
        setModalCustomer(c);
        setCustomerForm({
          name: c.name || '',
          address: c.address || '',
          phone: c.phone || '',
          pan: c.pan || '',
          contact1: c.contact1 || '',
          contact2: c.contact2 || ''
        });
        setModalAccountDetails(c.accountDetails || []);
      } else {
        // Customer doesn't exist yet — pre-fill name only
        setModalCustomer(null);
        setCustomerForm({
          name: customerName,
          address: '', phone: '', pan: '', contact1: '', contact2: ''
        });
        setModalAccountDetails([]);
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
      setModalCustomer(null);
      setCustomerForm({ name: customerName, address: '', phone: '', pan: '', contact1: '', contact2: '' });
      setModalAccountDetails([]);
    }
    setModalLoading(false);
  };

  const handleCustomerFormChange = (e) => {
    const { name, value } = e.target;
    // Only allow numbers for phone fields
    if (name === 'phone' && value && !/^\d*$/.test(value)) {
      return;
    }
    setCustomerForm({ ...customerForm, [name]: value });
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name || customerForm.name.trim() === '') {
      alert('Customer name is required.');
      return;
    }
    const hasOnlySpaces = Object.values(customerForm).some(val => typeof val === 'string' && val.length > 0 && val.trim() === '');
    if (hasOnlySpaces) {
      alert('Fields cannot contain only blank spaces.');
      return;
    }
    try {
      const payload = {
        ...customerForm,
        accountDetails: modalAccountDetails.map((item, idx) => ({ ...item, sn: idx + 1 }))
      };
      
      console.log('Saving customer:', modalCustomer?._id ? 'UPDATE' : 'CREATE');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      if (modalCustomer && modalCustomer._id) {
        // UPDATE existing customer
        console.log('Calling PUT /api/customers/' + modalCustomer._id);
        const res = await fetch(`${API_BASE}/api/customers/${modalCustomer._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        console.log('Response status:', res.status);
        const responseText = await res.text();
        console.log('Response text:', responseText);
        
        if (res.ok) {
          const saved = JSON.parse(responseText);
          setModalCustomer(saved);
          setModalAccountDetails(saved.accountDetails || []);
          alert('Customer updated successfully!');
          // Reload the customer to show fresh data
          window.location.reload();
        } else {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            errorData = { error: responseText };
          }
          const errorMsg = errorData?.message || errorData?.error || `Update failed with status ${res.status}`;
          console.error('Update customer error response:', errorData);
          alert(`Error: ${errorMsg}`);
        }
      } else {
        // CREATE new customer
        console.log('Calling POST /api/customers');
        const res = await fetch(`${API_BASE}/api/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        console.log('Response status:', res.status);
        const responseText = await res.text();
        console.log('Response text:', responseText);
        
        if (res.ok) {
          const saved = JSON.parse(responseText);
          setModalCustomer(saved);
          setModalAccountDetails(saved.accountDetails || []);
          alert('Customer saved successfully!');
        } else {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            errorData = { error: responseText };
          }
          const errorMsg = errorData?.message || errorData?.error || `Save failed with status ${res.status}`;
          console.error('Create customer error response:', errorData);
          alert(`Error: ${errorMsg}`);
        }
      }
    } catch (err) {
      console.error('Error saving customer - Full error:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      alert(`An unexpected error occurred: ${err.message}. Please check the browser console for details.`);
    }
  };

  const handleAccFormChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...accForm, [name]: value };
    if (name === 'debit' || name === 'discount') {
      const debit = parseFloat(name === 'debit' ? value : updated.debit) || 0;
      const discount = parseFloat(name === 'discount' ? value : updated.discount) || 0;
      updated.balance = (debit - discount).toFixed(2);
    }
    setAccForm(updated);
  };

  const handleAddAccountDetail = () => {
    if (!accForm.date || accForm.date.trim() === '' || !accForm.programs || accForm.programs.trim() === '' || !accForm.debit || String(accForm.debit).trim() === '') {
      alert('Date, Service, and Debit Amount are required.');
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
      // UPDATE existing row with same invoice number
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
    setShowCustomerModal(false);
    setModalCustomer(null);
    setModalAccountDetails([]);
    setActiveSale(null);
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
        <h1 className="page-title" style={{marginBottom: 0}}>2. Sales details</h1>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <button className="btn" style={{backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'}} onClick={() => window.print()}>
            <Printer size={18} /> Print
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); if(showForm) setEditId(null); }}>
            {showForm ? 'Cancel' : (editId ? 'Cancel Edit' : 'Add Sale')}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6 border-primary">
          <h2 className="card-header" style={{fontSize: '1.25rem', marginBottom: '1rem', textTransform: 'none', color: 'var(--primary-color)'}}>
            {editId ? 'Edit Sale' : 'Add New Sale'}
          </h2>
          <div className="form-grid mb-4">
            <div>
              <label className="form-label">Date (BS) <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="text" name="date" value={formData.date} onChange={handleChange} placeholder="YYYY/MM/DD" />
            </div>
            <div>
              <label className="form-label">Customer name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="text" name="customer" value={formData.customer} onChange={handleChange} placeholder="Customer Name" />
            </div>
            <div>
              <label className="form-label">service <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="text" name="service" value={formData.service} onChange={handleChange} placeholder="Service type" />
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
              <label className="form-label">Taxable Amount <span style={{ color: 'var(--danger)' }}>*</span></label>
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
              <label className="form-label">Received Amount</label>
              <input type="number" name="received" value={formData.received} onChange={handleChange} placeholder="Received Amount" />
            </div>
            <div>
              <label className="form-label">Rec. Date</label>
              <input type="text" name="receivedDate" value={formData.receivedDate} onChange={handleChange} placeholder="YYYY/MM/DD" />
            </div>
            <div>
              <label className="form-label">Credit Amt</label>
              <input type="number" name="balance" value={formData.balance} onChange={handleChange} placeholder="Balance Amount" readOnly style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }} />
            </div>
          </div>
          {formError && (
            <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontWeight: 600 }}>
              {formError}
            </div>
          )}
          <button className="btn btn-primary" onClick={handleSave}>
            {editId ? 'Update Sale' : 'Save Sale'}
          </button>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SN</th>
              <th>Date (BS)</th>
              <th>Customer name</th>
              <th>service</th>
              <th>discount</th>
              <th>VAT Rate 13%</th>
              <th>Taxable Amount</th>
              <th>VAT Amount</th>
              <th>Debit Amt</th>
              <th>Received Amount</th>
              <th>Rec. Date</th>
              <th>Credit Amt</th>
              <th>Actions</th>
              <th>View Details</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s, index) => (
              <tr key={s._id || index}>
                <td>{index + 1}</td>
                <td>{s.date}</td>
                <td>{s.customer}</td>
                <td>{s.service}</td>
                <td>{s.discount}</td>
                <td>{s.vatRate}</td>
                <td>{s.taxable}</td>
                <td>{s.vat}</td>
                <td>{s.total}</td>
                <td>{s.received}</td>
                <td>{s.receivedDate}</td>
                <td>{s.balance}</td>
                <td>
                  <button className="btn btn-primary" style={{marginRight: '0.5rem', padding: '0.25rem 0.5rem'}} onClick={() => handleEdit(s)}>Edit</button>
                  <button className="btn" style={{backgroundColor: '#dc3545', color: 'white', padding: '0.25rem 0.5rem'}} onClick={() => handleDelete(s._id)}>Delete</button>
                </td>
                <td>
                  <button className="btn btn-outline" onClick={() => openCustomerModal(s.customer, s)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Customer Details Modal ─── */}
      {showCustomerModal && (
        <div style={backdropStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex-between mb-6" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={22} style={{ color: 'var(--primary-color)' }} />
                Customer Details
              </h2>
              <button onClick={closeModal} style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>
                <X size={22} />
              </button>
            </div>

            {modalLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading...</p>
            ) : (
              <>
                {/* Customer Info Form */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>
                    {modalCustomer ? 'Edit Customer Info' : 'Add New Customer'}
                  </h3>
                  <div className="form-grid mb-4">
                    <div>
                      <label className="form-label">Name</label>
                      <input type="text" name="name" value={customerForm.name} onChange={handleCustomerFormChange} 
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }} readOnly />
                    </div>
                    <div>
                      <label className="form-label">Address</label>
                      <input type="text" name="address" value={customerForm.address} onChange={handleCustomerFormChange} placeholder="Customer address" />
                    </div>
                    <div>
                      <label className="form-label">Phone No</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={customerForm.phone} 
                        onChange={handleCustomerFormChange} 
                        placeholder="Phone number (numbers only)"
                        pattern="[0-9]*"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="form-label">PAN/VAT</label>
                      <input type="text" name="pan" value={customerForm.pan} onChange={handleCustomerFormChange} placeholder="PAN/VAT number" />
                    </div>
                    <div>
                      <label className="form-label">Contact Person 1</label>
                      <input type="text" name="contact1" value={customerForm.contact1} onChange={handleCustomerFormChange} placeholder="Contact person 1" />
                    </div>
                    <div>
                      <label className="form-label">Contact Person 2</label>
                      <input type="text" name="contact2" value={customerForm.contact2} onChange={handleCustomerFormChange} placeholder="Contact person 2" />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveCustomer}>
                    {modalCustomer ? 'Update Customer' : 'Save Customer'}
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
                      {activeSale && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', margin: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={filterOnlyActiveSale} 
                            onChange={(e) => setFilterOnlyActiveSale(e.target.checked)} 
                            style={{ width: 'auto', margin: 0 }}
                          />
                          Show only this sale ({activeSale.service})
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
                          const displayed = (activeSale && filterOnlyActiveSale)
                            ? modalAccountDetails.filter(d => 
                                (d.programs && activeSale.service && d.programs.toLowerCase().includes(activeSale.service.toLowerCase())) ||
                                (d.invoiceNo && d.invoiceNo.toLowerCase() === `INV-${activeSale.sn}`.toLowerCase()) ||
                                (d.debit === activeSale.total)
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
                                {activeSale && filterOnlyActiveSale 
                                  ? 'No account details matching this sale. Uncheck the filter to see all.' 
                                  : 'No account details yet. Click "Add Entry" to add one.'}
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {modalCustomer && (
                    <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                      <button className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }} onClick={handleSaveCustomer}>
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

export default Sales;
