'use client';

import React from 'react';
import AuthPageShell from '../../components/Auth/AuthPageShell';
import AnalyticsSummaryPanel from '../../components/Metrics/AnalyticsSummaryPanel';
import GrowthMetricsPanel from '../../components/Metrics/GrowthMetricsPanel';

export default function MetricsPageClient() {
  return (
    <AuthPageShell title="Growth Metrics" wide>
      <div className="metrics-stack">
        <GrowthMetricsPanel />
        <AnalyticsSummaryPanel />
      </div>
    </AuthPageShell>
  );
}
