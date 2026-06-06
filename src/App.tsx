import { useEffect } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import { RouterProvider, Routes } from './lib/router/HashRouter';

import { Center, Loader } from '@mantine/core';
import { loginRequest } from './lib/auth/config/msalConfig';
import { useAuthStore } from './lib/auth/stores/authStore';
import { fetchMembers } from './lib/auth/services/graph';
import { Login } from './lib/auth/components/Login';
import { AppLayout } from './lib/layout/AppLayout';
import { NotFound } from './routes';
import { appRoutes } from './routes/registry';

/**
 * Top-level application component.
 */
export function App() {
  const { instance, accounts, inProgress } = useMsal();
  const { accessToken, setAccount, setAccessToken, setMembers } = useAuthStore();

  // 1. Acquire token after MSAL has an account
  useEffect(() => {
    if (!accounts[0]) return;
    setAccount(accounts[0]);

    instance
      .acquireTokenSilent({ ...loginRequest, account: accounts[0] })
      .then((res) => setAccessToken(res.accessToken))
      .catch(() => instance.acquireTokenRedirect(loginRequest));
  }, [accounts, instance, setAccount, setAccessToken]);

  // 2. Once token is in the store, load members
  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    fetchMembers(accessToken)
      .then((members) => {
        if (!cancelled) setMembers(members);
      })
      .catch((err) => console.error('Failed to load members:', err));

    return () => {
      cancelled = true;
    };
  }, [accessToken, setMembers]);


  if (inProgress === 'startup' || inProgress === 'handleRedirect') {
    return (
      <Center h="100vh">
        <Loader color="habitatGreen" />
      </Center>
    );
  }

  return (
    <>
      <UnauthenticatedTemplate>
        <Login title='Habitat Home Depot Receipt' desc='Building hope through staff productivity.'/>
      </UnauthenticatedTemplate>
      <AuthenticatedTemplate>
        <RouterProvider>
          <AppLayout>
            <Routes routes={appRoutes} notFound={<NotFound />} />
          </AppLayout>
        </RouterProvider>
      </AuthenticatedTemplate>
    </>
  );
}