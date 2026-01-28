'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useVavity } from '../../context/VavityAggregator';

const VavityTester: React.FC = () => {
  const { email, vapa, assetPrice, fetchVavityAggregator, addVavityAggregator } = useVavity();
  const [vavityData, setVavityData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showAddMoreForm, setShowAddMoreForm] = useState<boolean>(false);
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>('');

  useEffect(() => {
    if (!email || !fetchVavityAggregator) return;

    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchVavityAggregator(email);
        if (isMounted) {
          setVavityData(data);
        }
      } catch (error) {
        // Intentionally quiet to avoid UI noise
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [email, fetchVavityAggregator]);

  const investments = vavityData?.investments || [];
  const totals = vavityData?.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };

  const formatCurrency = useCallback((value: number) => {
    const abs = Math.abs(value);
    const decimals = abs > 1 ? 2 : abs > 0.01 ? 4 : 6;
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }, []);

  const formCpVatop = useMemo(() => vapa || assetPrice || 0, [vapa, assetPrice]);
  const formCVatop = useMemo(() => {
    const amt = parseFloat(tokenAmount || '0');
    if (isNaN(amt)) return 0;
    return amt * formCpVatop;
  }, [tokenAmount, formCpVatop]);

  const handleSubmitInvestment = async () => {
    if (!email) return;
    const amt = parseFloat(tokenAmount || '0');
    if (!amt || amt <= 0) return;
    if (!purchaseDate) return;

    const cVactTaa = parseFloat(amt.toFixed(8));
    const cpVatop = formCpVatop;
    const cVatop = parseFloat((cVactTaa * cpVatop).toFixed(2));
    const cpVact = cpVatop;
    const cVact = parseFloat((cVactTaa * cpVact).toFixed(2));
    const cdVatop = parseFloat((cVact - cVatop).toFixed(2));

    const newInvestment = {
      cVatop,
      cpVatop,
      cVactTaa,
      cpVact,
      cVact,
      cdVatop,
      date: purchaseDate,
    };

    setSubmitLoading(true);
    try {
      await addVavityAggregator(email, [newInvestment]);
      const refreshed = await fetchVavityAggregator(email);
      setVavityData(refreshed);
      setTokenAmount('');
      setPurchaseDate('');
      setShowAddForm(false);
      setShowAddMoreForm(false);
    } catch (err) {
      // Quiet failure per prior behavior
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderAddForm = (label: string) => (
    <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '12px', marginTop: '12px', maxWidth: '420px' }}>
      <div style={{ marginBottom: '8px', fontWeight: 600 }}>{label}</div>
      <div style={{ marginBottom: '8px' }}>
        Bitcoin Amount (cVactTaa):
        <input
          type="number"
          step="0.00000001"
          value={tokenAmount}
          onChange={(e) => setTokenAmount(e.target.value)}
          style={{ marginLeft: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '8px' }}>
        Date purchased (mm/dd/yy):
        <input
          type="text"
          placeholder="mm/dd/yy"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          style={{ marginLeft: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '12px' }}>
        $ Amount (cVatop): ${formatCurrency(formCVatop)}
      </div>
      <button onClick={handleSubmitInvestment} disabled={submitLoading || !tokenAmount || !purchaseDate}>
        {submitLoading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );

  return (
    <div style={{ padding: '24px', color: '#f5f5f5', background: '#111', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '12px' }}>Vavity Tester</h1>

      <div
        style={{
          display: 'grid',
          gap: '8px',
          marginBottom: '24px',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '12px',
          background: '#1a1a1a'
        }}
      >
        <div>
          Current Bitcoin Price:{' '}
          <strong>
            ${assetPrice
              ? assetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '0.00'}
          </strong>
        </div>
        <div>
          VAPA (Bitcoin):{' '}
          <strong>
            ${vapa ? vapa.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </strong>
        </div>
        <div>User Email: {email || 'Not available'}</div>
      </div>

      <div
        style={{
          marginBottom: '24px',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '12px',
          background: '#161616'
        }}
      >
        <h2 style={{ marginBottom: '12px' }}>My Portfolio</h2>
        {investments.length === 0 && (
          <>
            <div style={{ marginBottom: '12px' }}>(Add Investments)</div>
            {!showAddForm && (
              <button
                style={{ padding: '8px 12px', background: '#ff9800', color: '#000', border: 'none', borderRadius: '6px' }}
                onClick={() => setShowAddForm(true)}
              >
                Add Investments
              </button>
            )}
            {showAddForm && renderAddForm('Add Investment')}
          </>
        )}

        {investments.length > 0 && (
          <>
            <div style={{ marginBottom: '8px' }}>Investment: ${formatCurrency(totals.acVact || 0)}</div>
            <div style={{ marginBottom: '12px' }}>
              {totals.acdVatop > 0
                ? `Profits: ${formatCurrency(totals.acdVatop)} + $0`
                : 'Losses (default): $0'}
            </div>
            <button
              style={{ padding: '8px 12px', background: '#ff9800', color: '#000', border: 'none', borderRadius: '6px' }}
              onClick={() => setShowAddMoreForm((prev) => !prev)}
            >
              {showAddMoreForm ? 'Hide add more investments' : 'Add more investments'}
            </button>
            {showAddMoreForm && renderAddForm('Add more investments')}
          </>
        )}
      </div>

      <div
        style={{
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '12px',
          background: '#161616'
        }}
      >
        <h2 style={{ marginBottom: '12px' }}>Stored Investments</h2>
        {loading && <div>Loading...</div>}
        {!loading && investments.length === 0 && <div>No investments found.</div>}
        {!loading && investments.length > 0 && (
          <div style={{ display: 'grid', gap: '12px' }}>
            {investments.map((entry: any, idx: number) => {
              const amount = entry.cVactTaa ?? 0;
              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '12px',
                    background: '#1f1f1f'
                  }}
                >
                  <div>VAPA at Purchase (cpVatop): {entry.cpVatop ?? 0}</div>
                  <div>Value at Purchase (cVatop): {entry.cVatop ?? 0}</div>
                  <div>Current Price (cpVact): {entry.cpVact ?? 0}</div>
                  <div>Current Value (cVact): {entry.cVact ?? 0}</div>
                  <div>Delta (cdVatop): {entry.cdVatop ?? 0}</div>
                  <div>
                    Token Amount (cVactTaa):{' '}
                    {Number(amount).toLocaleString('en-US', {
                      minimumFractionDigits: 8,
                      maximumFractionDigits: 8
                    })}
                  </div>
                  {entry.date && <div>Date: {entry.date}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VavityTester;
