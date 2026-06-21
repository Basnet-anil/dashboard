import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, ArrowLeft, Save, Trash2, Building2, Landmark, FileText, Printer } from 'lucide-react';

import * as vendorsApi from '../api/vendors';
import * as purchasesApi from '../api/purchases';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const Vendors = () => {
  const location = useLocation();
  const [vendorsList, setVendorsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected Vendor state
  const [vendor, setVendor] = useState(null);
  const [accountDetails, setAccountDetails] = useState([]);
  const [vendorPurchases, setVendorPurchases] = useState([]);
  
  // Forms states
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  
  // New Vendor Form
  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', pan: '', contact1: '', contact2: ''
  });

  // Selected Vendor Edit Form
  const [vendorForm, setVendorForm] = useState({
    name: '', address: '', phone: '', pan: '', contact1: '', contact2: ''
  });

  // New Account Detail Form
  const [showAccForm, setShowAccForm] = useState(false);
  const [accForm, setAccForm] = useState({
    invoiceNo: '', date: '', programs: '', debit: '', bank: '', acNo: '', recDate: '', discount: '', balance: ''
  });

  const fetchAllVendors = async () => {
    setLoading(true);
    try {
      const data = await vendorsApi.listVendors();
      setVendorsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVendors();
  }, []);

  const selectVendor = async (v) => {
    setVendor(v);
    setVendorForm({
      name: v.name || '',
      address: v.address || '',
      phone: v.phone || '',
      pan: v.pan || '',
      contact1: v.contact1 || '',
      contact2: v.contact2 || ''
    });
    setAccountDetails(v.accountDetails || []);
    setShowAccForm(false);
    setAccForm({ invoiceNo: '', date: '', programs: '', debit: '', bank: '', acNo: '', recDate: '', discount: '', balance: '' });

    // Fetch related purchases
    try {
      const purchasesData = await purchasesApi.listPurchases({ vendor: v.name });
      setVendorPurchases(purchasesData);
    } catch (err) {
      console.error('Error fetching purchases for vendor:', err);
      setVendorPurchases([]);
    }
  };

  const handleSearchByName = async (nameQuery) => {
    if (!nameQuery.trim()) return;
    setError('');
    try {
      const data = await vendorsApi.listVendors({ name: nameQuery.trim() });
      if (data && (Array.isArray(data) ? data.length > 0 : true)) {
        const v = Array.isArray(data) ? data[0] : data;
        selectVendor(v);
      } else {
        setError('No vendor found with that name.');
      }
    } catch (err) {
      setError(err.error || err.message || 'Error searching vendor.');
    }
  };

  useEffect(() => {
    if (location.state && location.state.searchName) {
      handleSearchByName(location.state.searchName);
    }
  }, [location.state]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVendorFormChange = (e) => {
    setVendorForm({ ...vendorForm, [e.target.name]: e.target.value });
  };

  const handleAccFormChange = (e) => {
    setAccForm({ ...accForm, [e.target.name]: e.target.value });
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || formData.name.trim() === '') {
      setError('Vendor name is required.');
      return;
    }
    const hasOnlySpaces = Object.values(formData).some(val => typeof val === 'string' && val.length > 0 && val.trim() === '');
    if (hasOnlySpaces) {
      setError('Fields cannot contain only blank spaces.');
      return;
    }
    try {
      const newVendor = await vendorsApi.createVendor(formData);
      setShowAddForm(false);
      setFormData({ name: '', address: '', phone: '', pan: '', contact1: '', contact2: '' });
      await fetchAllVendors();
      selectVendor(newVendor);
    } catch (err) {
      setError(err.error || err.message || 'Error adding vendor.');
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
      // UPDATE existing row
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

  const handleSaveVendorChanges = async () => {
    setError('');
    if (!vendorForm.name || vendorForm.name.trim() === '') {
      setError('Vendor name is required.');
      return;
    }
    const hasOnlySpaces = Object.values(vendorForm).some(val => typeof val === 'string' && val.length > 0 && val.trim() === '');
    if (hasOnlySpaces) {
      setError('Fields cannot contain only blank spaces.');
      return;
    }
    try {
      const payload = {
        ...vendorForm,
        accountDetails: accountDetails.map((item, idx) => ({ ...item, sn: idx + 1 }))
      };
      const saved = await vendorsApi.createVendor(payload);
      setVendor(saved);
      setAccountDetails(saved.accountDetails || []);
      alert('Vendor changes saved successfully!');
      await fetchAllVendors();
      window.location.reload();
    } catch (err) {
      setError(err.error || err.message || 'Error saving vendor changes.');
    }
  };

  const handleDeleteVendor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) return;
    try {
      await vendorsApi.deleteVendor(id);
      await fetchAllVendors();
      if (vendor && vendor._id === id) {
        setVendor(null);
        setVendorForm({ name: '', address: '', phone: '', pan: '', contact1: '', contact2: '' });
        setAccountDetails([]);
        setVendorPurchases([]);
      }
    } catch (err) {
      console.error('Failed to delete vendor:', err);
      alert(err.error || err.message || 'Failed to delete vendor.');
    }
  };

  const filteredVendors = vendorsList
    .filter(v => {
      const term = searchTerm.toLowerCase();
      return (
        (v.name && v.name.toLowerCase().includes(term)) ||
        (v.address && v.address.toLowerCase().includes(term)) ||
        (v.phone && v.phone.toLowerCase().includes(term)) ||
        (v.pan && v.pan.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 className="page-title" style={{ marginBottom: 0 }}>5. Vender's Details</h1>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          {!vendor && (
            <button className="btn" style={{backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'}} onClick={() => window.print()}>
              <Printer size={18} /> Print
            </button>
          )}
          {vendor ? (
            <button onClick={() => setVendor(null)} className="btn btn-outline" style={{ padding: '0.5rem 1.2rem' }}>
              <ArrowLeft size={16} /> Back to All Vendors
            </button>
          ) : (
            <button onClick={() => { setShowAddForm(!showAddForm); setError(''); }} className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', backgroundColor: showAddForm ? '#dc3545' : '#28a745' }}>
              {showAddForm ? 'Cancel' : 'Add Vendor'}
            </button>
          )}
        </div>
      </div>

      {error && <p className="mb-4" style={{ color: 'var(--danger)', fontWeight: '500' }}>{error}</p>}

      {/* List of All Vendors View */}
      {!vendor && !showAddForm && (
        <>
          {/* Search Bar */}
          <div className="card mb-6" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 1.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search vendors by name, address, phone, PAN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
          </div>

          <div className="card">
            <h2 className="card-header" style={{ fontSize: '1.1rem', marginBottom: '1rem', textTransform: 'none' }}>All Registered Vendors</h2>
            {loading ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading vendors...</p>
            ) : filteredVendors.length > 0 ? (
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
                    {filteredVendors.map((v, index) => (
                      <tr key={v._id || index}>
                        <td>{index + 1}</td>
                        <td><strong>{v.name}</strong></td>
                        <td>{v.address || '-'}</td>
                        <td>{v.phone || '-'}</td>
                        <td>{v.pan || '-'}</td>
                        <td>
                          {v.contact1 && <div>1. {v.contact1}</div>}
                          {v.contact2 && <div>2. {v.contact2}</div>}
                          {!v.contact1 && !v.contact2 && '-'}
                        </td>
                        <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => selectVendor(v)}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(v._id)}
                            className="btn"
                            style={{ backgroundColor: '#dc3545', color: 'white', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                            title="Delete Vendor"
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
              <p style={{ color: 'var(--text-muted)' }}>No vendors found matching search term.</p>
            )}
          </div>
        </>
      )}

      {/* Add Vendor Form */}
      {!vendor && showAddForm && (
        <div className="card mb-6">
          <h2 className="card-header" style={{ fontSize: '1.1rem', marginBottom: '1rem', textTransform: 'none' }}>Add New Vendor</h2>
          <form onSubmit={handleAddVendor}>
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
                <input type="text" name="phone" value={formData.phone} onChange={handleFormChange} className="form-input" />
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
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem', padding: '0.6rem 1.8rem' }}>Save Vendor</button>
          </form>
        </div>
      )}

      {/* Selected Vendor Edit View */}
      {vendor && (
        <div>
          {/* Vendor Editable Details Card */}
          <div className="card mb-6">
            <h2 className="card-header" style={{ fontSize: '1.1rem', marginBottom: '1.2rem', textTransform: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
              <Building2 size={18} /> Edit Vendor Information
            </h2>
            <div className="form-grid">
              <div>
                <label className="form-label">Vendor Name (Read-Only)</label>
                <input 
                  type="text" 
                  name="name" 
                  value={vendorForm.name} 
                  readOnly 
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }} 
                />
              </div>
              <div>
                <label className="form-label">Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={vendorForm.address} 
                  onChange={handleVendorFormChange} 
                />
              </div>
              <div>
                <label className="form-label">Phone No</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={vendorForm.phone} 
                  onChange={handleVendorFormChange} 
                />
              </div>
              <div>
                <label className="form-label">PAN/VAT</label>
                <input 
                  type="text" 
                  name="pan" 
                  value={vendorForm.pan} 
                  onChange={handleVendorFormChange} 
                />
              </div>
              <div>
                <label className="form-label">Contact Person 1</label>
                <input 
                  type="text" 
                  name="contact1" 
                  value={vendorForm.contact1} 
                  onChange={handleVendorFormChange} 
                />
              </div>
              <div>
                <label className="form-label">Contact Person 2</label>
                <input 
                  type="text" 
                  name="contact2" 
                  value={vendorForm.contact2} 
                  onChange={handleVendorFormChange} 
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

          {/* Purchases Details (Read Only) */}
          <h2 className="card-header mt-6" style={{ fontSize: '1.1rem', marginBottom: '1rem', textTransform: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> Purchases History
          </h2>
          <div className="table-container mb-6">
            <table>
              <thead>
                <tr>
                  <th>SN</th>
                  <th>Date</th>
                  <th>Particulars</th>
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
                {vendorPurchases.length > 0 ? vendorPurchases.map((p, index) => (
                  <tr key={p.sn || index}>
                    <td>{p.sn}</td>
                    <td>{p.date}</td>
                    <td>{p.particular}</td>
                    <td>{p.discount}</td>
                    <td>{p.vatRate}</td>
                    <td>{p.taxable}</td>
                    <td>{p.vat}</td>
                    <td>{p.total}</td>
                    <td>{p.paid}</td>
                    <td>{p.credit}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No purchase records found for this vendor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Save All Changes Action Bar */}
          <div className="card flex-between" style={{ padding: '1rem 1.5rem', borderColor: 'var(--primary-color)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Make sure to save after adding details or modifying vendor fields.</span>
            <button onClick={handleSaveVendorChanges} className="btn btn-primary" style={{ padding: '0.6rem 1.8rem' }}>
              <Save size={16} /> Save All Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;
