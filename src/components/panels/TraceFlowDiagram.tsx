'use client';

import { useState, useEffect } from 'react';

interface ToolCallInfo {
  id?: string;
  functionName: string;
  functionArguments: string;
  content: string;
  status: string;
  targetFunction?: string;
  toolTarget?: {
    id?: string;
    type: string;
    name: string;
  };
}

interface ChatHistoryEntry {
  input?: string;
  content?: string;
  tool?: ToolCallInfo;
  at: string;
}

interface TraceFlowDiagramProps {
  traces: string;
  agentName?: string;
}

type NodeShape = 'pill' | 'rect' | 'diamond';

interface FlowNode {
  id: string;
  label: string;
  shape: NodeShape;
  color: string;
  textColor: string;
  x: number;
  y: number;
}

interface FlowEdge {
  from: string;
  to: string;
}

interface StepLabel {
  y: number;
  label: string;
}

const NODE_W = 220;
const NODE_H = 56;
const DIAMOND_SIZE = 68;

/**
 * Truncate text for display
 */
function truncate(text: string, maxLength: number = 30): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Parse traces and convert to flow nodes and edges
 */
function parseTracesToFlow(tracesJson: string): { nodes: FlowNode[]; edges: FlowEdge[]; steps: StepLabel[] } {
  let entries: ChatHistoryEntry[];
  try {
    entries = JSON.parse(tracesJson) as ChatHistoryEntry[];
  } catch {
    return { nodes: [], edges: [], steps: [] };
  }

  // Deduplicate
  const seen = new Set<string>();
  entries = entries.filter(entry => {
    const key = `${entry.at}-${entry.input || ''}-${entry.content || ''}-${entry.tool?.functionName || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const steps: StepLabel[] = [];

  let nodeId = 0;
  let yPos = 30;
  const xCenter = 400;
  const ySpacing = 100;

  const addNode = (label: string, shape: NodeShape, color: string, textColor: string, stepLabel: string): string => {
    const id = String.fromCharCode(65 + nodeId); // A, B, C, etc.
    const lines = label.split('\n').length;
    const extraH = lines > 2 ? (lines - 2) * 14 : 0;

    nodes.push({ id, label, shape, color, textColor, x: xCenter, y: yPos });
    steps.push({ y: yPos + (shape === 'diamond' ? DIAMOND_SIZE / 2 : (NODE_H + extraH) / 2), label: `${nodeId + 1}. ${stepLabel}` });

    if (nodeId > 0) {
      edges.push({ from: String.fromCharCode(64 + nodeId), to: id });
    }

    nodeId++;
    yPos += ySpacing + extraH;
    return id;
  };

  // Track state to properly categorize entries
  let hasSeenUserInput = false;
  let hasSeenToolOrProcessing = false;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isLastEntry = i === entries.length - 1;

    if (entry.input) {
      hasSeenUserInput = true;
      // User input node
      addNode(`👤 User Input\n"${truncate(entry.input)}"`, 'pill', '#e1f5ff', '#0d47a1', 'Input');
      // Agent receives
      addNode('🤖 Agent', 'rect', '#e8eaf6', '#283593', 'Receive');
    } else if (entry.tool) {
      hasSeenToolOrProcessing = true;
      // Decision node
      addNode('Tool Call', 'diamond', '#fff3e0', '#e65100', 'Route');

      // Tool call node
      const toolName = entry.tool.toolTarget?.name || entry.tool.functionName;
      const toolType = entry.tool.toolTarget?.type || 'Tool';
      const functionName = entry.tool.targetFunction || entry.tool.functionName;
      addNode(`🧰 ${toolName}\n${toolType}: ${toolName}\nFunction: ${functionName}`, 'rect', '#e3f2fd', '#1565c0', 'Tool Call');

      // Tool result node
      const resultText = truncate(entry.tool.content || '(no result)', 25);
      addNode(`Tool Result\n"${resultText}"`, 'rect', '#f5f5f5', '#424242', 'Result');

      // Agent processing
      addNode('🤖 Agent Processing', 'rect', '#e8eaf6', '#283593', 'Process');
    } else if (entry.content) {
      // Only show as "Final Response" if:
      // 1. We've seen user input (not an initial greeting)
      // 2. This comes after tool processing OR is the last entry after user input
      if (hasSeenUserInput && (hasSeenToolOrProcessing || isLastEntry)) {
        addNode(`💬 Final Response\n"${truncate(entry.content)}"`, 'pill', '#e1ffe1', '#1b5e20', 'Respond');
      }
      // Skip initial agent greetings that come before user input
    }
  }

  return { nodes, edges, steps };
}

function getNodeCenter(node: FlowNode): { cx: number; cy: number } {
  const lines = node.label.split('\n').length;
  const extraH = lines > 2 ? (lines - 2) * 14 : 0;
  return {
    cx: node.x,
    cy: node.y + (node.shape === 'diamond' ? DIAMOND_SIZE / 2 : (NODE_H + extraH) / 2)
  };
}

function getNodeHalfH(node: FlowNode): number {
  const lines = node.label.split('\n').length;
  const extraH = lines > 2 ? (lines - 2) * 14 : 0;
  return node.shape === 'diamond' ? DIAMOND_SIZE / 2 : (NODE_H + extraH) / 2;
}

function getNodePort(node: FlowNode, side: 'top' | 'bottom'): { x: number; y: number } {
  const { cx, cy } = getNodeCenter(node);
  const hh = getNodeHalfH(node);
  const ds = DIAMOND_SIZE / 2;
  if (side === 'top') {
    return { x: cx, y: node.shape === 'diamond' ? cy - ds : cy - hh };
  }
  return { x: cx, y: node.shape === 'diamond' ? cy + ds : cy + hh };
}

function FlowNodeSVG({
  node,
  isActive,
  isHighlighted,
  onHover
}: {
  node: FlowNode;
  isActive: boolean;
  isHighlighted: boolean | null;
  onHover: (id: string | null) => void;
}) {
  const { cx, cy } = getNodeCenter(node);
  const lines = node.label.split('\n');
  const extraH = lines.length > 2 ? (lines.length - 2) * 14 : 0;
  const opacity = isHighlighted === null ? 1 : isHighlighted ? 1 : 0.2;

  if (node.shape === 'diamond') {
    const s = DIAMOND_SIZE;
    return (
      <g
        style={{
          cursor: 'pointer',
          filter: isActive ? `drop-shadow(0 0 10px ${node.color})` : 'none',
          transition: 'opacity 0.3s',
          opacity
        }}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
      >
        <polygon
          points={`${cx},${cy - s/2} ${cx + s/2},${cy} ${cx},${cy + s/2} ${cx - s/2},${cy}`}
          fill={node.color}
          stroke={node.textColor}
          strokeWidth="2"
        />
        {lines.map((line, i) => (
          <text
            key={i}
            x={cx}
            y={cy + (i - (lines.length - 1) / 2) * 14}
            textAnchor="middle"
            dominantBaseline="central"
            fill={node.textColor}
            fontSize="11"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="600"
          >
            {line}
          </text>
        ))}
      </g>
    );
  }

  const h = NODE_H + extraH;
  const rx = node.shape === 'pill' ? h / 2 : 8;

  return (
    <g
      style={{
        cursor: 'pointer',
        filter: isActive ? `drop-shadow(0 0 10px ${node.color})` : 'none',
        transition: 'opacity 0.3s',
        opacity
      }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      <rect
        x={cx - NODE_W / 2}
        y={cy - h / 2}
        width={NODE_W}
        height={h}
        rx={rx}
        fill={node.color}
        stroke={node.textColor}
        strokeWidth="2"
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={cy + (i - (lines.length - 1) / 2) * 16}
          textAnchor="middle"
          dominantBaseline="central"
          fill={node.textColor}
          fontSize="12"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="600"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function FlowEdgeSVG({
  edge,
  nodes,
  isHighlighted,
  animDelay
}: {
  edge: FlowEdge;
  nodes: FlowNode[];
  isHighlighted: boolean | null;
  animDelay: number;
}) {
  const fromNode = nodes.find(n => n.id === edge.from);
  const toNode = nodes.find(n => n.id === edge.to);
  if (!fromNode || !toNode) return null;

  const start = getNodePort(fromNode, 'bottom');
  const end = getNodePort(toNode, 'top');
  const opacity = isHighlighted === null ? 0.5 : isHighlighted ? 1 : 0.08;
  const strokeColor = isHighlighted ? '#1976d2' : '#90a4ae';
  const pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

  return (
    <g style={{ transition: 'opacity 0.3s', opacity }}>
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" markerEnd="url(#arrowhead)" />
      {isHighlighted && (
        <circle r="4" fill="#1976d2">
          <animateMotion dur="1s" repeatCount="indefinite" path={pathD} begin={`${animDelay}s`} />
        </circle>
      )}
    </g>
  );
}

function StepLabelsSVG({ steps }: { steps: StepLabel[] }) {
  return (
    <g>
      {steps.map((s, i) => (
        <text
          key={i}
          x={260}
          y={s.y}
          textAnchor="end"
          dominantBaseline="central"
          fill="#b0bec5"
          fontSize="11"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="500"
        >
          {s.label}
        </text>
      ))}
    </g>
  );
}

function LegendSVG() {
  const items = [
    { color: '#e1f5ff', border: '#0d47a1', label: 'User' },
    { color: '#e8eaf6', border: '#283593', label: 'Agent' },
    { color: '#fff3e0', border: '#e65100', label: 'Decision', shape: 'diamond' as const },
    { color: '#e3f2fd', border: '#1565c0', label: 'Tool Call' },
    { color: '#f5f5f5', border: '#424242', label: 'Tool Result' },
    { color: '#e1ffe1', border: '#1b5e20', label: 'Response' },
  ];

  return (
    <g transform="translate(600, 30)">
      <rect
        x="0"
        y="0"
        width="140"
        height={items.length * 28 + 16}
        rx="8"
        fill="#ffffff"
        fillOpacity="0.95"
        stroke="#e0e0e0"
        strokeWidth="1"
      />
      {items.map((item, i) => (
        <g key={i} transform={`translate(12, ${i * 28 + 16})`}>
          {item.shape === 'diamond' ? (
            <polygon points="8,0 16,8 8,16 0,8" fill={item.color} stroke={item.border} strokeWidth="1.5" />
          ) : (
            <rect x="0" y="0" width="16" height="16" rx="3" fill={item.color} stroke={item.border} strokeWidth="1.5" />
          )}
          <text x="24" y="12" fill="#546e7a" fontSize="10" fontFamily="Inter, system-ui, sans-serif">
            {item.label}
          </text>
        </g>
      ))}
    </g>
  );
}

function getConnected(nodeId: string, edges: FlowEdge[]): { nodes: Set<string>; edges: Set<number> } {
  const connected = new Set([nodeId]);
  const edgesSet = new Set<number>();
  edges.forEach((e, i) => {
    if (e.from === nodeId || e.to === nodeId) {
      connected.add(e.from);
      connected.add(e.to);
      edgesSet.add(i);
    }
  });
  return { nodes: connected, edges: edgesSet };
}

function useAnimationStep(nodeIds: string[]) {
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (nodeIds.length === 0) return;

    let idx = 0;
    const interval = setInterval(() => {
      setStep(idx % nodeIds.length);
      idx++;
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setStep(-1);
    }, nodeIds.length * 500 + 200);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [nodeIds.length]);

  return step >= 0 && step < nodeIds.length ? nodeIds[step] : null;
}

export function TraceFlowDiagram({ traces, agentName = 'Agent' }: TraceFlowDiagramProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const { nodes, edges, steps } = parseTracesToFlow(traces);
  const activeStep = useAnimationStep(nodes.map(n => n.id));
  const connected = hovered ? getConnected(hovered, edges) : null;

  if (nodes.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No trace data available
      </div>
    );
  }

  // Calculate SVG height based on nodes
  const lastNode = nodes[nodes.length - 1];
  const lastNodeLines = lastNode.label.split('\n').length;
  const lastNodeExtraH = lastNodeLines > 2 ? (lastNodeLines - 2) * 14 : 0;
  const svgH = lastNode.y + NODE_H + lastNodeExtraH + 60;
  const svgW = 800;

  return (
    <div className="flex flex-col items-center">
      {/* Title */}
      <h3 className="text-xl font-bold text-indigo-900 tracking-tight">
        Agent Trace: {agentName}
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        User → Agent → Tool → Response
      </p>

      {/* SVG Diagram */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-3 shadow-lg overflow-auto max-w-full">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width={svgW}
          height={svgH}
          style={{ display: 'block' }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#90a4ae" />
            </marker>
          </defs>

          <LegendSVG />
          <StepLabelsSVG steps={steps} />

          {edges.map((edge, i) => (
            <FlowEdgeSVG
              key={i}
              edge={edge}
              nodes={nodes}
              isHighlighted={connected ? connected.edges.has(i) : null}
              animDelay={i * 0.1}
            />
          ))}

          {nodes.map(node => (
            <FlowNodeSVG
              key={node.id}
              node={node}
              isActive={activeStep === node.id}
              isHighlighted={connected ? connected.nodes.has(node.id) : null}
              onHover={setHovered}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
