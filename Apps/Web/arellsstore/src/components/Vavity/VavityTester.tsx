'use client';

import React, { useEffect, useState } from 'react';
import { useVavity } from '../../context/VavityAggregator';

const VavityTester: React.FC = () => {
  const { email, vapa, assetPrice, fetchVavityAggregator } = useVavity();
  const [vavityData, setVavityData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

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

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '8px' }}>Vavity Tester</h1>
      <div style={{ color: '#bbbbbb', marginBottom: '20px' }}>
        Connectivity is disabled. This page shows Bitcoin metrics only.
      </div>
      <div style={{ display: 'grid', gap: '8px', marginBottom: '24px' }}>
        <div>
          Current Bitcoin Price:{' '}
          ${assetPrice
            ? assetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0.00'}
        </div>
        <div>
          VAPA (Bitcoin):{' '}
          ${vapa ? vapa.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
        </div>
        <div>User Email: {email || 'Not available'}</div>
      </div>

      <div>
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
                    padding: '12px'
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
