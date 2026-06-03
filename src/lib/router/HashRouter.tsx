import {
  type ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
} from 'react';

/**
 * Route definition: a hash path and the element to render.
 */
export interface RouteConfig {
  path: string;
  element: ReactNode;
}

interface RouterContextValue {
  path: string;
}

/**
 * Null default lets {@link useCurrentPath} detect when it is used outside a
 * {@link RouterProvider}, instead of silently returning a fake `'/'`.
 */
const RouterContext = createContext<RouterContextValue | null>(null);

/**
 * Reads the current hash path (without the leading "#").
 * Defaults to "/" when no hash is set.
 */
function getCurrentHashPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/';
}

/**
 * Programmatically navigates to a hash-based route.
 *
 * @param path - The target path, e.g. "/settings".
 */
export function navigate(path: string): void {
  window.location.hash = path;
}

/**
 * Hook returning the current hash path.
 *
 * @throws If called outside a {@link RouterProvider}.
 */
export function useCurrentPath(): string {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useCurrentPath must be used within a <RouterProvider>');
  }
  return ctx.path;
}

/**
 * Owns the hash-based routing state and exposes it via context.
 *
 * Must wrap **everything** that needs to know the current route — including
 * navigation chrome (sidebars, bottom bars) and the {@link Routes} renderer —
 * so they all share a single source of truth.
 *
 * @param props.children - The subtree that can read the current path.
 *
 * @example
 * <RouterProvider>
 *   <AppLayout>
 *     <Routes routes={appRoutes} notFound={<NotFound />} />
 *   </AppLayout>
 * </RouterProvider>
 */
export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(getCurrentHashPath());

  useEffect(() => {
    const handler = () => setPath(getCurrentHashPath());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return (
    <RouterContext.Provider value={{ path }}>
      {children}
    </RouterContext.Provider>
  );
}

/**
 * Renders the first matching route element, or `notFound` when none match.
 * Reads the active path from the surrounding {@link RouterProvider}.
 *
 * @param props.routes - Candidate routes to match against the active path.
 * @param props.notFound - Fallback element when no route matches.
 */
export function Routes({
  routes,
  notFound,
}: {
  routes: RouteConfig[];
  notFound?: ReactNode;
}) {
  const path = useCurrentPath();
  const match = routes.find((r) => r.path === path);
  return <>{match ? match.element : notFound ?? null}</>;
}