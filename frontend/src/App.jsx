import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Briefcase, 
  Building2,
  UserCircle,
  Wallet,
  Landmark
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Purchases from './pages/Purchases';
import Vendors from './pages/Vendors';
import HR from './pages/HR';
import Payroll from './pages/Payroll';
import Bank from './pages/Bank';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            ERP System
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
            <NavLink to="/sales" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <ShoppingCart size={20} />
              Sales
            </NavLink>
            <NavLink to="/customers" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={20} />
              Customers
            </NavLink>
            <NavLink to="/purchases" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Briefcase size={20} />
              Purchases
            </NavLink>
            <NavLink to="/vendors" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Building2 size={20} />
              Vendors
            </NavLink>
            <NavLink to="/hr" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <UserCircle size={20} />
              Human Resources
            </NavLink>
            <NavLink to="/payroll" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Wallet size={20} />
              Payroll
            </NavLink>
            <NavLink to="/bank" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Landmark size={20} />
              Bank Details
            </NavLink>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/hr" element={<HR />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/bank" element={<Bank />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
