'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AgentAddInvestmentCard from './AgentAddInvestmentCard';
import {
  AGENT_FREE_CALL_LIMIT,
  AGENT_SOFT_GATE_MESSAGE,
  AGENT_WELCOME_MESSAGE,
} from '../../lib/assets/supportedAssetsCatalog';

type ChatRole = 'arells' | 'user';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  assetFormId?: string;
};

type ConnectionState = {
  connected: boolean;
  freeCallsUsed: number;
  freeCallLimit: number;
};

type Props = {
  interactEarnUpToLabel: string;
  loadError: boolean;
  PortfolioUsdAmount: React.ComponentType<{
    amount: string;
    loading: boolean;
    className?: string;
  }>;
};

function uid() {
  return `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AgentPortfolioPanel({
  interactEarnUpToLabel,
  loadError,
  PortfolioUsdAmount,
}: Props) {
  const [phase, setPhase] = useState<'idle' | 'connecting' | 'chat'>('idle');
  const [connection, setConnection] = useState<ConnectionState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const softGated =
    !!connection && connection.freeCallsUsed >= (connection.freeCallLimit || AGENT_FREE_CALL_LIMIT);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/agent/connect', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as {
          connection: ConnectionState;
          welcomeMessage?: string;
        };
        if (cancelled) return;
        setConnection(json.connection);
        if (json.connection.connected) {
          setPhase('chat');
          setMessages([
            {
              id: uid(),
              role: 'arells',
              text: json.welcomeMessage || AGENT_WELCOME_MESSAGE,
            },
          ]);
        }
      } catch {
        /* ignore boot errors — user can still connect */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, phase]);

  const connect = async () => {
    setBootError(null);
    setPhase('connecting');
    try {
      const res = await fetch('/api/agent/connect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' }),
      });
      if (!res.ok) throw new Error('connect failed');
      const json = (await res.json()) as {
        connection: ConnectionState;
        welcomeMessage?: string;
      };
      setConnection(json.connection);
      setMessages([
        {
          id: uid(),
          role: 'arells',
          text: json.welcomeMessage || AGENT_WELCOME_MESSAGE,
        },
      ]);
      setPhase('chat');
    } catch {
      setBootError('Could not connect agent. Try again.');
      setPhase('idle');
    }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending || softGated) return;
    setDraft('');
    setSending(true);
    setMessages((prev) => [...prev, { id: uid(), role: 'user', text }]);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const json = (await res.json()) as {
        reply?: string;
        action?: { type?: string; assetId?: string };
        connection?: ConnectionState;
        softGated?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || 'chat failed');

      if (json.connection) setConnection(json.connection);

      const assetFormId =
        json.action?.type === 'show_add_form' && json.action.assetId
          ? json.action.assetId
          : undefined;

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'arells',
          text: json.reply || '…',
          assetFormId,
        },
      ]);

      if (json.softGated || json.action?.type === 'soft_gate') {
        /* connection already updated */
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'arells',
          text: 'Something went wrong. Please try again, or build your portfolio manually on My Investments.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (phase === 'idle' || phase === 'connecting') {
    return (
      <div className="myportfolio-share-copy-nested myinv-accent-border">
        <p className="myportfolio-share-invite-copy">
          <span className="myportfolio-share-invite-line-one">
            <span className="myportfolio-share-invite-signup">
              Build your portfolio by connecting an AI Agent
            </span>{' '}
            <span className="myportfolio-share-invite-lead-range">
              <span className="myportfolio-share-invite-lead">to earn up to</span>{' '}
              {!loadError ? (
                <PortfolioUsdAmount
                  amount={interactEarnUpToLabel}
                  loading={false}
                  className="myportfolio-inline-usd"
                />
              ) : null}
            </span>
          </span>{' '}
          <span className="myportfolio-share-invite-tail">
            a week — Arells helps you track holdings and learn what assets were added weekly.
          </span>
        </p>
        <div className="myinv-panel-section myportfolio-cta-panel">
          <div className="myinv-panel myinv-panel--shell">
            <button
              type="button"
              className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button"
              disabled={phase === 'connecting'}
              onClick={() => void connect()}
            >
              {phase === 'connecting' ? 'connecting agent' : 'connect agent'}
            </button>
          </div>
        </div>
        {bootError ? <p className="agent-chat-boot-error">{bootError}</p> : null}
      </div>
    );
  }

  return (
    <div className="myportfolio-share-copy-nested myinv-accent-border agent-chat-shell">
      <div className="agent-chat-header">
        <p className="agent-chat-header-title">Arells Agent</p>
        <p className="agent-chat-header-meta">
          Free calls used:{' '}
          {connection
            ? `${Math.min(connection.freeCallsUsed, connection.freeCallLimit)} / ${connection.freeCallLimit}`
            : `0 / ${AGENT_FREE_CALL_LIMIT}`}
        </p>
      </div>

      <div className="agent-chat-messages" ref={listRef}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`agent-chat-bubble agent-chat-bubble--${m.role}`}
          >
            <div className="agent-chat-bubble-text">{m.text}</div>
            {m.assetFormId ? (
              <AgentAddInvestmentCard assetId={m.assetFormId} />
            ) : null}
          </div>
        ))}
        {softGated ? (
          <div className="agent-chat-bubble agent-chat-bubble--arells">
            <div className="agent-chat-bubble-text">{AGENT_SOFT_GATE_MESSAGE}</div>
            <Link
              href="/my-investments"
              className="auth-submit auth-submit--accent asset-range-button myinv-range-button agent-chat-manual-link"
            >
              view my investments
            </Link>
          </div>
        ) : null}
      </div>

      {!softGated ? (
        <div className="agent-chat-composer">
          <input
            type="text"
            className="agent-chat-input"
            value={draft}
            placeholder="e.g. I hold SpaceX… or what’s new this week?"
            disabled={sending}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button
            type="button"
            className="auth-submit auth-submit--accent asset-range-button myinv-range-button agent-chat-send"
            disabled={sending || !draft.trim()}
            onClick={() => void send()}
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
