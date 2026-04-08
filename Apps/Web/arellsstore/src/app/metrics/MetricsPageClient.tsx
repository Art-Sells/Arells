'use client';

import React from 'react';
import AuthPageShell from '../../components/Auth/AuthPageShell';
import GrowthMetricsPanel from '../../components/Metrics/GrowthMetricsPanel';
import MetricsPageActivityPanel from '../../components/Metrics/MetricsPageActivityPanel';
import MetricsPageMountRecorder from '../../components/Metrics/MetricsPageMountRecorder';

export default function MetricsPageClient() {
  return (
    <AuthPageShell title="Growth Metrics" wide>
      <MetricsPageMountRecorder />
      <div className="metrics-stack">
        <GrowthMetricsPanel />
        <MetricsPageActivityPanel />
      </div>
    </AuthPageShell>
  );
}
