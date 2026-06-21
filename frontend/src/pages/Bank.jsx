import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Eye, Landmark, 
  ArrowUpRight, ArrowDownRight, CircleDollarSign, CheckSquare, X, Printer 
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const Bank = () => {
  const [records, setRecords] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  
  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  // Unified Form State
  const [formData, setFormData] = useState({
    type: 'Withdraw',
    cheque: '',
    acNo: '',
    amount: '',
    date: '',
    bank: '',
    amountToBePaid: '',
    paid: '',
    purposes: '',
    balance: '',
    credit: ''
  });

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTx, setPaymentTx] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    date: '',
    amount: '',
    remarks: ''
  });

  const fetchBank = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bank`);
      const data = await res.json();
      const allRecords = Array.isArray(data) ? data : [];
      setRecords(allRecords);
    } catch (err) {
      console.error('Error fetching bank data:', err);
    }
  };

  useEffect(() => {
    fetchBank();
  }, []);

  // Separate and assign SN dynamically based on database ordering
  useEffect(() => {
    const deps = records
      .filter(r => r.type === 'Deposit')
      .map((r, i) => ({ ...r, sn: i + 1 }));

    const withs = records
      .filter(r => r.type === 'Withdraw')
      .map((r, i) => ({ ...r, sn: i + 1 }));

    setDeposits(deps);
    setWithdrawals(withs);
  }, [records]);

  // Handle Input Changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };
    
    // Auto calculate for Withdraw type
    if (formData.type === 'Withdraw' && (name === 'amountToBePaid' || name === 'paid')) {
      const toPay = parseFloat(name === 'amountToBePaid' ? value : formData.amountToBePaid) || 0;
      const paidAmt = parseFloat(name === 'paid' ? value : formData.paid) || 0;
      const creditAmt = toPay - paidAmt;
      updated.balance = creditAmt.toString();
      updated.credit = creditAmt.toString();
    }
    
    setFormData(updated);
  };

  // Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.type === 'Deposit') {
      if (!formData.bank || !formData.acNo || !formData.amount || !formData.date) {
        alert('Bank name, Account Number, Amount, and Date are required for Deposit.');
        return;
      }
    } else {
      if (!formData.bank || !formData.paid || !formData.date) {
        alert('Bank name, Paid Amount, and Date are required for Withdrawal.');
        return;
      }
    }

    try {
      const isEdit = !!editId;
      let payload = {};
      
      if (formData.type === 'Deposit') {
        payload = {
          type: 'Deposit',
          cheque: formData.cheque,
          acNo: formData.acNo,
          amount: Number(formData.amount) || 0,
          date: formData.date,
          bank: formData.bank
        };
        
        if (!isEdit) {
          const nextSN = deposits.length > 0 ? Math.max(...deposits.map(d => d.sn || 0)) + 1 : 1;
          payload.sn = nextSN;
        }
      } else {
        const amountToBePaid = parseFloat(formData.amountToBePaid) || 0;
        const paid = parseFloat(formData.paid) || 0;
        const credit = amountToBePaid - paid;
        
        payload = {
          type: 'Withdraw',
          bank: formData.bank,
          cheque: formData.cheque,
          amountToBePaid: amountToBePaid,
          paid: paid,
          date: formData.date,
          purposes: formData.purposes,
          balance: credit,
          credit: credit,
          paymentHistory: []
        };
        
        if (!isEdit) {
          const nextSN = withdrawals.length > 0 ? Math.max(...withdrawals.map(w => w.sn || 0)) + 1 : 1;
          payload.sn = nextSN;
        }
      }

      const url = isEdit ? `${API_BASE}/api/bank/${editId}` : `${API_BASE}/api/bank`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchBank();
        setFormData({
          type: 'Withdraw',
          cheque: '',
          acNo: '',
          amount: '',
          date: '',
          bank: '',
          amountToBePaid: '',
          paid: '',
          purposes: '',
          balance: '',
          credit: ''
        });
        setShowForm(false);
        setEditId(null);
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
    }
  };

  // Edit Handler
  const handleEdit = (item) => {
    setEditId(item._id);
    
    if (item.type === 'Deposit') {
      setFormData({
        type: 'Deposit',
        cheque: item.cheque || '',
        acNo: item.acNo || '',
        amount: item.amount || '',
        date: item.date || '',
        bank: item.bank || '',
        amountToBePaid: '',
        paid: '',
        purposes: '',
        balance: '',
        credit: ''
      });
    } else {
      setFormData({
        type: 'Withdraw',
        cheque: item.cheque || '',
        acNo: '',
        amount: '',
        date: item.date || '',
        bank: item.bank || '',
        amountToBePaid: item.amountToBePaid || '',
        paid: item.paid || '',
        purposes: item.purposes || '',
        balance: item.balance || '',
        credit: item.credit || ''
      });
    }
    
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank transaction?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/bank/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchBank();
      }
    } catch (err) {
      console.error('Error deleting bank transaction:', err);
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setFormData({
      type: 'Withdraw',
      cheque: '',
      acNo: '',
      amount: '',
      date: '',
      bank: '',
      amountToBePaid: '',
      paid: '',
      purposes: '',
      balance: '',
      credit: ''
    });
    setShowForm(false);
  };

  // Payment Modal Handlers
  const openPaymentModal = (tx) => {
    setPaymentTx(tx);
    setShowPaymentModal(true);
    setPaymentForm({ date: '', amount: '', remarks: '' });
  };

  const handlePaymentFormChange = (e) => {
    setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
  };

  const handleAddPayment = async () => {
    if (!paymentForm.date || !paymentForm.amount || paymentForm.amount <= 0) {
      alert('Date and Amount are required for payment.');
      return;
    }

    const paymentAmount = parseFloat(paymentForm.amount) || 0;
    const currentCredit = parseFloat(paymentTx.credit || paymentTx.balance) || 0;

    if (paymentAmount > currentCredit) {
      alert(`Payment amount cannot exceed remaining balance of Rs. ${currentCredit.toLocaleString()}`);
      return;
    }

    try {
      const newPaymentHistory = [
        ...(paymentTx.paymentHistory || []),
        {
          date: paymentForm.date,
          amount: paymentAmount,
          remarks: paymentForm.remarks
        }
      ];

      const newPaidTotal = (parseFloat(paymentTx.paid) || 0) + paymentAmount;
      const newCredit = (parseFloat(paymentTx.amountToBePaid) || 0) - newPaidTotal;

      const payload = {
        ...paymentTx,
        paid: newPaidTotal,
        credit: newCredit,
        balance: newCredit,
        paymentHistory: newPaymentHistory
      };

      const res = await fetch(`${API_BASE}/api/bank/${paymentTx._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Payment added successfully!');
        await fetchBank();
        setShowPaymentModal(false);
        setPaymentTx(null);
      }
    } catch (err) {
      console.error('Error adding payment:', err);
      alert('Failed to add payment.');
    }
  };

  // Calculation of KPIs
  const totalDepositsVal = records
    .filter(r => r.type === 'Deposit')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const totalWithdrawalsVal = records
    .filter(r => r.type === 'Withdraw')
    .reduce((sum, r) => sum + (Number(r.paid) || 0), 0);

  const netBalanceVal = totalDepositsVal - totalWithdrawalsVal;

  const totalOutstandingVal = records
    .filter(r => r.type === 'Withdraw')
    .reduce((sum, r) => sum + ((Number(r.amountToBePaid) || 0) - (Number(r.paid) || 0)), 0);

  // Search filter matching
  const filterRecords = (list) => {
    return list.filter(r => {
      const q = searchTerm.toLowerCase();
      return (
        (r.bank && r.bank.toLowerCase().includes(q)) ||
        (r.cheque && r.cheque.toLowerCase().includes(q)) ||
        (r.purposes && r.purposes.toLowerCase().includes(q)) ||
        (r.acNo && r.acNo.toLowerCase().includes(q)) ||
        (r.date && r.date.toLowerCase().includes(q))
      );
    });
  };

  const filteredDeposits = filterRecords(deposits);
  const filteredWithdrawals = filterRecords(withdrawals);

  // Modal styles
  const modalBackdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '1rem',
    backdropFilter: 'blur(6px)'
  };

  const modalCardStyle = {
    backgroundColor: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    width: '100%',
    maxWidth: '480px',
    padding: '2rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
  };

  const slipItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.625rem 0',
    borderBottom: '1px dashed var(--border-color)'
  };

  const slipLabelStyle = {
    fontSize: '0.875rem',
    color: 'var(--text-muted)'
  };

  const slipValueStyle = {
    fontWeight: '600',
    textAlign: 'right',
    color: 'var(--text-color)'
  };

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 className="page-title" style={{marginBottom: 0}}>8. Bank details</h1>
        <button className="btn" style={{backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'}} onClick={() => window.print()}>
          <Printer size={18} /> Print
        </button>
      </div>
      
      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Card 1 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '10px', color: 'var(--success)' }}>
            <ArrowUpRight size={24} />
          </div>
          <div>
            <div className="card-header" style={{ margin: 0, fontSize: '0.75rem' }}>Total Deposits</div>
            <div className="card-value" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>Rs. {totalDepositsVal.toLocaleString()}</div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '10px', color: 'var(--danger)' }}>
            <ArrowDownRight size={24} />
          </div>
          <div>
            <div className="card-header" style={{ margin: 0, fontSize: '0.75rem' }}>Total Withdrawals</div>
            <div className="card-value" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>Rs. {totalWithdrawalsVal.toLocaleString()}</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary-color)' }}>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '10px', color: 'var(--primary-color)' }}>
            <CircleDollarSign size={24} />
          </div>
          <div>
            <div className="card-header" style={{ margin: 0, fontSize: '0.75rem' }}>Net Bank Balance</div>
            <div className="card-value" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>Rs. {netBalanceVal.toLocaleString()}</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '10px', color: 'var(--warning)' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <div className="card-header" style={{ margin: 0, fontSize: '0.75rem' }}>Outstanding</div>
            <div className="card-value" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>Rs. {totalOutstandingVal.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 1.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search transactions by bank, cheque, purposes, a/c number..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem', width: '100%' }}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      
      {/* -------------------- UNIFIED FORM SECTION -------------------- */}
      <div className="flex-between mb-4">
        <h2 className="card-header" style={{fontSize: '1.1rem', margin: 0, textTransform: 'none'}}>Bank Transactions</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            if (editId) {
              cancelEdit();
            } else {
              setShowForm(!showForm);
            }
          }}
        >
          {showForm ? 'Cancel' : (editId ? 'Cancel Edit' : 'Add Transaction')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleFormSubmit} className="card mb-6 border-primary">
          <h3 className="card-header" style={{fontSize: '1rem', marginBottom: '1rem', textTransform: 'none', color: 'var(--primary-color)'}}>
            {editId ? 'Edit Transaction' : 'New Bank Transaction'}
          </h3>
          <div className="form-grid mb-4">
            <div>
              <label className="form-label">Transaction Type</label>
              <select name="type" value={formData.type} onChange={handleFormChange} required disabled={!!editId}>
                <option value="Deposit">Deposit</option>
                <option value="Withdraw">Withdraw</option>
              </select>
            </div>
            <div>
              <label className="form-label">Bank Name</label>
              <input type="text" name="bank" value={formData.bank} onChange={handleFormChange} required placeholder="Bank name" />
            </div>
            <div>
              <label className="form-label">Cheque Name</label>
              <input type="text" name="cheque" value={formData.cheque} onChange={handleFormChange} required placeholder="Cheque payee/drawer name" />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleFormChange} required />
            </div>
            
            {formData.type === 'Deposit' ? (
              <>
                <div>
                  <label className="form-label">A/C No</label>
                  <input type="text" name="acNo" value={formData.acNo} onChange={handleFormChange} required placeholder="Account number" />
                </div>
                <div>
                  <label className="form-label">Amount</label>
                  <input type="number" name="amount" value={formData.amount} onChange={handleFormChange} required placeholder="Deposit amount in Rs." />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="form-label">Amount To Be Paid</label>
                  <input type="number" name="amountToBePaid" value={formData.amountToBePaid} onChange={handleFormChange} required placeholder="Total check value" />
                </div>
                <div>
                  <label className="form-label">Paid Amount</label>
                  <input type="number" name="paid" value={formData.paid} onChange={handleFormChange} required placeholder="Amount already paid/cleared" />
                </div>
                <div>
                  <label className="form-label">Credit Amt (Auto)</label>
                  <input type="number" name="credit" value={formData.credit} readOnly style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }} />
                </div>
                <div>
                  <label className="form-label">Purposes</label>
                  <input type="text" name="purposes" value={formData.purposes} onChange={handleFormChange} required placeholder="Purpose of withdrawal" />
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              {editId ? 'Update Transaction' : 'Save Transaction'}
            </button>
            {editId && (
              <button type="button" className="btn btn-outline" onClick={cancelEdit}>Cancel</button>
            )}
          </div>
        </form>
      )}

      {/* -------------------- DEPOSIT TABLE -------------------- */}
      <h2 className="card-header mb-4 mt-6" style={{fontSize: '1.1rem', textTransform: 'none'}}>Deposited Amount</h2>

      <div className="table-container mb-6">
        <table>
          <thead>
            <tr>
              <th>SN</th>
              <th>Cheque Name</th>
              <th>A/C No</th>
              <th>Amount (Rs.)</th>
              <th>Date</th>
              <th>Bank Name</th>
              <th>Actions</th>
              <th>Action Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeposits.length > 0 ? (
              filteredDeposits.map((d) => (
                <tr key={d._id}>
                  <td>{d.sn}</td>
                  <td>{d.cheque}</td>
                  <td>{d.acNo}</td>
                  <td>{d.amount?.toLocaleString()}</td>
                  <td>{d.date}</td>
                  <td>{d.bank}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', color: 'var(--primary-color)' }}
                        onClick={() => handleEdit(d)}
                        title="Edit Deposit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', color: 'var(--danger)' }}
                        onClick={() => handleDelete(d._id)}
                        title="Delete Deposit"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn btn-outline text-primary" 
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => setSelectedTx(d)}
                    >
                      <Eye size={12} style={{ marginRight: '4px' }} />
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                  No deposits found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------- WITHDRAWAL TABLE -------------------- */}
      <h1 className="page-title mt-6" style={{margin: 0, marginBottom: '1rem'}}>9. Withdrawn Amount</h1>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SN</th>
              <th>Bank Name</th>
              <th>Cheque Name</th>
              <th>Amount To Be Paid</th>
              <th>Paid Amount</th>
              <th>Date</th>
              <th>Purposes</th>
              <th>Credit Amt</th>
              <th>Actions</th>
              <th>Action Details</th>
              <th>Add Payment</th>
            </tr>
          </thead>
          <tbody>
            {filteredWithdrawals.length > 0 ? (
              filteredWithdrawals.map((w) => (
                <tr key={w._id}>
                  <td>{w.sn}</td>
                  <td>{w.bank}</td>
                  <td>{w.cheque}</td>
                  <td>{w.amountToBePaid?.toLocaleString()}</td>
                  <td>{w.paid?.toLocaleString()}</td>
                  <td>{w.date}</td>
                  <td>{w.purposes}</td>
                  <td style={{ color: (w.credit || w.balance) > 0 ? 'var(--warning)' : 'var(--text-color)' }}>
                    {(w.credit || w.balance)?.toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', color: 'var(--primary-color)' }}
                        onClick={() => handleEdit(w)}
                        title="Edit Withdrawal"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', color: 'var(--danger)' }}
                        onClick={() => handleDelete(w._id)}
                        title="Delete Withdrawal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn btn-outline text-primary" 
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => setSelectedTx(w)}
                    >
                      <Eye size={12} style={{ marginRight: '4px' }} />
                      View Details
                    </button>
                  </td>
                  <td>
                    {(parseFloat(w.credit) > 0 || parseFloat(w.balance) > 0) ? (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'var(--success)' }}
                        onClick={() => openPaymentModal(w)}
                      >
                        <Plus size={12} style={{ marginRight: '4px' }} />
                        Add Payment
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cleared</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                  No withdrawals found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------- DETAILS MODAL - ALL DATA IN TABLE -------------------- */}
      {selectedTx && (
        <div style={modalBackdropStyle} onClick={() => setSelectedTx(null)}>
          <div style={{...modalCardStyle, maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto'}} onClick={(e) => e.stopPropagation()}>
            <div className="flex-between mb-4 pb-3" style={{ borderBottom: '2px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, marginBottom: '0.5rem' }}>
                  <div style={{ 
                    backgroundColor: selectedTx.type === 'Deposit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    padding: '0.5rem',
                    borderRadius: '10px',
                    display: 'inline-flex'
                  }}>
                    <Landmark size={22} style={{ color: selectedTx.type === 'Deposit' ? 'var(--success)' : 'var(--danger)' }} />
                  </div>
                  Transaction Details
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Complete transaction information and payment history</p>
              </div>
              <button onClick={() => setSelectedTx(null)} style={{ color: 'var(--text-muted)', display: 'inline-flex', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                <X size={22} />
              </button>
            </div>
            
            {/* Transaction Type Badge */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ 
                color: selectedTx.type === 'Deposit' ? 'var(--success)' : 'var(--danger)',
                backgroundColor: selectedTx.type === 'Deposit' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '700',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                border: `2px solid ${selectedTx.type === 'Deposit' ? 'var(--success)' : 'var(--danger)'}`
              }}>
                {selectedTx.type === 'Deposit' ? '📥 DEPOSIT' : '📤 WITHDRAWAL'}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Transaction #{selectedTx.sn}</span>
            </div>
            
            {/* ALL Transaction Data in Enhanced Table */}
            <div className="table-container" style={{ marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)', borderRadius: '12px', overflow: 'hidden' }}>
              <table>
                <thead style={{ background: 'linear-gradient(135deg, var(--surface-elevated), var(--surface-hover))' }}>
                  <tr>
                    <th style={{ width: '35%', fontSize: '0.8rem', padding: '1rem 1.5rem' }}>FIELD</th>
                    <th style={{ fontSize: '0.8rem', padding: '1rem 1.5rem' }}>VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>🏦 Bank Name</td>
                    <td style={{ fontWeight: '600' }}>{selectedTx.bank || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>📝 Cheque / Account Name</td>
                    <td style={{ fontWeight: '600' }}>{selectedTx.cheque || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>📅 Transaction Date</td>
                    <td style={{ fontWeight: '600' }}>{selectedTx.date || '-'}</td>
                  </tr>
                  
                  {selectedTx.type === 'Deposit' ? (
                    <>
                      <tr>
                        <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>🔢 Account Number</td>
                        <td style={{ fontWeight: '600' }}>{selectedTx.acNo || '-'}</td>
                      </tr>
                      <tr style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
                        <td style={{ fontWeight: '700', color: 'var(--success)' }}>💰 Amount Deposited</td>
                        <td style={{ color: 'var(--success)', fontWeight: '800', fontSize: '1.4rem', padding: '1.5rem' }}>
                          Rs. {selectedTx.amount?.toLocaleString() || '0'}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>📋 Purpose</td>
                        <td style={{ fontWeight: '600' }}>{selectedTx.purposes || '-'}</td>
                      </tr>
                      <tr style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                        <td style={{ fontWeight: '700', color: 'var(--primary-color)' }}>💵 Amount To Be Paid (Total)</td>
                        <td style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--primary-color)' }}>
                          Rs. {selectedTx.amountToBePaid?.toLocaleString() || '0'}
                        </td>
                      </tr>
                      <tr style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
                        <td style={{ fontWeight: '700', color: 'var(--success)' }}>✅ Paid Amount</td>
                        <td style={{ color: 'var(--success)', fontWeight: '700', fontSize: '1.2rem' }}>
                          Rs. {selectedTx.paid?.toLocaleString() || '0'}
                        </td>
                      </tr>
                      <tr style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', borderLeft: '4px solid var(--warning)' }}>
                        <td style={{ fontWeight: '800', color: 'var(--warning)', fontSize: '1rem' }}>⏳ Credit Amt (Remaining)</td>
                        <td style={{ 
                          color: (selectedTx.credit || selectedTx.balance) > 0 ? 'var(--warning)' : 'var(--success)', 
                          fontWeight: '900', 
                          fontSize: '1.5rem',
                          padding: '1.5rem'
                        }}>
                          Rs. {(selectedTx.credit || selectedTx.balance)?.toLocaleString() || '0'}
                        </td>
                      </tr>
                    </>
                  )}
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>🕐 Created At</td>
                    <td style={{ fontSize: '0.85rem' }}>{selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString() : '-'}</td>
                  </tr>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>🔄 Last Updated</td>
                    <td style={{ fontSize: '0.85rem' }}>{selectedTx.updatedAt ? new Date(selectedTx.updatedAt).toLocaleString() : '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment History Table */}
            {selectedTx.type === 'Withdraw' && selectedTx.paymentHistory && selectedTx.paymentHistory.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '10px',
                  borderLeft: '4px solid var(--primary-color)'
                }}>
                  <div style={{ fontSize: '1.5rem' }}>📊</div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: 'var(--text-color)' }}>Payment History</h4>
                    <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>All payments made towards this withdrawal</p>
                  </div>
                </div>
                <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto', boxShadow: 'var(--shadow-md)', borderRadius: '12px' }}>
                  <table>
                    <thead style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))', position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ color: 'white' }}>Payment #</th>
                        <th style={{ color: 'white' }}>Payment Date</th>
                        <th style={{ color: 'white' }}>Amount Paid (Rs.)</th>
                        <th style={{ color: 'white' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTx.paymentHistory.map((p, idx) => (
                        <tr key={idx} style={{ transition: 'all 0.2s' }}>
                          <td>
                            <span style={{ 
                              backgroundColor: 'var(--primary-light)', 
                              padding: '0.25rem 0.75rem', 
                              borderRadius: '20px',
                              fontWeight: '700',
                              fontSize: '0.85rem'
                            }}>
                              #{idx + 1}
                            </span>
                          </td>
                          <td style={{ fontWeight: '600' }}>{p.date || '-'}</td>
                          <td style={{ fontWeight: '800', color: 'var(--success)', fontSize: '1.05rem' }}>
                            Rs. {p.amount?.toLocaleString() || '0'}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontStyle: p.remarks ? 'normal' : 'italic' }}>{p.remarks || 'No remarks'}</td>
                        </tr>
                      ))}
                      <tr style={{ 
                        backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                        fontWeight: 'bold',
                        borderTop: '3px solid var(--success)'
                      }}>
                        <td colSpan="2" style={{ textAlign: 'right', fontSize: '1rem', padding: '1rem' }}>💵 Total Paid via History:</td>
                        <td style={{ color: 'var(--success)', fontSize: '1.3rem', fontWeight: '900' }}>
                          Rs. {selectedTx.paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedTx.type === 'Withdraw' && (!selectedTx.paymentHistory || selectedTx.paymentHistory.length === 0) && (
              <div style={{ 
                padding: '1.5rem', 
                backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                borderRadius: '12px', 
                marginTop: '1.5rem', 
                textAlign: 'center',
                border: '2px dashed var(--warning)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💳</div>
                <span style={{ color: 'var(--warning)', fontSize: '1rem', fontWeight: '600' }}>No payment history yet</span>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Use the "Add Payment" button to record payments</p>
              </div>
            )}

            <div className="flex-between" style={{ gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid var(--border-color)' }}>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem', fontWeight: '600' }} 
                onClick={() => window.print()}
              >
                🖨️ Print Details
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem', fontWeight: '600' }} 
                onClick={() => setSelectedTx(null)}
              >
                ✓ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- PAYMENT MODAL -------------------- */}
      {showPaymentModal && paymentTx && (
        <div style={modalBackdropStyle} onClick={() => setShowPaymentModal(false)}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <div className="flex-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>
                Add Payment - {paymentTx.bank}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Remaining Balance:</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                Rs. {(paymentTx.credit || paymentTx.balance)?.toLocaleString()}
              </div>
            </div>

            {paymentTx.paymentHistory && paymentTx.paymentHistory.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Payment History:</h4>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem' }}>
                  {paymentTx.paymentHistory.map((p, idx) => (
                    <div key={idx} style={{ padding: '0.5rem', borderBottom: idx < paymentTx.paymentHistory.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>{p.date}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>Rs. {p.amount?.toLocaleString()}</span>
                      </div>
                      {p.remarks && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{p.remarks}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Payment Date</label>
                <input type="date" name="date" value={paymentForm.date} onChange={handlePaymentFormChange} required />
              </div>
              <div>
                <label className="form-label">Payment Amount</label>
                <input type="number" name="amount" value={paymentForm.amount} onChange={handlePaymentFormChange} required placeholder="Enter payment amount" />
              </div>
              <div>
                <label className="form-label">Remarks (Optional)</label>
                <input type="text" name="remarks" value={paymentForm.remarks} onChange={handlePaymentFormChange} placeholder="Payment notes" />
              </div>
            </div>

            <div className="mt-6 flex-between" style={{ gap: '1rem' }}>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, padding: '0.5rem' }} 
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '0.5rem', backgroundColor: 'var(--success)' }} 
                onClick={handleAddPayment}
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bank;
