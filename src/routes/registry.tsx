import type { ReactNode } from 'react';
import type { Icon } from '@tabler/icons-react';
import { IconHome, IconReceipt, IconSettings } from '@tabler/icons-react';
import { Home, Settings } from '.';
import { HomeDepotReceiptsRoute } from './HomeDepotReceiptsRoute';

/**
 * Navigation metadata attached to a route when it should appear in the
 * primary navigation (desktop sidebar / mobile bottom bar).
 *
 * @typedef {Object} NavMeta
 * @property {string} label - Human-readable text shown in the nav.
 * @property {Icon} icon - Tabler icon component rendered for the item.
 * @property {number} [order] - Optional sort order within the nav.
 */
export interface NavMeta {
  label: string;
  icon: Icon;
  order?: number;
}

/**
 * Single source of truth describing an application route: its hash path,
 * the element to render, and optional navigation metadata.
 *
 * @typedef {Object} AppRoute
 * @property {string} path - Hash-router path (e.g. `'/settings'`).
 * @property {ReactNode} element - Element rendered when the route is active.
 * @property {NavMeta} [nav] - Present only if the route appears in the nav.
 */
export interface AppRoute {
  path: string;
  element: ReactNode;
  nav?: NavMeta;
}

/**
 * The canonical list of application routes. Both the router (for rendering)
 * and the navigation components (for menu items) are derived from this array,
 * so route information lives in exactly one place.
 *
 * @type {AppRoute[]}
 */
export const appRoutes: AppRoute[] = [
  {
    path: '/',
    element: <Home />,
    nav: { label: 'Home', icon: IconHome, order: 0 },
  },
  {
    path: 'home-depot-receipts',
    element: <HomeDepotReceiptsRoute />,
    nav: {
      label: 'Home Depot Receipts',
      icon: IconReceipt,
      order: 40, // adjust to position within the existing menu
    },
  },
  {
    path: '/settings',
    element: <Settings />,
    nav: { label: 'Settings', icon: IconSettings, order: 1 },
  },
];

/**
 * Routes that should be rendered in the primary navigation, in display order.
 *
 * @type {(AppRoute & { nav: NavMeta })[]}
 */
export const navRoutes = appRoutes
  .filter((r): r is AppRoute & { nav: NavMeta } => Boolean(r.nav))
  .sort((a, b) => (a.nav.order ?? 0) - (b.nav.order ?? 0));