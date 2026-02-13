'use client';

import { useState } from 'react';
import { ExpandableSection } from '@/components/ui/ExpandableSection';
import { TraceFlowDiagram } from './TraceFlowDiagram';

interface TracesSectionProps {
  traces: string | null;
  agentName?: string;
}

/**
 * Parse traces to count entries and tool calls
 */
function getTraceCounts(tracesJson: string): { entries: number; toolCalls: number } {
  try {
    const entries = JSON.parse(tracesJson) as Array<{ tool?: unknown }>;
    const toolCalls = entries.filter(e => e.tool !== undefined).length;
    return { entries: entries.length, toolCalls };
  } catch {
    return { entries: 0, toolCalls: 0 };
  }
}

export function TracesSection({ traces, agentName }: TracesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!traces) {
    return null;
  }

  const { entries, toolCalls } = getTraceCounts(traces);

  if (entries === 0) {
    return null;
  }

  // Build count string
  const countParts = [`${entries} ${entries === 1 ? 'step' : 'steps'}`];
  if (toolCalls > 0) {
    countParts.push(`${toolCalls} tool ${toolCalls === 1 ? 'call' : 'calls'}`);
  }
  const countString = countParts.join(', ');

  return (
    <ExpandableSection
      title="Conversation Traces"
      badge="T"
      variant="traces"
      count={countString}
      isExpandable={true}
      defaultExpanded={isExpanded}
      onToggle={setIsExpanded}
    >
      <TraceFlowDiagram traces={traces} agentName={agentName} />
    </ExpandableSection>
  );
}
