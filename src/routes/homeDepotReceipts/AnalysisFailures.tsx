/**
 * @file Displays AI analysis failures and lets the user retake/replace the
 * specific failing images.
 */

import { JSX, useRef } from 'react';
import { Alert, Button, Group, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconCamera } from '@tabler/icons-react';
import { ReceiptAnalysisResult } from '../../lib/receipts/types';

/**
 * Props for {@link AnalysisFailures}.
 */
export interface AnalysisFailuresProps {
  /** The failing results to surface. */
  failures: ReceiptAnalysisResult[];
  /**
   * Replaces a failing image with a freshly captured file.
   * @param imageId - The failing image's id.
   * @param file - The new file to swap in.
   */
  onRetake: (imageId: string, file: File) => void;
}

/**
 * Renders one alert per failing image with a "retake" action.
 *
 * @param props - See {@link AnalysisFailuresProps}.
 * @returns The failures panel, or `null` when there are no failures.
 */
export function AnalysisFailures({
  failures,
  onRetake,
}: AnalysisFailuresProps): JSX.Element | null {
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  if (failures.length === 0) {
    return null;
  }

  return (
    <Stack gap="sm">
      {failures.map((failure) => (
        <Alert
          key={failure.imageId}
          color="red"
          icon={<IconAlertTriangle size={18} />}
          title={`Couldn't read "${failure.fileName}"`}
        >
          <Stack gap="xs">
            <Text size="sm">{failure.error}</Text>
            <Group>
              <input
                ref={(el) => {
                  inputs.current[failure.imageId] = el;
                }}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onRetake(failure.imageId, file);
                  }
                  event.target.value = '';
                }}
              />
              <Button
                size="xs"
                variant="light"
                color="habitatGreen"
                leftSection={<IconCamera size={16} />}
                onClick={() => inputs.current[failure.imageId]?.click()}
              >
                Retake photo
              </Button>
            </Group>
          </Stack>
        </Alert>
      ))}
    </Stack>
  );
}