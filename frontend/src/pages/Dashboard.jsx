import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [monthlyMetrics, setMonthlyMetrics] = useState(null);
  const [yearlyMetrics, setYearlyMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiBase = import.meta.env.VITE_API_BASE || '';
        // Fetch monthly metrics
        const monthlyRes = await Promise.all([
          fetch(`${apiBase}/api/sales/metrics/monthly`),
          fetch(`${apiBase}/api/purchases/metrics/monthly`)
        ]);

        const monthlyData = await Promise.all(monthlyRes.map(r => r.ok ? r.json() : Promise.resolve({})));

        // Fetch yearly metrics
        const yearlyRes = await Promise.all([
          fetch(`${apiBase}/api/sales/metrics/yearly`),
          fetch(`${apiBase}/api/purchases/metrics/yearly`)
        ]);

        const yearlyData = await Promise.all(yearlyRes.map(r => r.ok ? r.json() : Promise.resolve({})));

        setMonthlyMetrics({
          sales: monthlyData[0],
          purchases: monthlyData[1],
          netEarnings: (Number(monthlyData[0]?.totalReceived) || 0) - (Number(monthlyData[1]?.totalAmount) || 0)
        });

        setYearlyMetrics({
          sales: yearlyData[0],
          purchases: yearlyData[1],
          netEarnings: (Number(yearlyData[0]?.totalReceived) || 0) - (Number(yearlyData[1]?.totalAmount) || 0)
        });
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div>
      <h1 className="page-title">Dashboard Overview</h1>
      
      <div className="card mb-6">
        <h2 className="card-header" style={{fontSize: '1.25rem', color: 'var(--primary-color)', marginBottom: '1rem', textTransform: 'none'}}>Company Details</h2>
        <div className="form-grid">
          <div><span className="form-label">Name</span><strong>Readers Point Pvt. Ltd.</strong></div>
          <div><span className="form-label">Address</span><strong>Putalisadak, Kathmandu</strong></div>
          <div><span className="form-label">Contact No</span><strong>9841467180</strong></div>
          <div><span className="form-label">Email</span><strong>rokkayaman60@gmail.com</strong></div>
          <div><span className="form-label">VAT No</span><strong>123456789</strong></div>
          <div><span className="form-label">Fiscal Year</span><strong>2083/84</strong></div>
        </div>
      </div>

      {loading ? (
        <div className="card mb-6" style={{textAlign: 'center', padding: '2rem'}}>
          <p>Loading dashboard metrics...</p>
        </div>
      ) : error ? (
        <div className="card mb-6" style={{textAlign: 'center', padding: '2rem', color: 'red'}}>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Monthly Sales and Purchase Metrics */}
          <div className="card mb-6" style={{marginBottom: '1.5rem'}}>
            <h3 style={{fontSize: '1.1rem', color: 'var(--primary-color)', marginBottom: '1rem'}}>Monthly Metrics (Latest Period)</h3>
            <div className="form-grid mb-6">
              <div className="card">
                <div className="card-header">Sales Billed</div>
                <div className="card-value">
                  {monthlyMetrics?.sales?.totalBilled !== undefined 
                    ? formatCurrency(monthlyMetrics.sales.totalBilled)
                    : 'Rs 0'
                  }
                </div>
              </div>
              <div className="card">
                <div className="card-header">Sales Received</div>
                <div className="card-value text-success">
                  {monthlyMetrics?.sales?.totalReceived !== undefined 
                    ? formatCurrency(monthlyMetrics.sales.totalReceived)
                    : 'Rs 0'
                  }
                </div>
              </div>
              <div className="card">
                <div className="card-header">Sales Due</div>
                <div className="card-value text-danger">
                  {monthlyMetrics?.sales?.totalDue !== undefined 
                    ? formatCurrency(monthlyMetrics.sales.totalDue)
                    : 'Rs 0'
                  }
                </div>
              </div>
            </div>

            <div className="form-grid mb-6">
              <div className="card">
                <div className="card-header">Purchase Amount</div>
                <div className="card-value">
                  {monthlyMetrics?.purchases?.totalAmount !== undefined 
                    ? formatCurrency(monthlyMetrics.purchases.totalAmount)
                    : 'Rs 0'
                  }
                </div>
              </div>
              <div className="card">
                <div className="card-header">Net Earnings</div>
                <div className="card-value text-success">
                  {monthlyMetrics?.netEarnings !== undefined 
                    ? formatCurrency(monthlyMetrics.netEarnings)
                    : 'Rs 0'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Yearly Sales and Purchase Metrics */}
          <div className="card">
            <h3 style={{fontSize: '1.1rem', color: 'var(--primary-color)', marginBottom: '1rem'}}>Yearly Metrics (Latest Year)</h3>
            <div className="form-grid mb-6">
              <div className="card">
                <div className="card-header">Sales Billed</div>
                <div className="card-value">
                  {yearlyMetrics?.sales?.totalBilled !== undefined 
                    ? formatCurrency(yearlyMetrics.sales.totalBilled)
                    : 'Rs 0'
                  }
                </div>
              </div>
              <div className="card">
                <div className="card-header">Sales Received</div>
                <div className="card-value text-success">
                  {yearlyMetrics?.sales?.totalReceived !== undefined 
                    ? formatCurrency(yearlyMetrics.sales.totalReceived)
                    : 'Rs 0'
                  }
                </div>
              </div>
              <div className="card">
                <div className="card-header">Sales Due</div>
                <div className="card-value text-danger">
                  {yearlyMetrics?.sales?.totalDue !== undefined 
                    ? formatCurrency(yearlyMetrics.sales.totalDue)
                    : 'Rs 0'
                  }
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div className="card">
                <div className="card-header">Purchase Amount</div>
                <div className="card-value">
                  {yearlyMetrics?.purchases?.totalAmount !== undefined 
                    ? formatCurrency(yearlyMetrics.purchases.totalAmount)
                    : 'Rs 0'
                  }
                </div>
              </div>
              <div className="card">
                <div className="card-header">Net Earnings</div>
                <div className="card-value text-success">
                  {yearlyMetrics?.netEarnings !== undefined 
                    ? formatCurrency(yearlyMetrics.netEarnings)
                    : 'Rs 0'
                  }
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
