/**
 * @file Canonical route component for the Home Depot receipt-capture app.
 * Orchestrates the four-step wizard, the AI analysis service, retake flow, and
 * final persistence. Renders inside the predefined app layout/shell.
 */

import { JSX, useMemo, useState } from 'react';
import {
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Stepper,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { analyzeReceiptImages } from '../services/receiptAnalysisService';
import { saveReceiptSubmission } from '../services/receiptSubmissionService';
import { DetailsStep } from './homeDepotReceipts/DetailsStep';
import { CaptureStep } from './homeDepotReceipts/CaptureStep';
import { AnalysisFailures } from './homeDepotReceipts/AnalysisFailures';
import { ReviewStep } from './homeDepotReceipts/ReviewStep';
import { useAuthStore } from '../lib/auth/stores/authStore';
import { useReceiptCaptureStore } from '../lib/receipts/stores/receiptCaptureStore';
import { ReceiptSubmission } from '../lib/receipts/types';

/** Wizard step indices. */
const STEP = {
  DETAILS: 0,
  CAPTURE: 1,
  REVIEW: 2,
} as const;

/**
 * The receipt-capture application route.
 *
 * @returns The full wizard UI.
 */
export function HomeDepotReceiptsRoute(): JSX.Element {
  const [active, setActive] = useState<number>(STEP.DETAILS);

  // Member selection comes from the shared auth store (set by <MemberList />).
  const selectedMember = useAuthStore((s) => s.selectedMember);

  const project = useReceiptCaptureStore((s) => s.project);
  const lotNumbers = useReceiptCaptureStore((s) => s.lotNumbers);
  const phases = useReceiptCaptureStore((s) => s.phases);
  const images = useReceiptCaptureStore((s) => s.images);
  const results = useReceiptCaptureStore((s) => s.results);
  const editableReceipts = useReceiptCaptureStore((s) => s.editableReceipts);
  const isAnalyzing = useReceiptCaptureStore((s) => s.isAnalyzing);
  const isSubmitting = useReceiptCaptureStore((s) => s.isSubmitting);
  const addImages = useReceiptCaptureStore((s) => s.addImages);
  const removeImage = useReceiptCaptureStore((s) => s.removeImage);
  const setAnalyzing = useReceiptCaptureStore((s) => s.setAnalyzing);
  const mergeResults = useReceiptCaptureStore((s) => s.mergeResults);
  const setSubmitting = useReceiptCaptureStore((s) => s.setSubmitting);
  const reset = useReceiptCaptureStore((s) => s.reset);

  /** Failing AI results (those carrying an error). */
  const failures = useMemo(() => results.filter((r) => r.error), [results]);

  /**
   * Validates step 1 fields.
   * @returns `true` when all required details are present.
   */
  const detailsValid = (): boolean =>
    Boolean(selectedMember && project && lotNumbers.trim() && phases.length);

  /**
   * Runs AI analysis on the given images and merges the results, surfacing any
   * failures via notifications.
   *
   * @param imageIds - Optional subset of image ids to analyze; defaults to all.
   */
  const runAnalysis = async (imageIds?: string[]): Promise<void> => {
    const targets = imageIds
      ? images.filter((img) => imageIds.includes(img.id))
      : images;

    if (targets.length === 0) {
      notifications.show({
        color: 'red',
        title: 'No images',
        message: 'Please capture at least one receipt before analyzing.',
      });
      return;
    }

    setAnalyzing(true);
    try {
      const { results: incoming } = await analyzeReceiptImages(targets);
      mergeResults(incoming);

      const failed = incoming.filter((r) => r.error);
      if (failed.length > 0) {
        notifications.show({
          color: 'yellow',
          title: 'Some receipts need a retake',
          message: `${failed.length} of ${incoming.length} image(s) couldn't be read. Please retake them below.`,
        });
      } else {
        notifications.show({
          color: 'habitatGreen',
          title: 'Analysis complete',
          message: 'All receipts were read successfully.',
        });
      }
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Analysis failed',
        message:
          error instanceof Error
            ? error.message
            : 'Unexpected error while analyzing receipts.',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Replaces a failing image with a new capture and re-analyzes just that image.
   *
   * @param imageId - The failing image to replace.
   * @param file - The newly captured file.
   */
  const handleRetake = async (imageId: string, file: File): Promise<void> => {
    removeImage(imageId);
    addImages([file]);
    // The new image gets a fresh id; analyze all currently-unanalyzed images by
    // re-running the full batch is simplest and safe for the stub.
    await runAnalysis();
  };

  /**
   * Advances from the capture step: runs analysis, then moves to review if at
   * least one receipt parsed successfully.
   */
  const handleAnalyzeAndContinue = async (): Promise<void> => {
    await runAnalysis();
    // Re-read latest store state for the decision.
    const latest = useReceiptCaptureStore.getState();
    if (latest.editableReceipts.length > 0) {
      setActive(STEP.REVIEW);
    }
  };

  /**
   * Persists the completed submission via the stub service.
   */
  const handleSubmit = async (): Promise<void> => {
    const submission: ReceiptSubmission = {
      member: selectedMember
        ? {
            id: selectedMember.id,
            name: selectedMember.displayName,
            email: selectedMember.mail ?? null,
          }
        : null,
      project: project ?? '',
      lotNumbers,
      phases,
      receipts: editableReceipts,
      submittedAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      const { id } = await saveReceiptSubmission(submission);
      notifications.show({
        color: 'habitatGreen',
        title: 'Submitted',
        message: `Your receipts were saved (ref: ${id}).`,
      });
      reset();
      setActive(STEP.DETAILS);
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Save failed',
        message:
          error instanceof Error
            ? error.message
            : 'Unexpected error while saving your submission.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container size="lg" py="lg">
      <Paper withBorder radius="md" p="lg">
        <Stepper active={active} onStepClick={setActive} color="habitatGreen">
          <Stepper.Step
            label="Details"
            description="Member & project"
            allowStepSelect={false}
          >
            <Stack mt="lg">
              <DetailsStep />
            </Stack>
          </Stepper.Step>

          <Stepper.Step
            label="Capture"
            description="Receipt images"
            allowStepSelect={false}
          >
            <Stack mt="lg">
              <CaptureStep />
              {failures.length > 0 && (
                <AnalysisFailures
                  failures={failures}
                  onRetake={handleRetake}
                />
              )}
            </Stack>
          </Stepper.Step>

          <Stepper.Step
            label="Review"
            description="Edit & submit"
            allowStepSelect={false}
          >
            <Stack mt="lg">
              <ReviewStep />
            </Stack>
          </Stepper.Step>
        </Stepper>

        <Group justify="space-between" mt="xl">
          <Button
            variant="default"
            disabled={active === STEP.DETAILS || isAnalyzing || isSubmitting}
            onClick={() => setActive((s) => Math.max(STEP.DETAILS, s - 1))}
          >
            Back
          </Button>

          {active === STEP.DETAILS && (
            <Button
              color="habitatGreen"
              disabled={!detailsValid()}
              onClick={() => setActive(STEP.CAPTURE)}
            >
              Next
            </Button>
          )}

          {active === STEP.CAPTURE && (
            <Button
              color="habitatGreen"
              disabled={images.length === 0 || isAnalyzing}
              leftSection={isAnalyzing ? <Loader size={16} /> : undefined}
              onClick={handleAnalyzeAndContinue}
            >
              {isAnalyzing ? 'Analyzing…' : 'Analyze & continue'}
            </Button>
          )}

          {active === STEP.REVIEW && (
            <Button
              color="habitatGreen"
              loading={isSubmitting}
              disabled={editableReceipts.length === 0}
              onClick={handleSubmit}
            >
              Submit
            </Button>
          )}
        </Group>
      </Paper>
    </Container>
  );
}