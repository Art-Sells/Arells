'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { useVavity } from '../../../../../context/VavityAggregator';
import EthereumChart from '../../../../Assets/Crypto/Ethereum/EthereumChart';

const VavityTesterEthereum: React.FC = () => {
  const { sessionId, fetchVavityAggregator, addVavityAggregator } = useVavity();
  const [vavityData, setVavityData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showAddMoreForm, setShowAddMoreForm] = useState<boolean>(false);
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [historicalPrice, setHistoricalPrice] = useState<number | null>(null);
  const [historicalLoading, setHistoricalLoading] = useState<boolean>(false);
  const [selectedRangeDays, setSelectedRangeDays] = useState<number | null>(null);
  const [rangeHistoricalPrice, setRangeHistoricalPrice] = useState<number | null>(null);
  const [rangeLoading, setRangeLoading] = useState<boolean>(false);
  const [mockEntries, setMockEntries] = useState<any[]>([]);
  const [mockStep, setMockStep] = useState<number>(0);

  const [assetPrice, setAssetPrice] = useState<number>(0);
  const [vapa, setVapa] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchPrices = async () => {
      try {
        const currentPriceResponse = await axios.get('/api/ethereumPrice');
        const currentPrice = currentPriceResponse.data?.ethereum?.usd;
        if (isMounted && typeof currentPrice === 'number') {
          setAssetPrice(currentPrice);
        }
        const vapaResponse = await axios.get('/api/ethereumVapa');
        const ethVapa = vapaResponse.data?.vapa;
        if (isMounted && typeof ethVapa === 'number') {
          setVapa(ethVapa);
        }
      } catch (err) {
        // surface for debugging VAPA population
        console.warn('[VavityTesterEthereum] Failed to fetch ETH price/VAPA', err);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Warm the ethereumVapa endpoint explicitly so the JSON populates on first load.
  useEffect(() => {
    let isMounted = true;
    const warmVapa = async () => {
      try {
        await axios.get('/api/ethereumVapa');
      } catch (err) {
        if (isMounted) {
          console.warn('[VavityTesterEthereum] Warm-up ethereumVapa failed', err);
        }
      }
    };
    warmVapa();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionId || !fetchVavityAggregator) return;
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchVavityAggregator(sessionId, 'ethereum');
        if (isMounted) {
          setVavityData(data);
        }
      } catch {
        // quiet
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
  }, [fetchVavityAggregator, sessionId]);

  const investments = useMemo(
    () => (vavityData?.investments || []).filter((entry: any) => (entry?.asset || 'bitcoin') === 'ethereum'),
    [vavityData]
  );
  const totals = useMemo(() => vavityData?.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 }, [vavityData]);

  const oldestInvestmentDate = useMemo(() => {
    if (investments.length === 0) return null;
    const dates = investments
      .map((entry: any) => entry?.date)
      .filter((value: any) => typeof value === 'string' && value.length > 0)
      .map((value: string) => new Date(value))
      .filter((date: Date) => !Number.isNaN(date.getTime()));
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates.map((date: Date) => date.getTime())));
  }, [investments]);

  const oldestInvestmentAgeDays = useMemo(() => {
    if (!oldestInvestmentDate) return 0;
    const diffMs = Date.now() - oldestInvestmentDate.getTime();
    return diffMs > 0 ? diffMs / (1000 * 60 * 60 * 24) : 0;
  }, [oldestInvestmentDate]);

  const portfolioRanges = useMemo(
    () => [
      { label: '24 hours', days: 1 },
      { label: '1 wk', days: 7 },
      { label: '1 mnth', days: 30 },
      { label: '3 mnths', days: 90 },
      { label: '1 yr', days: 365 },
      { label: 'All', days: null }
    ],
    []
  );

  useEffect(() => {
    let isMounted = true;
    const loadRangePrice = async () => {
      if (!selectedRangeDays) {
        if (isMounted) {
          setRangeHistoricalPrice(null);
          setRangeLoading(false);
        }
        return;
      }
      setRangeLoading(true);
      const targetDate = new Date(Date.now() - selectedRangeDays * 24 * 60 * 60 * 1000);
      const isoDate = targetDate.toISOString().split('T')[0];
      try {
        const response = await axios.get('/api/ethereumVapaHistoricalPrice', {
          params: { date: isoDate }
        });
        const price = response.data?.price;
        if (isMounted) {
          setRangeHistoricalPrice(typeof price === 'number' ? price : null);
        }
      } catch (error) {
        if (isMounted) {
          setRangeHistoricalPrice(null);
        }
      } finally {
        if (isMounted) {
          setRangeLoading(false);
        }
      }
    };
    loadRangePrice();
    return () => {
      isMounted = false;
    };
  }, [selectedRangeDays]);

  const filteredTotals = useMemo(() => {
    if (!selectedRangeDays) {
      return totals;
    }
    if (rangeHistoricalPrice == null) {
      return totals;
    }
    const rangeStart = Date.now() - selectedRangeDays * 24 * 60 * 60 * 1000;
    return investments.reduce(
      (acc: { acVatop: number; acdVatop: number; acVact: number; acVactTaa: number }, entry: any) => {
        const amount = Number(entry.cVactTaa) || 0;
        const currentValue = Number(entry.cVact) || amount * (vapa || 0);
        const purchaseTime = entry?.date ? new Date(entry.date).getTime() : null;
        const hasValidPurchaseTime = typeof purchaseTime === 'number' && !Number.isNaN(purchaseTime);
        const pastValue =
          hasValidPurchaseTime && purchaseTime > rangeStart
            ? Number(entry.cVatop) || amount * (entry.cpVatop || rangeHistoricalPrice)
            : amount * rangeHistoricalPrice;

        acc.acVatop += pastValue;
        acc.acVact += currentValue;
        acc.acdVatop += currentValue - pastValue;
        acc.acVactTaa += amount;
        return acc;
      },
      { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 }
    );
  }, [investments, rangeHistoricalPrice, selectedRangeDays, totals, vapa]);

  const formatCurrency = useCallback((value: number) => {
    const abs = Math.abs(value);
    const decimals = abs > 1 ? 2 : abs > 0.01 ? 4 : 6;
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }, []);

  const normalizeTokenInput = useCallback((value: string) => {
    const cleaned = value.replace(/,/g, '').replace(/[^\d.]/g, '');
    const hasDot = cleaned.includes('.');
    const [rawInt = '', rawDec = ''] = cleaned.split('.');
    const intPart = rawInt.replace(/^0+(?=\d)/, '');
    const decPart = rawDec.slice(0, 8);
    const formattedInt = intPart ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
    const prefix = formattedInt || (hasDot ? '0' : '');
    return hasDot ? `${prefix}.${decPart}` : prefix;
  }, []);

  const parseTokenAmount = useCallback((value: string) => {
    const cleaned = value.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadMock = async () => {
      try {
        const resp = await axios.get('/api/mockPortfolio');
        const portfolio = Array.isArray(resp.data?.portfolio) ? resp.data.portfolio : [];
        if (isMounted) {
          setMockEntries(portfolio);
        }
      } catch {
        // ignore errors for mock load
      }
    };
    loadMock();
    const interval = setInterval(() => {
      setMockStep((s) => s + 1);
    }, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const currentMockEntry = useMemo(() => {
    if (!mockEntries.length) return null;
    return mockEntries[mockStep % mockEntries.length];
  }, [mockEntries, mockStep]);

  useEffect(() => {
    let isMounted = true;
    const loadHistorical = async () => {
      if (!purchaseDate) {
        if (isMounted) {
          setHistoricalPrice(null);
          setHistoricalLoading(false);
        }
        return;
      }

      setHistoricalLoading(true);
      try {
        const response = await axios.get('/api/ethereumVapaHistoricalPrice', {
          params: { date: purchaseDate }
        });
        const price = response.data?.price;
        if (isMounted) {
          setHistoricalPrice(typeof price === 'number' ? price : null);
        }
      } catch (error) {
        if (isMounted) {
          setHistoricalPrice(null);
        }
      } finally {
        if (isMounted) {
          setHistoricalLoading(false);
        }
      }
    };

    loadHistorical();
    return () => {
      isMounted = false;
    };
  }, [purchaseDate]);

  const formCpVatop = useMemo(() => {
    if (!purchaseDate) {
      return vapa || 0;
    }
    return historicalPrice ?? assetPrice ?? 0;
  }, [purchaseDate, historicalPrice, assetPrice, vapa]);

  const formCVatop = useMemo(() => {
    const amt = parseTokenAmount(tokenAmount || '0');
    if (Number.isNaN(amt)) return 0;
    return amt * (vapa || 0);
  }, [tokenAmount, parseTokenAmount, vapa]);

  const handleSubmitInvestment = async () => {
    if (!sessionId) return;
    const amt = parseTokenAmount(tokenAmount || '0');
    if (!amt || amt <= 0) return;
    if (!purchaseDate) return;

    const cVactTaa = parseFloat(amt.toFixed(8));
    const newInvestment = {
      cVactTaa,
      date: purchaseDate,
    };

    setSubmitLoading(true);
    try {
      await addVavityAggregator(sessionId, [newInvestment], 'ethereum');
      const refreshed = await fetchVavityAggregator(sessionId, 'ethereum');
      setVavityData(refreshed);
      setTokenAmount('');
      setPurchaseDate('');
      setShowAddForm(false);
      setShowAddMoreForm(false);
    } catch {
      // Quiet failure per prior behavior
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderAddForm = (label: string) => (
    <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '12px', marginTop: '12px', maxWidth: '420px' }}>
      <div style={{ marginBottom: '8px', fontWeight: 600 }}>{label}</div>
      <div style={{ marginBottom: '12px' }}>
        Purchased Value:{' '}
        {tokenAmount && purchaseDate && historicalPrice != null
          ? `$${formatCurrency(parseTokenAmount(tokenAmount || '0') * historicalPrice)}`
          : '...'}
        {purchaseDate && historicalLoading && <span style={{ marginLeft: '8px' }}>(Loading price...)</span>}
      </div>
      <div style={{ marginBottom: '12px' }}>
        Current Value: {tokenAmount ? `$${formatCurrency(formCVatop)}` : '...'}
      </div>
      <div style={{ marginBottom: '12px' }}>
        {(() => {
          if (!tokenAmount) {
            return 'Profits/Losses: ...';
          }
          if (purchaseDate && historicalPrice == null) {
            return 'Profits/Losses: ...';
          }
          const basePrice = purchaseDate ? (historicalPrice ?? 0) : (vapa || 0);
          const profitValue = (vapa - basePrice) * parseTokenAmount(tokenAmount || '0');
          const label = profitValue > 0 ? 'Profits' : 'Losses';
          const formattedValue =
            profitValue > 0
              ? formatCurrency(profitValue)
              : Math.abs(profitValue).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
          const prefix = profitValue > 0 ? '+$' : '$';
          return `${label}: ${prefix}${formattedValue}`;
        })()}
      </div>
      <div style={{ marginBottom: '8px' }}>
        ethereum amount:
        <input
          type="text"
          inputMode="decimal"
          pattern="^[0-9]*\\.?[0-9]*$"
          value={tokenAmount}
          onChange={(e) => setTokenAmount(normalizeTokenInput(e.target.value))}
          style={{ marginLeft: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '8px' }}>
        Date purchased:
        <input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          style={{ marginLeft: '8px' }}
        />
      </div>
      <button
        onClick={handleSubmitInvestment}
        disabled={submitLoading || !tokenAmount || !purchaseDate}
        style={{
          padding: '8px 14px',
          background: '#7d5cff',
          color: '#000',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 600,
          opacity: submitLoading || !tokenAmount || !purchaseDate ? 0.6 : 1
        }}
      >
        {submitLoading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );

  return (
    <div style={{ padding: '24px', color: '#f5f5f5', background: '#111', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '12px' }}>Vavity Tester (Ethereum)</h1>
      
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
          Current Ethereum Price:{' '}
          <strong>
            ${assetPrice
              ? assetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '0.00'}
          </strong>
        </div>
        <div>
          VAPA (Ethereum):{' '}
          <strong>
            ${vapa ? vapa.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </strong>
        </div>
        <div>Session: {sessionId || 'Not available'}</div>
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            style={{
              padding: '8px 14px',
              background: '#7d5cff',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600
            }}
          >
            Add Investment
          </button>
          <button
            onClick={() => setShowAddMoreForm((prev) => !prev)}
            style={{
              padding: '8px 14px',
              background: '#4bb3fd',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600
            }}
          >
            Add More Investments
          </button>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            Oldest investment age: {oldestInvestmentAgeDays.toFixed(0)} days
          </div>
        </div>

        {showAddForm && renderAddForm('Add a single investment')}
        {showAddMoreForm && renderAddForm('Add more investments')}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <EthereumChart history={vavityData?.history || []} color="rgba(125, 92, 255, 0.9)" />
      </div>

      <div
        style={{
          display: 'grid',
          gap: '12px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          marginBottom: '24px'
        }}
      >
        <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '12px', background: '#1a1a1a' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>Totals (All)</div>
          <div>acVatop: ${filteredTotals.acVatop.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
          <div>acVact: ${filteredTotals.acVact.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
          <div>acdVatop: ${filteredTotals.acdVatop.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
          <div>acVactTaa: {filteredTotals.acVactTaa.toLocaleString('en-US', { maximumFractionDigits: 4 })} ETH</div>
        </div>

        <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '12px', background: '#1a1a1a' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>Range Filters</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {portfolioRanges.map((r) => (
              <button
                key={r.label}
                onClick={() => setSelectedRangeDays(r.days)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: selectedRangeDays === r.days ? '1px solid #7d5cff' : '1px solid #333',
                  background: selectedRangeDays === r.days ? '#251a48' : '#202020',
                  color: '#f5f5f5',
                  cursor: 'pointer'
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          {rangeLoading && <div style={{ marginTop: '8px' }}>Loading range price...</div>}
        </div>

        <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '12px', background: '#1a1a1a' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>Mock Portfolio</div>
          {currentMockEntry ? (
            <div>
              <div>{currentMockEntry.name}</div>
              <div>{currentMockEntry.value}</div>
            </div>
          ) : (
            <div>Loading mock portfolio...</div>
          )}
        </div>
      </div>

      <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '12px', background: '#161616' }}>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Investments (Ethereum)</div>
        {loading ? (
          <div>Loading...</div>
        ) : investments.length === 0 ? (
          <div>No investments yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px', borderBottom: '1px solid #333' }}>Date</th>
                <th style={{ textAlign: 'right', padding: '6px', borderBottom: '1px solid #333' }}>Amount</th>
                <th style={{ textAlign: 'right', padding: '6px', borderBottom: '1px solid #333' }}>cVatop</th>
                <th style={{ textAlign: 'right', padding: '6px', borderBottom: '1px solid #333' }}>cVact</th>
                <th style={{ textAlign: 'right', padding: '6px', borderBottom: '1px solid #333' }}>cdVatop</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((entry: any, idx: number) => (
                <tr key={`${entry.date}-${idx}`}>
                  <td style={{ padding: '6px', borderBottom: '1px solid #222' }}>
                    {entry.date ? new Date(entry.date).toLocaleDateString('en-US') : 'N/A'}
                  </td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #222', textAlign: 'right' }}>
                    {Number(entry.cVactTaa || 0).toLocaleString('en-US', { maximumFractionDigits: 8 })} ETH
                  </td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #222', textAlign: 'right' }}>
                    ${Number(entry.cVatop || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #222', textAlign: 'right' }}>
                    ${Number(entry.cVact || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #222', textAlign: 'right' }}>
                    ${Number(entry.cdVatop || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default VavityTesterEthereum;
