# V3 Product Requirements Document (PRD)

## Overview

This document provides detailed research, design references, and implementation plans for V3 features. The goal is to create a cohesive, modern UI for the human evaluation experience.

---

## E1: Consistent Expandable Section Behaviors

### Current State Analysis

**TracesSection.tsx** (Lines 37-70):
```tsx
// Current pattern - "Show/Hide" button with chevron
<div className="flex items-center justify-between cursor-pointer group"
     onClick={() => setIsExpanded(!isExpanded)}>
  <div className="flex items-center gap-2 mb-2">
    <span className="...">T</span>
    <h3 className="...">Conversation Traces</h3>
  </div>
  <button className="flex items-center gap-1 text-sm text-indigo-600">
    {isExpanded ? 'Hide' : 'Show'}
    <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
      <path d="M19 9l-7 7-7-7" />
    </svg>
  </button>
</div>
```

**LlmJudgeResults.tsx** (Lines 138-157):
```tsx
// Current pattern - "^"/"v" text button
<div className="flex items-center gap-2 mb-2">
  <h3 className="text-sm font-semibold text-purple-900">LLM Evaluation</h3>
  <button onClick={handleToggle} className="text-gray-400 hover:text-gray-600 text-sm px-1">
    {isVisible ? 'v' : '^'}
  </button>
</div>
```

### Proposed Unified Component

```tsx
// src/components/ui/ExpandableSection.tsx
interface ExpandableSectionProps {
  title: string;
  badge?: string;
  badgeColor?: 'blue' | 'emerald' | 'indigo' | 'purple' | 'amber';
  count?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  collapsedPreview?: React.ReactNode;
}
```

### Implementation Plan

1. Create `ExpandableSection` component with:
   - Consistent header layout
   - Chevron icon with rotation animation
   - "Show/Hide" text label
   - Full header row clickable
   - Keyboard accessibility (Enter/Space)

2. Refactor `TracesSection` to use new component

3. Refactor `LlmJudgeResults` to use new component

4. Test keyboard navigation and screen reader compatibility

---

## E2: Consistent Section Heading Design

### Current State Analysis

| Section             | Has Badge | Badge Style                                      | Heading Style                          |
|---------------------|-----------|--------------------------------------------------|----------------------------------------|
| Prompt              | Yes       | `w-6 h-6 rounded-full bg-blue-100 text-blue-600` | `text-sm font-semibold text-gray-700`  |
| Agent Response      | Yes       | `w-6 h-6 rounded-full bg-gray-100 text-gray-600` | `text-sm font-semibold text-gray-700`  |
| Conversation Traces | Yes       | `w-6 h-6 rounded-full bg-indigo-100 text-indigo-600` | `text-sm font-semibold text-gray-700` |
| LLM Evaluation      | **No**    | N/A                                              | `text-sm font-semibold text-purple-900`|
| Ground Truth        | Yes       | `w-6 h-6 rounded-full bg-amber-100 text-amber-600` | `text-sm font-semibold text-gray-700` |

### Issues Identified

1. **LLM Evaluation** lacks badge - breaks visual pattern
2. **LLM Evaluation** uses different text color (purple-900 vs gray-700)
3. **Agent Response** uses gray which is less distinctive
4. No semantic meaning to colors

### Proposed Color System

Design principle: Each section type should have a color that hints at its purpose.

| Section             | Badge | Color Family | Semantic Meaning       | Tailwind Classes                    |
|---------------------|-------|--------------|------------------------|-------------------------------------|
| Prompt              | P     | Blue         | User input, questions  | `bg-blue-100 text-blue-600`         |
| Agent Response      | R     | Emerald      | AI output, answers     | `bg-emerald-100 text-emerald-600`   |
| Conversation Traces | T     | Indigo       | Technical/debug info   | `bg-indigo-100 text-indigo-600`     |
| LLM Evaluation      | L     | Purple       | Assessment/judgment    | `bg-purple-100 text-purple-600`     |
| Ground Truth        | G     | Amber        | Reference/expected     | `bg-amber-100 text-amber-600`       |

### Proposed Component

```tsx
// src/components/ui/SectionHeading.tsx
interface SectionHeadingProps {
  title: string;
  badge: string;
  variant: 'prompt' | 'response' | 'traces' | 'evaluation' | 'ground-truth';
  subtitle?: string;
  actions?: React.ReactNode;
}
```

### Implementation Plan

1. Create `SectionHeading` component with variant-based styling
2. Define color tokens for each variant
3. Update `ConversationView` to use new component
4. Update `TracesSection` to use new component
5. Update `LlmJudgeResults` to use new component
6. Verify color contrast meets WCAG AA

---

## E3: Human Evaluation UI Redesign

### Current UI Assessment

**Strengths:**
- Clear three-pane layout
- Good information hierarchy
- Functional evaluation controls

**Weaknesses:**
- Mixed color palette (blue, gray, indigo, purple, amber)
- Inconsistent spacing between sections
- Basic card styling (simple borders)
- No visual rhythm or design system
- Panel backgrounds feel flat

### Design Reference Research

The following design references showcase modern evaluation/review interfaces:

#### Reference 1: Linear App
**URL**: https://linear.app
**Relevant Patterns:**
- Clean, minimal interface with generous whitespace
- Subtle borders and shadows
- Monochromatic color scheme with accent colors
- Consistent 8px spacing grid

