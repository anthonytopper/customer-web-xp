'use client';

import React from 'react';
import type { PlanItem } from '@/lib/plan/item';
import type { SectionManifest } from '@/lib/plan/manifest';
export default function PlayerMainContent({ section }: { section: SectionManifest }) {
  const recast = section?.items.find(item => item.type === 'full-overview');
  if (!recast) {
    return <h1>Recast not found</h1>;
  }
  return (
    <iframe src={recast.paths_signed?.html} className="w-full h-full md:p-12" />
  );
}

