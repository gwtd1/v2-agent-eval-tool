# V3 Agent Eval Tool Roadmap

## Summary

V3 focuses on UI consistency and visual polish for the human evaluation experience. The three features (E1, E2, E3) work together to create a unified, modern design language across the evaluation interface. These changes are primarily cosmetic but significantly improve usability and professional appearance.

## V3 Features

| ID  | Category | Developer | Requirement                                        | Priority | Status | Complexity | Dependencies |
|-----|----------|-----------|---------------------------------------------------|----------|--------|------------|--------------|
| E1  | UI       | gwtd1     | Consistent click behaviors for expandable sections | High     |        | Low        | None         |
| E2  | UI       | gwtd1     | Consistent section heading design                  | High     |        | Medium     | E1           |
| E3  | UI       | gwtd1     | Human evaluation UI redesign                       | Medium   |        | High       | E1, E2       |

## Feature Details

### E1: Consistent Click Behaviors for Expandable Sections

**Problem Statement:**
The Conversation Traces and LLM Evaluation sections both expand/collapse but use completely different interaction patterns:

| Section             | Current Button | Current Icon | Click Target        |
|---------------------|----------------|--------------|---------------------|
| Conversation Traces | "Show/Hide"    | Chevron SVG  | Entire header row   |
| LLM Evaluation      | "^" / "v"      | Text char    | Small button only   |

**Proposed Solution:**
Create a reusable `ExpandableSection` component with standardized behavior:

- **Button Style**: Text label ("Show"/"Hide") + chevron icon
- **Click Target**: Entire header row is clickable
- **Animation**: Smooth chevron rotation (180deg) on expand
- **Keyboard**: Support Enter/Space for accessibility
- **State Indicator**: Chevron points down when collapsed, up when expanded

**Files to Modify:**
- `src/components/panels/TracesSection.tsx`
- `src/components/panels/LlmJudgeResults.tsx`
- Create: `src/components/ui/ExpandableSection.tsx`

**Acceptance Criteria:**
- [ ] All expandable sections use the same button component
- [ ] Consistent icon (chevron) for expand/collapse state
- [ ] Same hover, active, and focus states across buttons
- [ ] Keyboard navigation support (Tab, Enter, Space)
- [ ] Smooth CSS transitions for expand/collapse

---

### E2: Consistent Section Heading Design

**Problem Statement:**
The five sections in the evaluation pane have inconsistent heading designs:

| Section             | Badge | Badge Color     | Text Color  | Has Expand |
|---------------------|-------|-----------------|-------------|------------|
| Prompt              | P     | blue-100/600    | gray-700    | No         |
| Agent Response      | R     | gray-100/600    | gray-700    | No         |
| Conversation Traces | T     | indigo-100/600  | gray-700    | Yes        |
| LLM Evaluation      | None  | N/A             | purple-900  | Yes        |
| Ground Truth        | G     | amber-100/600   | gray-700    | No         |

**Proposed Solution:**
Standardize all section headings with:

1. **Badge System**: Apply circular letter badges to ALL sections consistently
2. **Color Palette**: Assign distinct, harmonious colors to each section type
3. **Typography**: Unified font size (sm), weight (semibold), and case (uppercase)

**Proposed Color Scheme:**

| Section             | Badge | Background     | Text/Border    | Purpose              |
|---------------------|-------|----------------|----------------|----------------------|
| Prompt              | P     | blue-100       | blue-600       | User input           |
| Agent Response      | R     | emerald-100    | emerald-600    | AI output            |
| Conversation Traces | T     | indigo-100     | indigo-600     | Debug/trace data     |
| LLM Evaluation      | L     | purple-100     | purple-600     | Automated assessment |
| Ground Truth        | G     | amber-100      | amber-600      | Expected result      |

**Files to Modify:**
- `src/components/panels/ConversationView.tsx`
- `src/components/panels/TracesSection.tsx`
- `src/components/panels/LlmJudgeResults.tsx`
- Create: `src/components/ui/SectionHeading.tsx`

**Acceptance Criteria:**
- [ ] All five sections use circular letter badges
- [ ] Each section type has a unique, distinguishable color
- [ ] Typography is consistent across all headings
- [ ] Clear visual hierarchy between headers and content
- [ ] Colors meet WCAG contrast requirements

---

### E3: Human Evaluation UI Redesign

**Problem Statement:**
The three-pane evaluation layout works functionally but lacks visual polish:
- Color palette feels dated
- Inconsistent spacing and padding
- No clear visual rhythm
- Panel borders and backgrounds need refinement

**Proposed Solution:**
A holistic visual refresh addressing:

1. **Color Palette**: Modern, cohesive color system
2. **Typography**: Consistent type scale and hierarchy
3. **Spacing**: Harmonious padding/margin system (4px grid)
4. **Components**: Refined borders, shadows, and backgrounds
5. **Micro-interactions**: Subtle hover states and transitions

**Research Phase Required:**
Before implementation, gather 3-5 design references for approval. Focus on:
- Data annotation/labeling tool interfaces
- Document review applications
- Side-by-side comparison UIs
- Modern dashboard designs

**Files to Modify:**
- `src/app/review/page.tsx`
- `src/components/panels/*.tsx` (all panel components)
- `src/app/globals.css` (design tokens)
- Potentially create: `src/styles/tokens.ts`

**Acceptance Criteria:**
- [ ] Research phase: Present 3-5 design references for approval
- [ ] Define design tokens (colors, spacing, typography)
- [ ] Update all panel components with new styles
- [ ] Maintain usability and accessibility (WCAG AA)
- [ ] Responsive design maintained
- [ ] No functionality changes, visual only

---

## Implementation Order

```
E1 (Expandable Sections)
    │
    ▼
E2 (Section Headings) ──depends on──► E1 component
    │
    ▼
E3 (Full UI Redesign) ──depends on──► E1, E2 foundations
```

**Rationale:**
1. **E1 first**: Creates the reusable `ExpandableSection` component
2. **E2 second**: Creates the reusable `SectionHeading` component, uses E1 patterns
3. **E3 last**: Applies comprehensive styling using E1 and E2 as building blocks

## Estimated Effort

| Feature | Research | Implementation | Testing | Total    |
|---------|----------|----------------|---------|----------|
| E1      | -        | 2 hours        | 1 hour  | 3 hours  |
| E2      | 1 hour   | 3 hours        | 1 hour  | 5 hours  |
| E3      | 3 hours  | 6 hours        | 2 hours | 11 hours |
| **Total** | 4 hours | 11 hours      | 4 hours | **19 hours** |

## Success Metrics

- Visual consistency score: All expandable sections behave identically
- Color contrast: All text meets WCAG AA (4.5:1 ratio)
- User feedback: Evaluation workflow feels more polished and professional
- Code quality: Reusable components reduce duplication
