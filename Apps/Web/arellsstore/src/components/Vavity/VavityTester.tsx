'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { useVavity } from '../../context/VavityAggregator';
import BitcoinChart from '../Assets/Bitcoin/BitcoinChart';

const VavityTester: React.FC = () => {
  const { sessionId, vapa, assetPrice, fetchVavityAggregator, addVavityAggregator } = useVavity();
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
  const [chartReady, setChartReady] = useState<boolean>(false);

  useEffect(() => {
    if (!sessionId || !fetchVavityAggregator) return;

    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchVavityAggregator(sessionId);
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
  }, [fetchVavityAggregator, sessionId]);

  const investments = vavityData?.investments || [];
  const totals = vavityData?.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };
  const oldestInvestmentDate = useMemo(() => {
    if (investments.length === 0) return null;
    const dates = investments
      .map((entry: any) => entry?.date)
      .filter((value: any) => typeof value === 'string' && value.length > 0)
      .map((value: string) => new Date(value))
      .filter((date: Date) => !Number.isNaN(date.getTime()));
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates.map((date) => date.getTime())));
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
        const response = await axios.get('/api/vapaHistoricalPrice', {
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

  const formatDate = useCallback((iso: string) => {
    if (!iso) return '...';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '...';
    return d.toLocaleDateString('en-US');
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
        const response = await axios.get('/api/vapaHistoricalPrice', {
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
      await addVavityAggregator(sessionId, [newInvestment]);
      const refreshed = await fetchVavityAggregator(sessionId);
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
        bitcoin amount:
        <input
          type="text"
          inputMode="decimal"
          pattern="^[0-9]*\.?[0-9]*$"
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
          background: '#00e5ff',
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
        <h2 style={{ marginBottom: '12px' }}>My Portfolio</h2>
        {investments.length === 0 && (
          <>
            <div style={{ marginBottom: '12px' }}>(Add Investments)</div>
            {!showAddForm && (
              <button
                style={{ padding: '8px 12px', background: '#ff9800', color: '#000', border: 'none', borderRadius: '6px' }}
                onClick={() => setShowAddForm(true)}
        >
                (Add Investments)
        </button>
            )}
            {showAddForm && renderAddForm('Add Investment')}
          </>
        )}

        {investments.length > 0 && (
          <>
            <div style={{ marginBottom: '8px' }}>
              Purchased Value: ${formatCurrency(totals.acVatop || 0)}
            </div>
            <div style={{ marginBottom: '8px' }}>
              Current Value: ${formatCurrency(totals.acVact || 0)}
            </div>
            <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ marginBottom: '12px' }}>
                {(() => {
                  if (selectedRangeDays && rangeLoading) {
                    return 'Profits/Losses: ...';
                  }
                  if (selectedRangeDays && rangeHistoricalPrice != null) {
                    const pastValue = (totals.acVactTaa || 0) * rangeHistoricalPrice;
                    const profitValue = (totals.acVact || 0) - pastValue;
                    const prefix = profitValue > 0 ? '+$' : '$';
                    const formattedValue =
                      profitValue > 0
                        ? formatCurrency(profitValue)
                        : Math.abs(profitValue).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          });
                    const label = profitValue > 0 ? 'Profits' : 'Losses';
                    return `${label}: ${prefix}${formattedValue}`;
                  }
                  if (totals.acdVatop > 0) {
                    return `Profits: +$${formatCurrency(totals.acdVatop)}`;
                  }
                  const defaultProfit = Math.max(0, (vapa - assetPrice) * (totals.acVactTaa || 0));
                  return `Profits: +$${formatCurrency(defaultProfit)}`;
                })()}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {portfolioRanges.map((range) => {
                  const isEnabled = range.days == null ? true : oldestInvestmentAgeDays >= range.days;
                  const isActive = selectedRangeDays === range.days;
                  return (
                    <button
                      key={range.label}
                      type="button"
                      disabled={!isEnabled}
                      onClick={() => setSelectedRangeDays(isActive ? null : range.days)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: isActive ? '1px solid #00e5ff' : '1px solid #333',
                        background: isEnabled ? (isActive ? '#0b2f33' : '#202020') : '#111',
                        color: isEnabled ? (isActive ? '#00e5ff' : '#f5f5f5') : '#666',
                        cursor: isEnabled ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
          </div>
            <button
              style={{ padding: '8px 12px', background: '#ff9800', color: '#000', border: 'none', borderRadius: '6px' }}
              onClick={() => setShowAddMoreForm((prev) => !prev)}
            >
              {showAddMoreForm ? 'Hide add more investments' : '(add more investments)'}
            </button>
            {showAddMoreForm && renderAddForm('Add more investments')}
          </>
        )}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <BitcoinChart />
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
        <h3 style={{ marginBottom: '12px' }}>Mock Portfolio</h3>
        {currentMockEntry ? (
          <div style={{ display: 'grid', gap: '6px' }}>
            <div>(BTC)</div>
            <div>Purchased Value: ${formatCurrency(currentMockEntry.purchasedValue || 0)}</div>
            <div>Current Value: ${formatCurrency(currentMockEntry.currentValue || 0)}</div>
            <div>
              {currentMockEntry.profitLoss > 0
                ? `Profits: +$${formatCurrency(currentMockEntry.profitLoss)}`
                : 'Losses: $0.00'}
            </div>
            <div>Date Purchased: {formatDate(currentMockEntry.datePurchased)}</div>
        </div>
        ) : (
          <div>Loading mock portfolio...</div>
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
                  <div>Price at Purchase (cpVatop): {entry.cpVatop ?? 0}</div>
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
