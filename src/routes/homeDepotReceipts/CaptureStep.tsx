/**
 * @file Step 2 of the wizard: capture/select receipt images. Supports both file
 * selection and direct camera capture (mobile) via a hidden file input.
 */

import { JSX, useRef } from 'react';
import {
  ActionIcon,
  Button,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Card,
} from '@mantine/core';
import { IconCamera, IconPhotoUp, IconTrash } from '@tabler/icons-react';
import { useReceiptCaptureStore } from '../../lib/receipts/stores/receiptCaptureStore';

/**
 * Renders the image-capture step, allowing the user to add multiple images and
 * remove any before analysis.
 *
 * @returns The capture step.
 */
export function CaptureStep(): JSX.Element {
  const images = useReceiptCaptureStore((s) => s.images);
  const addImages = useReceiptCaptureStore((s) => s.addImages);
  const removeImage = useReceiptCaptureStore((s) => s.removeImage);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles a file input change, forwarding selected files to the store.
   * @param event - The input change event.
   */
  const handleFiles = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const files = event.target.files;
    if (files && files.length > 0) {
      addImages(Array.from(files));
    }
    // Reset so the same file can be re-selected later.
    event.target.value = '';
  };

  return (
    <Stack gap="md">
      <Title order={4}>Capture receipts</Title>
      <Text c="dimmed" size="sm">
        Take a photo of each Home Depot receipt or upload existing images.
      </Text>

      <Group>
        <Button
          leftSection={<IconCamera size={18} />}
          variant="filled"
          color="habitatGreen"
          onClick={() => cameraInputRef.current?.click()}
        >
          Take photo
        </Button>
        <Button
          leftSection={<IconPhotoUp size={18} />}
          variant="light"
          color="habitatBlue"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload images
        </Button>
      </Group>

      {/* Hidden inputs: camera capture vs. multi-file selection. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleFiles}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFiles}
      />

      {images.length > 0 && (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
          {images.map((image) => (
            <Card key={image.id} padding="xs" withBorder radius="md">
              <Card.Section>
                <Image
                  src={image.previewUrl}
                  alt={image.fileName}
                  height={140}
                  fit="cover"
                />
              </Card.Section>
              <Group justify="space-between" mt="xs" wrap="nowrap">
                <Text size="xs" truncate="end" title={image.fileName}>
                  {image.fileName}
                </Text>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label={`Remove ${image.fileName}`}
                  onClick={() => removeImage(image.id)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}