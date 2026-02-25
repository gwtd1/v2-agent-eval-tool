'use client';

import { ExpandableTracesSection } from '@/components/traces/ExpandableTracesSection';

interface TracesSectionProps {
  traces: string | null;
  agentName?: string;
}

/**
 * Enhanced TracesSection with expandable cards, timeline view, search, and filtering
 *
 * This component replaces the previous SVG-based TraceFlowDiagram with a more
 * comprehensive trace viewing experience including:
 * - Expandable trace cards with full content visibility
 * - Timeline view for chronological visualization
 * - Search and filtering capabilities
 * - Copy-to-clipboard functionality
 * - Export options (JSON, Text, CSV)
 */
export function TracesSection({ traces, agentName }: TracesSectionProps) {
  return <ExpandableTracesSection traces={traces} agentName={agentName} />;
}