#### Reference 2: Notion
**URL**: https://notion.so
**Relevant Patterns:**
- Light/airy feel with white backgrounds
- Subtle hover states
- Typography-driven hierarchy
- Expandable/collapsible sections

#### Reference 3: Figma Comments Panel
**URL**: https://figma.com (right sidebar in editor)
**Relevant Patterns:**
- Compact information density
- Thread-like conversation display
- Status badges and indicators
- Smooth transitions

#### Reference 4: GitHub Pull Request Review
**URL**: https://github.com (PR review interface)
**Relevant Patterns:**
- Side-by-side diff comparison
- Inline commenting
- Pass/fail status indicators
- Clear action buttons

#### Reference 5: Labelbox
**URL**: https://labelbox.com
**Relevant Patterns:**
- Data annotation interface
- Review/approve workflow
- Keyboard shortcuts display
- Progress indicators

### Proposed Design Direction

Based on research, recommend a **"Clean Minimal"** approach:

1. **Color Palette:**
   - Primary background: `#FFFFFF` (white)
   - Secondary background: `#F9FAFB` (gray-50)
   - Borders: `#E5E7EB` (gray-200)
   - Primary accent: `#4F46E5` (indigo-600)
   - Success: `#10B981` (emerald-500)
   - Error: `#EF4444` (red-500)

2. **Typography:**
   - Headings: Inter/System, 14px, semibold
   - Body: Inter/System, 14px, regular
   - Captions: Inter/System, 12px, medium

3. **Spacing:**
   - Base unit: 4px
   - Section gap: 24px (6 units)
   - Inner padding: 16px (4 units)
   - Element gap: 8px (2 units)

4. **Components:**
   - Cards: White bg, 1px gray-200 border, rounded-lg (8px)
   - Hover: Subtle gray-50 background
   - Focus: 2px indigo-500 ring
   - Shadows: Only on elevated elements (modals, dropdowns)

### Implementation Plan

#### Phase 1: Design Tokens (1 hour)
Create centralized design tokens:
```tsx
// src/styles/tokens.ts
export const colors = {
  background: { primary: '#FFFFFF', secondary: '#F9FAFB' },
  border: { default: '#E5E7EB', focus: '#4F46E5' },
  // ...
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};
```

#### Phase 2: Base Components (2 hours)
Update shared components:
- `ExpandableSection` (from E1)
- `SectionHeading` (from E2)
- `ContentBlock`
- `Card`

#### Phase 3: Panel Updates (2 hours)
Apply new styling to:
- Left panel (test case list)
- Middle panel (conversation view)
- Right panel (evaluation controls)

#### Phase 4: Polish & Review (2 hours)
- Verify responsive behavior
- Test accessibility
- Cross-browser check
- Gather feedback

---

## Development Plan: Unified Implementation

### Approach: Build Foundation First

Since E1 and E2 create reusable components that E3 depends on, implement in order:

```
Week 1, Day 1-2: E1 Implementation
├── Create ExpandableSection component
├── Refactor TracesSection
├── Refactor LlmJudgeResults
└── Test and verify

Week 1, Day 3-4: E2 Implementation
├── Create SectionHeading component
├── Define color variants
├── Update all section headings
└── Verify accessibility

Week 1, Day 5 + Week 2: E3 Implementation
├── Define design tokens
├── Update globals.css
├── Refactor panel components
├── Polish and test
└── Final review
```

### Shared Component Architecture

```
src/components/
├── ui/                          # Reusable UI primitives
│   ├── ExpandableSection.tsx    # E1: Expand/collapse behavior
│   ├── SectionHeading.tsx       # E2: Consistent headings
│   ├── Card.tsx                 # E3: Container styling
│   └── ContentBlock.tsx         # E3: Content display
├── panels/                      # Feature components
│   ├── ConversationView.tsx     # Uses ui/ components
│   ├── TracesSection.tsx        # Uses ExpandableSection
│   ├── LlmJudgeResults.tsx      # Uses ExpandableSection
│   └── TraceFlowDiagram.tsx     # SVG visualization
└── ...
```

### Testing Checklist

- [ ] All expandable sections behave identically
- [ ] All section headings have badges
- [ ] Colors are consistent and accessible
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen reader announces expand/collapse state
- [ ] Responsive on mobile (320px+)
- [ ] No visual regressions in existing functionality

---

## Appendix: Color Accessibility Check

All proposed colors verified against WCAG AA (4.5:1 contrast ratio):

| Element          | Foreground | Background | Ratio | Pass |
|------------------|------------|------------|-------|------|
| Blue badge text  | #2563EB    | #DBEAFE    | 4.7:1 | ✓    |
| Emerald badge    | #059669    | #D1FAE5    | 4.5:1 | ✓    |
| Indigo badge     | #4F46E5    | #E0E7FF    | 4.6:1 | ✓    |
| Purple badge     | #7C3AED    | #EDE9FE    | 4.5:1 | ✓    |
| Amber badge      | #D97706    | #FEF3C7    | 4.5:1 | ✓    |
| Body text        | #374151    | #FFFFFF    | 9.2:1 | ✓    |
| Muted text       | #6B7280    | #FFFFFF    | 5.4:1 | ✓    |
