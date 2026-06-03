/**
 * @file Static option lists for the receipt-capture form.
 *
 * STAGING NOTE: these are placeholders. If projects/phases should be
 * data-driven, add a `listProjects` endpoint to src/api and load them in a
 * service rather than hardcoding here.
 */

import type { ComboboxData } from '@mantine/core';

/** Project / subdivision options for the Select control. */
export const PROJECT_OPTIONS: ComboboxData = [
  'Maple Ridge Subdivision',
  'Cedar Crossing',
  'Oakwood Commons',
  'Riverbend Phase Development',
];

/** Phase options for the MultiSelect control. */
export const PHASE_OPTIONS: ComboboxData = [
  { value: 'phase-1', label: 'Phase 1 — Site Prep' },
  { value: 'phase-2', label: 'Phase 2 — Framing' },
  { value: 'phase-3', label: 'Phase 3 — Mechanical' },
  { value: 'phase-4', label: 'Phase 4 — Finishing' },
];