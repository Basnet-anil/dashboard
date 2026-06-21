import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, ArrowLeft, Save, Trash2, User, Landmark, FileText, Printer } from 'lucide-react';

import * as customersApi from '../api/customers';
import { updateCustomer } from '../api/customers';
import * as salesApi from '../api/sales';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const Customers = () => {
  const location = useLocation();
  const [customersList, setCustomersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected Customer state
  const [customer, setCustomer] = useState(null);
  const [accountDetails, setAccountDetails] = useState([]);
  const [customerSales, setCustomerSales] = useState([]);
  
  // Forms states
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  
  // New Customer Form
  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', pan: '', contact1: '', contact2: ''
  });

  // Selected Customer Edit Form
  const [customerForm, setCustomerForm] = useState({
    name: '', address: '', phone: '', pan: '', contact1: '', contact2: ''
  });

  // New Account Detail Form
  const [showAccForm, setShowAccForm] = useState(false);
  const [accForm, setAccForm] = useState({
    invoiceNo: '', date: '', programs: '', debit: '', bank: '', acNo: '', recDate: '', discount: '', balance: ''
  });

  const fetchAllCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/customers`);
      if (res.ok) {
        const data = await res.json();
        setCustomersList(Array.isArray(data) ? data : []);
      } else {
        console.error('Server error fetching customers:', res.status);
        setCustomersList([]);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setCustomersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCustomers();
  }, []);

  const selectCustomer = async (c) => {
    setCustomer(c);
    setCustomerForm({
      name: c.name || '',
      address: c.address || '',
      phone: c.phone || '',
      pan: c.pan || '',
      contact1: c.contact1 || '',
      contact2: c.contact2 || ''
    });
    setAccountDetails(c.accountDetails || []);
    setShowAccForm(false);
    setAccForm({ invoiceNo: '', date: '', programs: '', debit: '', bank: '', acNo: '', recDate: '', discount: '', balance: '' });

    // Fetch related sales
    try {
      const salesData = await salesApi.listSales({ customer: c.name?.trim() });
      setCustomerSales(salesData);
    } catch (err) {
      console.error('Error fetching sales for customer:', err);
      setCustomerSales([]);
    }
  };

  const handleSearchByName = async (nameQuery) => {
    if (!nameQuery.trim()) return;
    setError('');
    try {
      const data = await customersApi.listCustomers({ name: nameQuery.trim() });
      if (data && (Array.isArray(data) ? data.length > 0 : true)) {
        const c = Array.isArray(data) ? data[0] : data;
        selectCustomer(c);
      } else {
        setError('No customer found with that name.');
      }
    } catch (err) {
      setError(err.error || err.message || 'Error searching customer.');
    }
  };

  useEffect(() => {
    if (location.state && location.state.searchName) {
      handleSearchByName(location.state.searchName);
    }
  }, [location.state]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    // Only allow numbers for phone field
    if (name === 'phone' && value && !/^\d*$/.test(value)) {
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleCustomerFormChange = (e) => {
    const { name, value } = e.target;
    // Only allow numbers for phone fields
    if (name === 'phone' && value && !/^\d*$/.test(value)) {
      return;
    }
    setCustomerForm({ ...customerForm, [name]: value });
  };

  const handleAccFormChange = (e) => {
    setAccForm({ ...accForm, [e.target.name]: e.target.value });
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || formData.name.trim() === '') {
      setError('Customer name is required.');
      return;
    }
    const hasOnlySpaces = Object.values(formData).some(val => typeof val === 'string' && val.length > 0 && val.trim() === '');
    if (hasOnlySpaces) {
      setError('Fields cannot contain only blank spaces.');
      return;
    }
    try {
      const newCustomer = await customersApi.createCustomer(formData);
      setShowAddForm(false);
      setFormData({ name: '', address: '', phone: '', pan: '', contact1: '', contact2: '' });
      await fetchAllCustomers();
      selectCustomer(newCustomer);
    } catch (err) {
      setError(err.error || err.message || 'Error adding customer.');
    }
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
      ? accountDetails.findIndex(a => String(a.invoiceNo || '').trim() === invoiceNo)
      : -1;

    if (existingIndex !== -1) {
      // UPDATE existing row with same invoice number
      const updated = [...accountDetails];
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
      setAccountDetails(updated);
      alert('Account detail updated for invoice: ' + invoiceNo);
    } else {
      // ADD new row
      const newSn = accountDetails.length > 0
        ? Math.max(...accountDetails.map(a => a.sn || 0)) + 1
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
      setAccountDetails([...accountDetails, newEntry]);
    }
    setAccForm({ invoiceNo: '', date: '', programs: '', debit: '', bank: '', acNo: '', recDate: '', discount: '', balance: '' });
    setShowAccForm(false);
  };

  const handleDeleteAccountDetail = (indexToDel) => {
    const updated = accountDetails.filter((_, idx) => idx !== indexToDel);
    const recalculated = updated.map((item, idx) => ({
      ...item,
      sn: idx + 1
    }));
    setAccountDetails(recalculated);
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
    try {
      await customersApi.deleteCustomer(id);
      // Refresh list
      await fetchAllCustomers();
      // If the deleted customer is currently selected, clear selection
      if (customer && customer._id === id) {
        setCustomer(null);
        setCustomerForm({ name: '', address: '', phone: '', pan: '', contact1: '', contact2: '' });
        setAccountDetails([]);
        setCustomerSales([]);
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert(err.error || err.message || 'Failed to delete customer.');
    }
  }

  const handleSaveCustomerChanges = async () => {
    setError('');
    if (!customerForm.name || customerForm.name.trim() === '') {
      setError('Customer name is required.');
      return;
    }
    if (!customer || !customer._id) {
      setError('Customer ID is missing. Please go back and select the customer again.');
      return;
    }
    const hasOnlySpaces = Object.values(customerForm).some(val => typeof val === 'string' && val.length > 0 && val.trim() === '');
    if (hasOnlySpaces) {
      setError('Fields cannot contain only blank spaces.');
      return;
    }
    try {
      const payload = {
        ...customerForm,
        accountDetails: accountDetails.map((item, idx) => ({ ...item, sn: idx + 1 }))
      };
      const saved = await updateCustomer(customer._id, payload);
      setCustomer(saved);
      setAccountDetails(saved.accountDetails || []);
      alert('Customer changes saved successfully!');
      await fetchAllCustomers();
      // Reload page to show updated data
      window.location.reload();
    } catch (err) {
      const errorMsg = err?.error || err?.message || 'Failed to save customer changes. Please try again.';
      setError(errorMsg);
      console.error('Save error:', err);
    }
  };

  const filteredCustomers = customersList.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      (c.pan && c.pan.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 className="page-title" style={{ marginBottom: 0 }}>3. Customer's Details</h1>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          {!customer && (
            <button className="btn" style={{backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'}} onClick={() => window.print()}>
              <Printer size={18} /> Print
            </button>
          )}
          {customer ? (
            <button onClick={() => setCustomer(null)} className="btn btn-outline" style={{ padding: '0.5rem 1.2rem' }}>
              <ArrowLeft size={16} /> Back to All Customers
            </button>
          ) : (
            <button onClick={() => { setShowAddForm(!showAddForm); setError(''); }} className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', backgroundColor: showAddForm ? '#dc3545' : '#28a745' }}>
              {showAddForm ? 'Cancel' : 'Add Customer'}
            </button>
          )}
        </div>
      </div>

      {error && <p className="mb-4" style={{ color: 'var(--danger)', fontWeight: '500' }}>{error}</p>}

      {/* List of All Customers View */}
      {!customer && !showAddForm && (
        <>
          {/* Search Bar */}
          <div className="card mb-6" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 1.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search customers by name, address, phone, PAN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
          </div>

          <div className="card">
            <h2 className="card-header" style={{ fontSize: '1.1rem', marginBottom: '1rem', textTransform: 'none' }}>All Registered Customers</h2>
            {loading ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading customers...</p>
            ) : filteredCustomers.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>SN</th>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Phone No</th>
                      <th>PAN/VAT</th>
                      <th>Contact Persons</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((c, index) => (
                      <tr key={c._id || index}>
                        <td>{index + 1}</td>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.address || '-'}</td>
                        <td>{c.phone || '-'}</td>
                        <td>{c.pan || '-'}</td>
                        <td>
                          {c.contact1 && <div>1. {c.contact1}</div>}
                          {c.contact2 && <div>2. {c.contact2}</div>}
                          {!c.contact1 && !c.contact2 && '-'}
                        </td>
                        <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => selectCustomer(c)}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(c._id)}
                            className="btn"
                            style={{ backgroundColor: '#dc3545', color: 'white', padding: '0.4rem 0.6rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Delete Customer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No customers found matching search term.</p>
            )}
          </div>
        </>
      )}

      {/* Add Customer Form */}
      {!customer && showAddForm && (
        <div className="card mb-6">
          <h2 className="card-header" style={{ fontSize: '1.1rem', marginBottom: '1rem', textTransform: 'none' }}>Add New Customer</h2>
          <form onSubmit={handleAddCustomer}>
            <div className="form-grid">
              <div>
                <label className="form-label">Name:</label>
                <input type="text" name="name" value={formData.name} onChange={handleFormChange} required className="form-input" />
              </div>
              <div>
                <label className="form-label">Address:</label>
                <input type="text" name="address" value={formData.address} onChange={handleFormChange} className="form-input" />
              </div>
              <div>
                <label className="form-label">Phone No:</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleFormChange} 
                  className="form-input"
                  placeholder="Phone number (numbers only)"
                  pattern="[0-9]*"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="form-label">PAN/VAT:</label>
                <input type="text" name="pan" value={formData.pan} onChange={handleFormChange} className="form-input" />
              </div>
              <div>
                <label className="form-label">Contact Person 1:</label>
                <input type="text" name="contact1" value={formData.contact1} onChange={handleFormChange} className="form-input" />
              </div>
              <div>
                <label className="form-label">Contact Person 2:</label>
                <input type="text" name="contact2" value={formData.contact2} onChange={handleFormChange} className="form-input" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem', padding: '0.6rem 1.8rem' }}>Save Customer</button>
          </form>
        </div>
      )}

      {/* Selected Customer Edit View */}
      {customer && (
        <div>
          {/* Customer Editable Details Card */}
          <div className="card mb-6">
            <h2 className="card-header" style={{ fontSize: '1.1rem', marginBottom: '1.2rem', textTransform: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
              <User size={18} /> Edit Customer Information
            </h2>
            <div className="form-grid">
              <div>
                <label className="form-label">Customer Name (Read-Only)</label>
                <input 
                  type="text" 
                  name="name" 
                  value={customerForm.name} 
                  readOnly 
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }} 
                />
              </div>
              <div>
                <label className="form-label">Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={customerForm.address} 
                  onChange={handleCustomerFormChange} 
                />
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
                <input 
                  type="text" 
                  name="pan" 
                  value={customerForm.pan} 
                  onChange={handleCustomerFormChange} 
                />
              </div>
              <div>
                <label className="form-label">Contact Person 1</label>
                <input 
                  type="text" 
                  name="contact1" 
                  value={customerForm.contact1} 
                  onChange={handleCustomerFormChange} 
                />
              </div>
              <div>
                <label className="form-label">Contact Person 2</label>
                <input 
                  type="text" 
                  name="contact2" 
                  value={customerForm.contact2} 
                  onChange={handleCustomerFormChange} 
                />
              </div>
            </div>
          </div>

          {/* Account Details Management */}
          <div className="flex-between mb-4">
            <h2 className="card-header" style={{ fontSize: '1.1rem', margin: 0, textTransform: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Landmark size={18} /> Account Details
            </h2>
            <button 
              className="btn btn-outline" 
              onClick={() => setShowAccForm(!showAccForm)}
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              <Plus size={14} /> Add Account Detail
            </button>
          </div>

          {/* Add Account Detail Form */}
          {showAccForm && (
            <div className="card mb-6 border-primary" style={{ padding: '1.5rem', backgroundColor: 'rgba(59, 130, 246, 0.02)' }}>
              <h3 className="card-header" style={{ fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'none' }}>Add New Account Transaction Row</h3>
              <div className="form-grid mb-4">
                <div>
                  <label className="form-label">Invoice No</label>
                  <input type="text" name="invoiceNo" value={accForm.invoiceNo} onChange={handleAccFormChange} placeholder="Invoice No" />
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input type="text" name="date" value={accForm.date} onChange={handleAccFormChange} placeholder="YYYY/MM/DD" />
                </div>
                <div>
                  <label className="form-label">Programs</label>
                  <input type="text" name="programs" value={accForm.programs} onChange={handleAccFormChange} placeholder="Programs/Details" />
                </div>
                <div>
                  <label className="form-label">Debit</label>
                  <input type="number" name="debit" value={accForm.debit} onChange={handleAccFormChange} placeholder="Debit Amount" />
                </div>
                <div>
                  <label className="form-label">Bank</label>
                  <input type="text" name="bank" value={accForm.bank} onChange={handleAccFormChange} placeholder="Bank Name" />
                </div>
                <div>
                  <label className="form-label">A/C No</label>
                  <input type="text" name="acNo" value={accForm.acNo} onChange={handleAccFormChange} placeholder="Account Number" />
                </div>
                <div>
                  <label className="form-label">Date Received</label>
                  <input type="text" name="recDate" value={accForm.recDate} onChange={handleAccFormChange} placeholder="YYYY/MM/DD" />
                </div>
                <div>
                  <label className="form-label">Discount</label>
                  <input type="number" name="discount" value={accForm.discount} onChange={handleAccFormChange} placeholder="Discount" />
                </div>
                <div>
                  <label className="form-label">Balance</label>
                  <input type="number" name="balance" value={accForm.balance} onChange={handleAccFormChange} placeholder="Balance Amount" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleAddAccountDetail} className="btn btn-primary" style={{ padding: '0.5rem 1.2rem' }}>
                  Confirm Add
                </button>
                <button onClick={() => setShowAccForm(false)} className="btn btn-outline" style={{ padding: '0.5rem 1.2rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Account Details Table */}
          <div className="table-container mb-6">
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
                  <th>Received Date</th>
                  <th>Discount</th>
                  <th>Balance</th>
                  <th style={{ textAlign: 'center' }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {accountDetails.length > 0 ? accountDetails.map((d, index) => (
                  <tr key={d.sn || index}>
                    <td>{index + 1}</td>
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
                        onClick={() => handleDeleteAccountDetail(index)} 
                        style={{ color: 'var(--danger)', cursor: 'pointer' }}
                        title="Delete this row"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No account details rows added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sales Details (Read Only) */}
          <h2 className="card-header mt-6" style={{ fontSize: '1.1rem', marginBottom: '1rem', textTransform: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> Sales History
          </h2>
          <div className="table-container mb-6">
            <table>
              <thead>
                <tr>
                  <th>SN</th>
                  <th>Date (BS)</th>
                  <th>Service</th>
                  <th>Discount</th>
                  <th>VAT Rate</th>
                  <th>Taxable Amount</th>
                  <th>VAT Amount</th>
                  <th>Debit Amt</th>
                  <th>Paid Amount</th>
                  <th>Credit Amt</th>
                </tr>
              </thead>
              <tbody>
                {customerSales.length > 0 ? customerSales.map((s, index) => (
                  <tr key={s.sn || index}>
                    <td>{s.sn}</td>
                    <td>{s.date}</td>
                    <td>{s.service}</td>
                    <td>{s.discount}</td>
                    <td>{s.vatRate}</td>
                    <td>{s.taxable}</td>
                    <td>{s.vat}</td>
                    <td>{s.total}</td>
                    <td>{s.received}</td>
                    <td>{s.balance}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No sales records found for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Save All Changes Action Bar */}
          <div className="card flex-between" style={{ padding: '1rem 1.5rem', borderColor: 'var(--primary-color)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Make sure to save after adding details or modifying customer fields.</span>
            <button onClick={handleSaveCustomerChanges} className="btn btn-primary" style={{ padding: '0.6rem 1.8rem' }}>
              <Save size={16} /> Save All Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
