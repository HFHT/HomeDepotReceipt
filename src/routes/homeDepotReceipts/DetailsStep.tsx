/**
 * @file Step 1 of the receipt-capture wizard: collects member, project,
 * lots/project numbers, and phases.
 */

import { Select, Stack, Textarea, MultiSelect, Title } from '@mantine/core';
import { PHASE_OPTIONS, PROJECT_OPTIONS } from './options';
import { useReceiptCaptureStore } from '../../lib/receipts/stores/receiptCaptureStore';
import { MemberList } from '../../lib/auth/components/MemberList';
import { JSX } from 'react';

/**
 * Renders the workflow's first step. `MemberList` writes the chosen member to
 * the shared auth store (`selectedMember`); the remaining fields are stored in
 * the receipt-capture feature store.
 *
 * @returns The details capture step.
 */
export function DetailsStep(): JSX.Element {
  const project = useReceiptCaptureStore((s) => s.project);
  const setProject = useReceiptCaptureStore((s) => s.setProject);
  const lotNumbers = useReceiptCaptureStore((s) => s.lotNumbers);
  const setLotNumbers = useReceiptCaptureStore((s) => s.setLotNumbers);
  const phases = useReceiptCaptureStore((s) => s.phases);
  const setPhases = useReceiptCaptureStore((s) => s.setPhases);

  return (
    <Stack gap="md">
      <Title order={4}>Your details</Title>

      {/* Sets selectedMember in the shared auth store. */}
      <MemberList />

      <Select
        label="Project / Subdivision"
        placeholder="Select a project"
        data={PROJECT_OPTIONS}
        value={project}
        onChange={setProject}
        searchable
        required
      />

      <Textarea
        label="Lots / Project Numbers"
        placeholder="e.g. Lot 12, Lot 13, PRJ-2025-004"
        value={lotNumbers}
        onChange={(event) => setLotNumbers(event.currentTarget.value)}
        autosize
        minRows={2}
        required
      />

      <MultiSelect
        label="Phases"
        placeholder="Select one or more phases"
        data={PHASE_OPTIONS}
        value={phases}
        onChange={setPhases}
        searchable
        clearable
        required
      />
    </Stack>
  );
}