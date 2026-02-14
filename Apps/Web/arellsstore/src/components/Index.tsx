"use client";

import type { ImageLoaderProps } from 'next/image';
import '../app/css/Home.css';
import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { useVavity } from '../context/VavityAggregator';

type VotingAsset = 'solana' | 'xrp';

type VotingBlockData = {
  expiresAt: number;
  votes: { solana: number; xrp: number };
  sessions: string[];
  remainingMs: number;
  isExpired: boolean;
};

const Index = () => {
  // Loader Functions
  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  };

  const [showLoading, setLoading] = useState<boolean>(true);
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
    wordLogo: false,
  });
  const { getAsset, sessionId } = useVavity();
  const [votingData, setVotingData] = useState<VotingBlockData | null>(null);
  const [votingHidden, setVotingHidden] = useState<boolean>(false);
  const [countdownMs, setCountdownMs] = useState<number>(0);
  const [voteModal, setVoteModal] = useState<null | { asset: VotingAsset; status: 'winning' | 'losing' | 'tied'; pct: number }>(
    null
  );
  const [voteModalClosing, setVoteModalClosing] = useState<boolean>(false);


  const handleImageLoaded = (imageName: string) => {
    setImagesLoaded(prevState => ({ 
      ...prevState, 
      [imageName]: true 
    }));
  };

  useEffect(() => {
    if (Object.values(imagesLoaded).every(Boolean)) {
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, 1000);

      const hideTimer = setTimeout(() => {
        setLoading(false);
        setFadeOut(false);
      }, 2000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [imagesLoaded]);

  useEffect(() => {
    const fetchVoting = async () => {
      try {
        const res = await fetch('/api/votingBlock/getVotingBlock');
        const data = await res.json();
        const next: VotingBlockData = data;
        setVotingData(next);
        setCountdownMs(next.remainingMs || 0);
        const hasVoted = sessionId && next.sessions?.includes(sessionId);
        if (next.isExpired || hasVoted) {
          setVotingHidden(true);
        } else {
          setVotingHidden(false);
        }
      } catch {
        setVotingHidden(true);
      }
    };

    fetchVoting();
  }, [sessionId]);

  useEffect(() => {
    if (votingHidden || !votingData) return;
    const interval = setInterval(() => {
      setCountdownMs((prev) => {
        const next = Math.max(prev - 1000, 0);
        if (next <= 0) {
          setVotingHidden(true);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [votingHidden, votingData]);

  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
  };

  const handleVote = async (asset: VotingAsset) => {
    if (!sessionId || votingHidden) return;
    try {
      const res = await fetch('/api/votingBlock/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset, sessionId }),
      });
      const data = await res.json();
      const next: VotingBlockData = data;
      setVotingData(next);
      const totalVotes = (next.votes?.solana || 0) + (next.votes?.xrp || 0);
      const assetVotes = next.votes?.[asset] || 0;
      const pct = totalVotes > 0 ? Number(((assetVotes / totalVotes) * 100).toFixed(2)) : 0;
      let status: 'winning' | 'losing' | 'tied' = 'tied';
      if (next.votes.solana > next.votes.xrp) {
        status = asset === 'solana' ? 'winning' : 'losing';
      } else if (next.votes.xrp > next.votes.solana) {
        status = asset === 'xrp' ? 'winning' : 'losing';
      }
      setVoteModal({ asset, status, pct });
    } catch {
      // ignore for now
    }
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatPercent = (value: number) =>
    `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

  const getPercentChange = (history: { date: string; price: number }[], days?: number) => {
    if (!history.length) return 0;
    const latest = history[history.length - 1]?.price ?? 0;
    if (latest <= 0) return 0;
    if (days == null) {
      const first = history.find((entry) => entry.price > 0)?.price ?? 0;
      return first > 0 ? ((latest - first) / first) * 100 : 0;
    }
    const lastDate = history[history.length - 1]?.date;
    if (!lastDate) return 0;
    const cutoff = new Date(`${lastDate}T00:00:00.000Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    let base = history[0]?.price ?? 0;
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const entryDate = new Date(`${history[i].date}T00:00:00.000Z`);
      if (entryDate <= cutoff) {
        base = history[i].price;
        break;
      }
    }
    return base > 0 ? ((latest - base) / base) * 100 : 0;
  };

  const assetRows = useMemo(() => {
    const assets = [
      { id: 'bitcoin', label: 'Bitcoin', href: '/bitcoin', icon: 'images/assets/crypto/Bitcoin.png' },
      { id: 'ethereum', label: 'Ethereum', href: '/ethereum', icon: 'images/assets/crypto/Ethereum.svg' }
    ];

    return assets.map((asset) => {
      const snapshot = getAsset(asset.id);
      const history = snapshot?.history ?? [];
      const vapa = snapshot?.vapa ?? 0;
      return {
        ...asset,
        vapa,
        change1w: getPercentChange(history, 7),
        change1y: getPercentChange(history, 365),
        changeAll: getPercentChange(history),
      };
    });
  }, [getAsset]);

  const sortedRows = assetRows;

  return (
    <>
      {showLoading && (
        <div className="home-loader-overlay">
          <div className={`home-loader-ring${fadeOut ? ' home-loader-fade' : ''}`}>
            <svg className="home-loader-spinner" viewBox="0 0 60 60" aria-hidden="true">
              <circle cx="30" cy="30" r="26" />
            </svg>
            <Image
              loader={imageLoader}
              alt=""
              width={29}
              height={30}
              id="arells-loader-icon-bitcoin"
              src="images/Arells-Icon.png"
            />
          </div>
        </div>
      )}

      <div className="home-header-inner">
        <Image
          loader={imageLoader}
          onLoad={() => handleImageLoaded('wordLogo')}
          alt=""
            width={70}
            height={23}
          id="word-logoo"
          src="images/Arells-Logo-Ebony.png"
        />

        <div id="descriptioner-wrapper">
          <p id="descriptioner" style={{ letterSpacing: '0px', marginLeft: '0px' }}>
            if bear markets never existed
          </p>
        </div>
      </div>

      {!votingHidden && votingData && (
        <div className="home-voting-block">
          <div className="home-voting-title">Which should we add next week?</div>
          <div className="home-voting-options">
            <button type="button" className="home-voting-button home-voting-button--solana" onClick={() => handleVote('solana')}>
              <Image className="home-voting-icon" alt="Solana" width={22} height={22} src="/images/assets/crypto/solana.png" />
              <span>Solana</span>
            </button>
            <button type="button" className="home-voting-button home-voting-button--xrp" onClick={() => handleVote('xrp')}>
              <Image className="home-voting-icon" alt="XRP" width={22} height={22} src="/images/assets/crypto/xrp.png" />
              <span>XRP</span>
            </button>
          </div>
          <div className="home-voting-countdown">
            <span>Voting ends</span>
            <span>{formatCountdown(countdownMs)}</span>
          </div>
        </div>
      )}

      <div className="home-assets-wrapper">
        <div className="home-assets-list">
          <div className="home-assets-header-row">
            <div className="home-assets-cell home-assets-index"></div>
          <div className="home-assets-cell home-assets-button">
              Asset
          </div>
          <div className="home-assets-cell home-assets-button home-assets-price-header">
              Price
          </div>
          <div className="home-assets-cell home-assets-button home-assets-1w home-assets-1w-header">
              1 wk
          </div>
          <div className="home-assets-cell home-assets-button home-assets-1y">
              1 yr
          </div>
          <div className="home-assets-cell home-assets-button">
              all-time
          </div>
          </div>

        {sortedRows.map((row, index) => (
            <div key={row.id} className="home-asset-row">
              <div className="home-assets-cell home-assets-index">{index + 1}</div>
              <Link href={row.href} className={`home-asset-card home-asset-${row.id}`}>
                <span className="home-asset-icon-wrap">
                  <Image
                    loader={imageLoader}
                    alt={`${row.label} logo`}
                    width={18}
                    height={18}
                    className="home-asset-icon"
                    src={row.icon}
                  />
                </span>
                <div className="home-assets-cell home-assets-asset">
                  <span className={`home-asset-label home-asset-label-${row.id}`}>
                    <span className="home-asset-name">{row.label}</span>
                  </span>
                </div>
                <div className="home-assets-cell">
                  <span className="home-assets-currency home-assets-currency-dollar">$</span>
                  <span className="home-assets-number home-assets-price">{formatCurrency(row.vapa)}</span>
                </div>
                <div className="home-assets-cell home-assets-percent home-assets-1w">
                  <Image
                    loader={imageLoader}
                    alt=""
                    width={12}
                    height={12}
                    className="home-asset-arrow"
                    src={row.change1w > 0 ? 'images/up-arrow-ebony.png' : 'images/down-arrow-ebony.png'}
                  />
                  <span className="home-assets-number">
                    {formatPercent(row.change1w).replace('%', '')}
                    <span className="home-assets-currency home-assets-currency-percent">%</span>
                  </span>
                </div>
                <div className="home-assets-cell home-assets-percent home-assets-1y">
                  <Image
                    loader={imageLoader}
                    alt=""
                    width={12}
                    height={12}
                    className="home-asset-arrow"
                    src={row.change1y > 0 ? 'images/up-arrow-ebony.png' : 'images/down-arrow-ebony.png'}
                  />
                  <span className="home-assets-number">
                    {formatPercent(row.change1y).replace('%', '')}
                    <span className="home-assets-currency home-assets-currency-percent">%</span>
                  </span>
                </div>
                <div className="home-assets-cell home-assets-percent">
                  <Image
                    loader={imageLoader}
                    alt=""
                    width={12}
                    height={12}
                    className="home-asset-arrow"
                    src={row.changeAll > 0 ? 'images/up-arrow-ebony.png' : 'images/down-arrow-ebony.png'}
                  />
                  <span className="home-assets-number">
                    {formatPercent(row.changeAll).replace('%', '')}
                    <span className="home-assets-currency home-assets-currency-percent">%</span>
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div className="home-assets-footer">
          <div className="home-assets-footer-text">A new asset added weekly</div>
        </div>
      </div>

      {voteModal && (
        <div className={`home-vote-modal-overlay${voteModalClosing ? ' is-fading' : ''}`}>
          <div className="home-vote-modal">
            <Image
              className="home-vote-modal-icon"
              alt={voteModal.asset === 'solana' ? 'Solana' : 'XRP'}
              width={22}
              height={22}
              src={voteModal.asset === 'solana' ? '/images/assets/crypto/solana.png' : '/images/assets/crypto/xrp.png'}
            />
            <div className="home-vote-modal-title">
              {voteModal.asset === 'solana' ? 'Solana' : 'XRP'} is{' '}
              {voteModal.status === 'tied' ? 'tied' : voteModal.status === 'winning' ? 'winning' : 'losing'}
            </div>
            <div className="home-vote-modal-subtitle">{voteModal.pct}% of votes</div>
            <div className="home-vote-modal-body">Check back next week to see which asset won and was added.</div>
            <button
              type="button"
              className={`home-vote-modal-button ${
                voteModal.asset === 'xrp' ? 'home-vote-modal-button--xrp' : 'home-vote-modal-button--solana'
              }`}
              onClick={() => {
                setVoteModalClosing(true);
                setTimeout(() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }, 200);
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

    </>
  );
}

export default Index;