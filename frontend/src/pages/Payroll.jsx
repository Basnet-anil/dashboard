import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DollarSign, Calendar, TrendingUp, Users, Eye, EyeOff, Search, X, Printer } from 'lucide-react';

const Payroll = () => {
  const location = useLocation();
  const [payroll, setPayroll] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSN, setSelectedSN] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    basic: '',
    tax: '1', // Default to 1% tax
    deducted: '',
    trans: '',
    comms: '',
    bonus: '',
    received: '',
  });

  const fetchPayroll = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '';
      const res = await fetch(`${API_BASE}/api/payroll`);
      if (res.ok) {
        const data = await res.json();
        setPayroll(Array.isArray(data) ? data : []);
        if (location.state && location.state.viewOnly && location.state.searchName) {
          const found = data.find(d => d.name === location.state.searchName);
          if (found) setSelectedSN(found.sn);
        }
      } else {
        setPayroll([]);
      }
    } catch (err) {
      console.error('Failed to fetch payroll:', err);
      setPayroll([]);
    }
  };

  const fetchStaff = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '';
      const res = await fetch(`${API_BASE}/api/staff`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(Array.isArray(data) ? data : []);
      } else {
        setStaffList([]);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setStaffList([]);
    }
  };

  useEffect(() => {
    fetchPayroll();
    fetchStaff();
  }, []);

  useEffect(() => {
    if (location.state && location.state.searchName) {
      const staffName = location.state.searchName;
      setSearchTerm(staffName);
      setFormData(prev => computeFields({ ...prev, name: staffName }));
      // If viewOnly flag is set, do NOT open the process form
      if (!location.state.viewOnly) {
        setShowForm(true);
      } else {
        setShowForm(false);
      }
    }
  }, [location.state]);

  const computeFields = (updated) => {
    const basic = parseFloat(updated.basic) || 0;
    const tax = parseFloat(updated.tax) || 0;
    const trans = parseFloat(updated.trans) || 0;
    const comms = parseFloat(updated.comms) || 0;
    const bonus = parseFloat(updated.bonus) || 0;
    const deducted = basic * (tax / 100);
    const received = basic - deducted + trans + comms + bonus;
    return { ...updated, deducted: deducted.toFixed(2), received: received.toFixed(2) };
  };

  const handleChange = (e) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    setFormData(computeFields(updated));
  };

  const handleStaffSelect = (e) => {
    const updated = { ...formData, name: e.target.value };
    setFormData(computeFields(updated));
  };

  const handleProcess = async () => {
    if (!formData.name || formData.name.trim() === '' || formData.name === 'Select...' || !formData.basic || String(formData.basic).trim() === '') {
      alert('Staff selection and Basic Salary are required.');
      return;
    }
    const hasOnlySpaces = Object.values(formData).some(val => typeof val === 'string' && val.length > 0 && val.trim() === '');
    if (hasOnlySpaces) {
      alert('Fields cannot contain only blank spaces.');
      return;
    }
    try {
      const newSN = payroll.length > 0 ? Math.max(...payroll.map(p => p.sn)) + 1 : 1;
      const API_BASE = import.meta.env.VITE_API_BASE || '';
      const res = await fetch(`${API_BASE}/api/payroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sn: newSN, ...formData }),
      });
      if (res.ok) {
        setFormData({ name: '', date: '', basic: '', tax: '1', deducted: '', trans: '', comms: '', bonus: '', received: '' });
        setShowForm(false);
        fetchPayroll();
      }
    } catch (err) {
      console.error('Failed to process payroll:', err);
    }
  };

  const handleViewDetails = (e, p) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    console.log('View Details clicked for SN:', p.sn);
    try {
      // quick visible debug
      // eslint-disable-next-line no-alert
      alert('View Details clicked for SN: ' + p.sn);
    } catch (err) {
      // ignore
    }
    setSelectedSN(prev => prev === p.sn ? null : p.sn);
  };

  const filteredPayroll = payroll.filter(p => 
    p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header Section */}
      <div className="flex-between mb-6" style={{ 
        background: 'linear-gradient(135deg, var(--surface-color), var(--surface-elevated))',
        padding: '2rem',
        borderRadius: 'var(--border-radius)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
            padding: '1rem',
            borderRadius: 'var(--border-radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px var(--primary-light)'
          }}>
            <DollarSign size={32} color="white" />
          </div>
          <div>
            <h1 className="page-title" style={{marginBottom: '0.25rem'}}>Payroll Management</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Process and manage staff payroll efficiently</p>
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '0.875rem 2rem', fontSize: '1rem', marginRight: '0.5rem' }}
        >
          {showForm ? (
            <><X size={18} /> Cancel</>
          ) : (
            <><DollarSign size={18} /> Process Payroll</>
          )}
        </button>
        <button 
          className="btn" 
          style={{backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', fontSize: '1rem'}} 
          onClick={() => window.print()}
        >
          <Printer size={18} /> Print
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Total Records</div>
              <div style={{ color: 'white', fontSize: '2rem', fontWeight: 800 }}>{payroll.length}</div>
            </div>
            <Users size={40} color="rgba(255,255,255,0.3)" />
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--success), #059669)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Filtered Results</div>
              <div style={{ color: 'white', fontSize: '2rem', fontWeight: 800 }}>{filteredPayroll.length}</div>
            </div>
            <TrendingUp size={40} color="rgba(255,255,255,0.3)" />
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="card mb-6" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-dimmed)' 
            }} />
            <input
              type="text"
              placeholder="Search payroll by staff name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                paddingLeft: '3rem',
                width: '100%',
                fontSize: '1rem',
                background: 'var(--bg-color)',
                border: '2px solid var(--border-color)'
              }}
            />
          </div>
          {searchTerm && (
            <button 
              className="btn btn-outline" 
              onClick={() => setSearchTerm('')}
              style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <X size={16} /> Clear
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card mb-6" style={{ 
          borderColor: 'var(--primary-color)',
          background: 'var(--surface-elevated)',
          boxShadow: 'var(--shadow-xl)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid var(--border-color)'
          }}>
            <div style={{ 
              background: 'var(--primary-light)',
              padding: '0.75rem',
              borderRadius: 'var(--border-radius-sm)',
              display: 'flex'
            }}>
              <DollarSign size={24} color="var(--primary-color)" />
            </div>
            <div>
              <h2 style={{fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-color)'}}>Process Staff Payroll</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Enter staff details and calculate payroll automatically</p>
            </div>
          </div>
          <div className="form-grid mb-4">
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={14} color="var(--primary-color)" />
                Select Staff
              </label>
              <select name="name" value={formData.name} onChange={handleStaffSelect} style={{ cursor: 'pointer' }}>
                <option>Select...</option>
                {staffList.map((s, i) => (
                  <option key={i} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={14} color="var(--primary-color)" />
                Date (BS)
              </label>
              <input type="text" name="date" value={formData.date} onChange={handleChange} placeholder="YYYY/MM/DD" />
            </div>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={14} color="var(--success)" />
                Basic Salary
              </label>
              <input type="number" name="basic" value={formData.basic} onChange={handleChange} />
            </div>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={14} color="var(--warning)" />
                TAX 1%
              </label>
              <input type="number" name="tax" value={formData.tax} onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">Transportation Allowance</label>
              <input type="number" name="trans" value={formData.trans} onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">Communication Allowance</label>
              <input type="number" name="comms" value={formData.comms} onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">Bonus Amount</label>
              <input type="number" name="bonus" value={formData.bonus} onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">Deducted Amount (Auto)</label>
              <input type="number" name="deducted" value={formData.deducted} readOnly style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }} />
            </div>
            <div>
              <label className="form-label">Received Amount (Auto)</label>
              <input type="number" name="received" value={formData.received} readOnly style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }} />
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleProcess}
            style={{ 
              padding: '1rem 2.5rem', 
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <DollarSign size={20} /> Process & Save
          </button>
        </div>
      )}

      <div className="table-container" style={{ 
        boxShadow: 'var(--shadow-xl)',
        animation: 'fadeIn 0.4s ease-out'
      }}>
        <table>
          <thead>
            <tr>
              <th>SN</th>
              <th>Name of Staff</th>
              <th>Date</th>
              <th>Basic Salary</th>
              <th>TAX 1%</th>
              <th>Deducted Amount</th>
              <th>Transportation Allowance</th>
              <th>Communication Allowance</th>
              <th>Bonus Amount</th>
              <th>Received Amount</th>
              <th>Action Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayroll.length > 0 ? (
              filteredPayroll.map((p) => (
                <React.Fragment key={p.sn}>
                  <tr>
                    <td>{p.sn}</td>
                    <td>{p.name}</td>
                    <td>{p.date || '-'}</td>
                    <td>{p.basic}</td>
                    <td>{p.tax}</td>
                    <td>{p.deducted}</td>
                    <td>{p.trans}</td>
                    <td>{p.comms}</td>
                    <td>{p.bonus}</td>
                    <td>{p.received}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={(e) => handleViewDetails(e, p)}
                        style={{ 
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: selectedSN === p.sn ? 'var(--primary-color)' : 'transparent',
                          color: selectedSN === p.sn ? 'white' : 'var(--primary-color)',
                          borderColor: 'var(--primary-color)',
                          margin: '0 auto'
                        }}
                        aria-label={`View details for ${p.name}`}
                      >
                        {selectedSN === p.sn ? <><EyeOff size={16} /> Hide</> : <><Eye size={16} /> View</>}
                      </button>
                    </td>
                  </tr>
                  {selectedSN === p.sn && (
                    <tr style={{ animation: 'slideDown 0.3s ease-out' }}>
                      <td colSpan={11} style={{ 
                        background: 'linear-gradient(135deg, var(--surface-elevated), var(--surface-color))',
                        padding: '2rem',
                        borderLeft: '4px solid var(--primary-color)'
                      }}>
                        <div style={{ 
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '1.5rem'
                        }}>
                          <div style={{ 
                            background: 'var(--success-light)',
                            padding: '1rem',
                            borderRadius: 'var(--border-radius-sm)',
                            border: '1px solid var(--success)'
                          }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Paid Salary</div>
                            <div style={{ color: 'var(--success)', fontSize: '1.75rem', fontWeight: 800 }}>₹{p.received}</div>
                          </div>
                          <div style={{ background: 'var(--info-light)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--info)' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Basic</div>
                            <div style={{ color: 'var(--info)', fontSize: '1.5rem', fontWeight: 700 }}>₹{p.basic}</div>
                          </div>
                          <div style={{ background: 'var(--danger-light)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--danger)' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Deducted</div>
                            <div style={{ color: 'var(--danger)', fontSize: '1.5rem', fontWeight: 700 }}>₹{p.deducted}</div>
                          </div>
                          <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--primary-color)' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Transportation</div>
                            <div style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 700 }}>₹{p.trans}</div>
                          </div>
                          <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--primary-color)' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Communication</div>
                            <div style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 700 }}>₹{p.comms}</div>
                          </div>
                          <div style={{ background: 'var(--warning-light)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--warning)' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Bonus</div>
                            <div style={{ color: 'var(--warning)', fontSize: '1.5rem', fontWeight: 700 }}>₹{p.bonus}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                  No payroll records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payroll;
