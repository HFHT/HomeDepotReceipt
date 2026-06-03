import { type ReactNode } from 'react';
import {
  AppShell
} from '@mantine/core';

import { DesktopNavigation, MobileNavigation } from './Navigation';
import { Header } from './Header';

/**
 * Props for the {@link AppLayout} component.
 *
 * @interface AppLayoutProps
 */
interface AppLayoutProps {
  /**
   * The page content rendered within the layout's main content area.
   */
  children: ReactNode;
}

/**
 * Top-level application shell that provides a responsive, mobile-first layout
 * for the Habitat for Humanity SPA.
 *
 * @remarks
 * This component wraps Mantine's {@link https://mantine.dev/core/app-shell/ | AppShell}
 * to deliver an adaptive navigation experience that changes based on viewport size:
 *
 * - **Mobile (below the `sm` breakpoint):** Navigation is presented as a fixed
 *   bottom button bar via {@link MobileNavigation}, rendered in the footer.
 *   The left-hand navbar is collapsed and hidden.
 * - **Desktop (`sm` breakpoint and above):** Navigation switches to a traditional
 *   260px-wide left sidebar via {@link DesktopNavigation}, while the bottom
 *   button bar is hidden.
 *
 * The {@link Header} is always visible at the top and styled with the Habitat for
 * Humanity brand gradient (deep blue `#00457c` to green `#76bc21`).
 *
 * The main content area reserves bottom padding equal to the footer height so that
 * content is never obscured by the mobile bottom navigation bar.
 *
 * @example
 * ```tsx
 * <AppLayout>
 *   <DashboardPage />
 * </AppLayout>
 * ```
 *
 * @param props - The component props.
 * @param props.children - The page content to display in the main region.
 * @returns The responsive application shell wrapping the provided content.
 */
export function AppLayout({ children }: AppLayoutProps) {

  return (

    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: true, desktop: false }
      }}
      footer={{ height: 64, collapsed: false }}
      padding={{ base: 'xs', sm: 'md' }}
    >
      <AppShell.Header
        style={{
          background: 'linear-gradient(90deg, #00457c 0%, #76bc21 100%)',
          border: 'none'
        }}
      >
        <Header />
      </AppShell.Header>

      <AppShell.Navbar p="md" visibleFrom="sm">
        <DesktopNavigation />
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          background: '#f8f9fa',
          paddingBottom: 'calc(64px + var(--app-shell-padding))'
        }}
      >{children}
      </AppShell.Main>
      {/* MOBILE BOTTOM NAV */}
      <AppShell.Footer
        hiddenFrom="sm"
        style={{
          background: 'white',
          borderTop: '1px solid #e9ecef'
        }}
      >
        <MobileNavigation />
      </AppShell.Footer>
    </AppShell>
  );
}