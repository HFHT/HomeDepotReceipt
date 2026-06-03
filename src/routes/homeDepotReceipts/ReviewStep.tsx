/**
 * @file Step 4 of the wizard: present AI-extracted values in an editable,
 * mobile-first form. Both scalar fields and line items retain their original
 * (AI) value alongside the current (edited) value.
 */

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  NumberInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { LineItemFieldKey, ReceiptFieldKey } from '../../lib/receipts/types';
import { JSX } from 'react';
import { useReceiptCaptureStore } from '../../lib/receipts/stores/receiptCaptureStore';


/** Display labels for each editable receipt-level field. */
const FIELD_LABELS: Record<ReceiptFieldKey, string> = {
  storeNumber: 'Store #',
  purchaseDate: 'Purchase date',
  receiptNumber: 'Receipt #',
  subtotal: 'Subtotal',
  tax: 'Tax',
  total: 'Total',
  paymentMethod: 'Payment method',
};

/** Order in which receipt-level fields are rendered. */
const FIELD_ORDER: ReceiptFieldKey[] = [
  'receiptNumber',
  'storeNumber',
  'purchaseDate',
  'subtotal',
  'tax',
  'total',
  'paymentMethod',
];

/** Labels for line-item fields. */
const LINE_ITEM_LABELS: Record<LineItemFieldKey, string> = {
  sku: 'SKU',
  description: 'Description',
  quantity: 'Qty',
  unitPrice: 'Unit price',
  totalPrice: 'Line total',
};

/** Line-item fields treated as numeric inputs. */
const NUMERIC_LINE_FIELDS: ReadonlySet<LineItemFieldKey> = new Set([
  'quantity',
  'unitPrice',
  'totalPrice',
]);

/**
 * Renders an "edited" badge when the current value differs from the original.
 *
 * @param props - The base label and whether the value changed.
 * @returns A label node including an optional badge.
 */
function FieldLabel({
  label,
  changed,
}: {
  label: string;
  changed: boolean;
}): JSX.Element {
  return (
    <Group gap={6} wrap="nowrap">
      <span>{label}</span>
      {changed && (
        <Badge size="xs" color="habitatBlue" variant="light">
          edited
        </Badge>
      )}
    </Group>
  );
}

/**
 * Renders the review/edit step. Cards stack vertically; every input is
 * full-width and wraps to a single column on small screens.
 *
 * @returns The review/edit step.
 */
export function ReviewStep(): JSX.Element {
  const receipts = useReceiptCaptureStore((s) => s.editableReceipts);
  const updateReceiptField = useReceiptCaptureStore(
    (s) => s.updateReceiptField
  );
  const updateLineItemField = useReceiptCaptureStore(
    (s) => s.updateLineItemField
  );
  const addLineItem = useReceiptCaptureStore((s) => s.addLineItem);
  const removeLineItem = useReceiptCaptureStore((s) => s.removeLineItem);

  if (receipts.length === 0) {
    return (
      <Text c="dimmed">
        No analyzed receipts to review yet. Capture and analyze images first.
      </Text>
    );
  }

  return (
    <Stack gap="lg">
      <Title order={4}>Review &amp; edit</Title>

      {receipts.map((receipt) => (
        <Card key={receipt.imageId} withBorder radius="md" padding="md">
          <Text fw={600} mb="sm" truncate="end" title={receipt.fileName}>
            {receipt.fileName}
          </Text>

          {/* Receipt-level fields — single column on mobile, two columns ≥ sm. */}
          <Stack gap="sm">
            {FIELD_ORDER.map((key) => {
              const field = receipt.fields[key];
              const changed = field.currentValue !== field.initialValue;
              return (
                <TextInput
                  key={key}
                  label={
                    <FieldLabel label={FIELD_LABELS[key]} changed={changed} />
                  }
                  value={field.currentValue}
                  onChange={(event) =>
                    updateReceiptField(
                      receipt.imageId,
                      key,
                      event.currentTarget.value
                    )
                  }
                  description={
                    changed ? `Original: ${field.initialValue || '—'}` : undefined
                  }
                />
              );
            })}
          </Stack>

          <Divider
            my="md"
            label={
              <Group gap={6}>
                <Text size="sm" fw={500}>
                  Line items
                </Text>
                <Badge size="xs" variant="light" color="gray">
                  {receipt.lineItems.length}
                </Badge>
              </Group>
            }
            labelPosition="left"
          />

          {/* Each line item is its own card with stacked, full-width inputs. */}
          <Stack gap="sm">
            {receipt.lineItems.map((item, index) => (
              <Card
                key={item.id}
                withBorder
                radius="sm"
                padding="sm"
                bg="var(--mantine-color-gray-0)"
              >
                <Group justify="space-between" mb="xs" wrap="nowrap">
                  <Group gap={6} wrap="nowrap">
                    <Text size="sm" fw={500}>
                      Item {index + 1}
                    </Text>
                    {item.isManual && (
                      <Badge size="xs" color="habitatGreen" variant="light">
                        added
                      </Badge>
                    )}
                  </Group>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={`Remove item ${index + 1}`}
                    onClick={() => removeLineItem(receipt.imageId, item.id)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>

                <Stack gap="xs">
                  {(Object.keys(LINE_ITEM_LABELS) as LineItemFieldKey[]).map(
                    (fieldKey) => {
                      const field = item.fields[fieldKey];
                      const changed =
                        field.currentValue !== field.initialValue;
                      const label = (
                        <FieldLabel
                          label={LINE_ITEM_LABELS[fieldKey]}
                          changed={changed}
                        />
                      );
                      const description = changed
                        ? `Original: ${field.initialValue || '—'}`
                        : undefined;

                      if (NUMERIC_LINE_FIELDS.has(fieldKey)) {
                        return (
                          <NumberInput
                            key={fieldKey}
                            label={label}
                            description={description}
                            value={
                              field.currentValue === ''
                                ? ''
                                : Number(field.currentValue)
                            }
                            onChange={(value) =>
                              updateLineItemField(
                                receipt.imageId,
                                item.id,
                                fieldKey,
                                value === '' ? '' : String(value)
                              )
                            }
                            min={0}
                            decimalScale={fieldKey === 'quantity' ? 0 : 2}
                            thousandSeparator=","
                            prefix={fieldKey === 'quantity' ? undefined : '$'}
                            hideControls
                          />
                        );
                      }

                      return (
                        <TextInput
                          key={fieldKey}
                          label={label}
                          description={description}
                          value={field.currentValue}
                          onChange={(event) =>
                            updateLineItemField(
                              receipt.imageId,
                              item.id,
                              fieldKey,
                              event.currentTarget.value
                            )
                          }
                        />
                      );
                    }
                  )}
                </Stack>
              </Card>
            ))}

            <Button
              variant="light"
              color="habitatGreen"
              leftSection={<IconPlus size={16} />}
              onClick={() => addLineItem(receipt.imageId)}
              fullWidth
            >
              Add line item
            </Button>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}