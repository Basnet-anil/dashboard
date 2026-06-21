import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer } from 'lucide-react';

const HR = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', designation: '' });

  const fetchStaff = async (name = '') => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '';
      const url = name
        ? `${API_BASE}/api/staff?name=${encodeURIComponent(name)}`
        : `${API_BASE}/api/staff`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStaff(Array.isArray(data) ? data : []);
      } else {
        setStaff([]);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setStaff([]);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.name || formData.name.trim() === '' || !formData.designation || formData.designation.trim() === '') {
      alert('Name of Staff and Designation are required.');
      return;
    }
    const hasOnlySpaces = Object.values(formData).some(val => typeof val === 'string' && val.length > 0 && val.trim() === '');
    if (hasOnlySpaces) {
      alert('Fields cannot contain only blank spaces.');
      return;
    }
    try {
      const newSN = staff.length > 0 ? Math.max(...staff.map(s => s.sn)) + 1 : 1;
      const API_BASE = import.meta.env.VITE_API_BASE || '';
      const res = await fetch(`${API_BASE}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sn: newSN, name: formData.name, designation: formData.designation }),
      });
      if (res.ok) {
        setFormData({ name: '', designation: '' });
        setShowForm(false);
        fetchStaff();
      }
    } catch (err) {
      console.error('Failed to save staff:', err);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchStaff(value);
  };

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 className="page-title" style={{marginBottom: 0}}>6. Human Resources</h1>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <button className="btn" style={{backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'}} onClick={() => window.print()}>
            <Printer size={18} /> Print
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Staff'}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={handleSearch}
          style={{ padding: '0.5rem 1rem', width: '100%', maxWidth: '400px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="card-header" style={{fontSize: '1.25rem', marginBottom: '1rem', textTransform: 'none'}}>Add New Staff</h2>
          <div className="form-grid mb-4">
            <div>
              <label className="form-label">Name of Staff</label>
              <input type="text" placeholder="Staff Name" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">Designation</label>
              <input type="text" placeholder="Designation" name="designation" value={formData.designation} onChange={handleChange} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSave}>Save Staff</button>
        </div>
      )}
      
      <div className="table-container mb-6">
        <table>
          <thead>
            <tr>
              <th>SN</th>
              <th>Name of Staff</th>
              <th>Designation</th>
              <th>Go to account</th>
              <th>Action Details</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.sn}>
                <td>{s.sn}</td>
                <td>{s.name}</td>
                <td>{s.designation}</td>
                <td><button className="btn btn-outline" onClick={() => navigate('/payroll', { state: { searchName: s.name } })}>Go</button></td>
                <td>
                  <button
                    className="btn btn-outline text-primary"
                    onClick={() => navigate('/payroll', { state: { searchName: s.name, viewOnly: true } })}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HR;
