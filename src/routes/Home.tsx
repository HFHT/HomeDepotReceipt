import { Container, Stack, Title, Text, Button, Paper, Group } from '@mantine/core';
import { IconCamera, IconList } from '@tabler/icons-react';
import { navigate } from '../lib/router/HashRouter';
import { useCurrentAccount } from '../lib/auth/components/MicrosoftAuth';
import { MemberList } from '../lib/auth/components/MemberList';

/**
 * Authenticated landing page.
 */
export function Home() {
  const account = useCurrentAccount();
  return (
    <Container size="sm">
      <Stack>
        <Title order={3}>Welcome, {account?.name?.split(' ')[0] ?? 'there'}</Title>
        <Text c="dimmed">Skeleton Habitat Mobile First Web Application.</Text>

        <Paper withBorder p="lg" radius="md">
          <Stack>
            <Group>
              <IconCamera size={24} />
              <Title order={5}>Custom Card</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Card contents.
            </Text>
            <Button onClick={() => navigate('/project')}>Start</Button>
          </Stack>
        </Paper>

        <Paper withBorder p="lg" radius="md">
          <Stack>
            <Group>
              <IconList size={24} />
              <Title order={5}>Another Card</Title>
            </Group>
            <Text size="sm" c="dimmed">
              More card contents.
            </Text>
            <Button variant="light" onClick={() => navigate('/receipts')}>
              View
            </Button>
          </Stack>
        </Paper>
        <MemberList />

      </Stack>
    </Container>
  );
}