'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type AssetTheme = 'bitcoin' | 'ethereum' | 'bnb' | 'solana' | 'xrp';

type Props = {
  value: string; // YYYY-MM-DD or ''
  onChange: (nextIso: string) => void;
  className?: string;
  placeholder?: string;
  asset?: AssetTheme;
};

function clampDateToYmd(d: Date) {
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  return { year, month, day };
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toIsoYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseIsoYmd(value: string): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  const d = new Date(y, mo, da);
  if (Number.isNaN(d.getTime())) return null;
  // guard invalid rollovers (e.g. 2026-02-31)
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== da) return null;
  return d;
}

function formatDisplay(value: string) {
  const d = parseIsoYmd(value);
  if (!d) return '';
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const yy = d.getFullYear();
  return `${mm}/${dd}/${yy}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export default function CustomDatePicker({ value, onChange, className, placeholder = 'Select date', asset }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const todayIso = useMemo(() => toIsoYmd(new Date()), []);
  const selectedRaw = useMemo(() => parseIsoYmd(value), [value]);
  const selected = useMemo(() => {
    if (!selectedRaw) return null;
    const iso = toIsoYmd(selectedRaw);
    return iso > todayIso ? null : selectedRaw;
  }, [selectedRaw, todayIso]);
  const initialMonth = useMemo(() => selected ?? new Date(), [selected]);
  const [open, setOpen] = useState(false);
  const [renderPopover, setRenderPopover] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const theme: AssetTheme = asset ?? 'bitcoin';
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth());
  const [activeIso, setActiveIso] = useState<string>(value || '');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const themeVars = useMemo((): React.CSSProperties => {
    switch (theme) {
      case 'ethereum':
        return {
          '--asset-line-color': 'rgb(107, 114, 168)',
          '--asset-slogan-color': 'rgb(82, 87, 131)',
          '--asset-border-color': 'rgba(107, 114, 168, 0.45)',
        } as React.CSSProperties;
      case 'bnb':
        return {
          '--asset-line-color': 'rgb(243, 186, 47)',
          '--asset-slogan-color': 'rgb(130, 92, 18)',
          '--asset-border-color': 'rgba(243, 186, 47, 0.45)',
        } as React.CSSProperties;
      case 'solana':
        return {
          '--asset-line-color': 'rgb(0, 145, 120)',
          '--asset-slogan-color': 'rgb(0, 94, 88)',
          '--asset-border-color': 'rgba(0, 208, 168, 0.45)',
        } as React.CSSProperties;
      case 'xrp':
        return {
          '--asset-line-color': 'rgb(30, 41, 59)',
          '--asset-slogan-color': 'rgb(15, 23, 42)',
          '--asset-border-color': 'rgba(30, 41, 59, 0.45)',
        } as React.CSSProperties;
      default:
        return {
          '--asset-line-color': 'rgb(209, 142, 55)',
          '--asset-slogan-color': 'rgb(172, 97, 0)',
          '--asset-border-color': 'rgba(248, 141, 0, 0.45)',
        } as React.CSSProperties;
    }
  }, [theme]);

  const startClose = useCallback(() => {
    setPopoverVisible(false);
    setOpen(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    // Keep mounted for fade-out.
    closeTimerRef.current = window.setTimeout(() => {
      setRenderPopover(false);
      closeTimerRef.current = null;
    }, 500);
  }, []);

  const startOpen = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setRenderPopover(true);
    setOpen(true);
    requestAnimationFrame(() => setPopoverVisible(true));
  }, []);

  useEffect(() => {
    // keep active cursor in sync with external value when closed
    if (!open) {
      setActiveIso(value && value <= todayIso ? value : '');
      const d = selected ?? new Date();
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [open, selected, todayIso, value]);

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const firstWeekday = first.getDay(); // 0-6
    const start = new Date(viewYear, viewMonth, 1 - firstWeekday);
    const result: { iso: string; day: number; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      result.push({
        iso: toIsoYmd(d),
        day: d.getDate(),
        inMonth: d.getMonth() === viewMonth,
      });
    }
    return result;
  }, [viewMonth, viewYear]);

  const close = useCallback(() => startClose(), [startClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        startClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, startClose]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const root = rootRef.current;
      const pop = popoverRef.current;
      if (!root) return;
      if (e.target instanceof Node && !root.contains(e.target) && !(pop && pop.contains(e.target))) {
        startClose();
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open, startClose]);

  const updatePopoverPosition = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const gap = 10;
    // Fixed popup size for consistency across all screen sizes.
    const desiredWidth = 200;
    const desiredHeight = 300;
    // Center under trigger, clamp to viewport with small padding.
    const viewportPad = 10;
    const leftIdeal = r.left + r.width / 2 - desiredWidth / 2;
    const left = Math.min(
      window.innerWidth - viewportPad - desiredWidth,
      Math.max(viewportPad, leftIdeal)
    );
    const belowTop = r.bottom + gap;
    const aboveTop = r.top - gap - desiredHeight;
    const fitsBelow = belowTop + desiredHeight <= window.innerHeight - viewportPad;
    const fitsAbove = aboveTop >= viewportPad;
    const topIdeal = fitsBelow ? belowTop : fitsAbove ? aboveTop : belowTop;
    const top = Math.min(
      window.innerHeight - viewportPad - desiredHeight,
      Math.max(viewportPad, topIdeal)
    );
    setPopoverStyle({
      position: 'fixed',
      left,
      top,
      width: desiredWidth,
      height: desiredHeight,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePopoverPosition();
    const onWin = () => updatePopoverPosition();
    window.addEventListener('resize', onWin);
    // Capture scroll on any parent scroll container, not just window.
    window.addEventListener('scroll', onWin, true);
    return () => {
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [open, updatePopoverPosition]);

  useEffect(() => {
    if (!open) return;
    // focus the selected/active day for keyboard nav
    requestAnimationFrame(() => {
      const grid = gridRef.current;
      if (!grid) return;
      const iso = activeIso || value;
      const btn = grid.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);
      btn?.focus();
    });
  }, [activeIso, open, value]);

  const moveMonth = useCallback((delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [viewMonth, viewYear]);

  const onDayKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    const iso = (e.currentTarget.dataset.iso || '').trim();
    if (!iso) return;
    const current = parseIsoYmd(iso);
    if (!current) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (iso > todayIso) return;
      onChange(iso);
      startClose();
      return;
    }
    const key = e.key;
    let deltaDays = 0;
    if (key === 'ArrowLeft') deltaDays = -1;
    if (key === 'ArrowRight') deltaDays = 1;
    if (key === 'ArrowUp') deltaDays = -7;
    if (key === 'ArrowDown') deltaDays = 7;
    if (!deltaDays) return;
    e.preventDefault();
    const next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + deltaDays);
    const nextIso = toIsoYmd(next);
    setActiveIso(nextIso);
    const { year, month } = clampDateToYmd(next);
    if (year !== viewYear || month !== viewMonth) {
      setViewYear(year);
      setViewMonth(month);
    }
  }, [onChange, startClose, todayIso, viewMonth, viewYear]);

  return (
    <div
      ref={rootRef}
      className={`asset-date-picker asset-date-picker--${theme}${className ? ` ${className}` : ''}`}
      style={themeVars}
    >
      <button
        type="button"
        className={`asset-date-trigger${open ? ' is-open' : ''}`}
        ref={triggerRef}
        onClick={() => (open ? startClose() : startOpen())}
      >
        <span className={`asset-date-value${value && value <= todayIso ? '' : ' is-placeholder'}`}>
          {value && value <= todayIso ? formatDisplay(value) : placeholder}
        </span>
        <span className="asset-date-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10ZM6 6a1 1 0 0 0-1 1v1h14V7a1 1 0 0 0-1-1H6Z"
            />
          </svg>
        </span>
      </button>

      {renderPopover &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            className={`asset-date-popover asset-date-popover--${theme}${popoverVisible ? ' is-visible' : ''}`}
            role="dialog"
            aria-label="Calendar"
            style={{ ...themeVars, ...popoverStyle }}
          >
            <div className="asset-date-header">
              <button
                type="button"
                className="asset-date-nav"
                onClick={() => moveMonth(-1)}
                aria-label="Previous month"
              >
                ‹
              </button>
              <div className="asset-date-month">
                {MONTHS[viewMonth]} {viewYear}
              </div>
              <button type="button" className="asset-date-nav" onClick={() => moveMonth(1)} aria-label="Next month">
                ›
              </button>
            </div>

            <div className="asset-date-weekdays">
              {WEEKDAYS.map((d) => (
                <div key={d} className="asset-date-weekday">
                  {d}
                </div>
              ))}
            </div>

            <div ref={gridRef} className="asset-date-grid" role="grid">
              {days.map((d) => {
                const isSelected = !!value && d.iso === value;
                const isActive = !!activeIso && d.iso === activeIso;
                const isFuture = d.iso > todayIso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    role="gridcell"
                    data-iso={d.iso}
                    className={`asset-date-day${d.inMonth ? '' : ' is-outside'}${isSelected ? ' is-selected' : ''}${
                      isActive ? ' is-active' : ''
                    }${isFuture ? ' is-disabled' : ''}`}
                    onKeyDown={onDayKeyDown}
                    disabled={isFuture}
                    aria-disabled={isFuture}
                    onMouseEnter={() => {
                      if (isFuture) return;
                      setActiveIso(d.iso);
                    }}
                    onClick={() => {
                      if (isFuture) return;
                      onChange(d.iso);
                      startClose();
                    }}
                  >
                    {d.day}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

