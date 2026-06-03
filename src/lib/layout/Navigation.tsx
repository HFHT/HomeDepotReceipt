import { ActionIcon, Group, NavLink, Stack, Text, UnstyledButton } from "@mantine/core";
import { navigate, useCurrentPath } from "../router/HashRouter";
import { IconHome, IconSettings } from "@tabler/icons-react";
import { navRoutes } from "../../routes/registry";

/**
 * Represents a single navigation destination shared by both the desktop and
 * mobile navigation variants.
 *
 * @typedef {Object} NavItem
 * @property {string} label - Human-readable text shown beneath/next to the icon.
 * @property {import("@tabler/icons-react").Icon} icon - Tabler icon component rendered for the item.
 * @property {string} path - Hash-router path navigated to when the item is selected (e.g. `'/'`).
 * @property {string} key - Stable unique identifier used for React keys and active-state checks.
 */

/**
 * Static list of primary navigation destinations rendered by both
 * {@link DesktopNavigation} and {@link MobileNavigation}.
 *
 * @type {NavItem[]}
 */
const navItems = [
    { label: 'Home', icon: IconHome, path: '/', key: 'home' },
    { label: 'Settings', icon: IconSettings, path: '/settings', key: 'settings' }
];

/**
 * Desktop navigation menu rendered as a traditional vertical (left-side)
 * navigation list using Mantine {@link NavLink} components.
 *
 * Intended for larger viewports where horizontal space is available. Each entry
 * in {@link navItems} is rendered as a clickable link that highlights when its
 * `path` matches the active route and triggers {@link navigate} on click.
 *
 * @component
 * @returns {JSX.Element} A vertically stacked list of navigation links.
 *
 * @example
 * // Inside a desktop layout sidebar
 * <DesktopNavigation />
 */
export function DesktopNavigation() {
    const path = useCurrentPath();

    return (
        <Stack gap="xs">
            {navRoutes.map(({ path: to, nav }) => {
                console.log(path, to)
                return (
                    <NavLink
                        key={to}
                        label={nav.label}
                        leftSection={<nav.icon size={18} />}
                        active={path === to}            // ✅ compare path to path
                        onClick={() => navigate(to)}
                    />
                )
            }

            )}
        </Stack>
    )
}

/**
 * Mobile navigation bar rendered as a horizontal row of icon + label buttons,
 * designed to sit along the bottom of the screen (mobile-first design).
 *
 * Each entry in {@link navItems} is rendered as an {@link UnstyledButton} that
 * fills an equal share of the available width. The active item is emphasized
 * with a filled `habitatGreen` icon and bold green label, while inactive items
 * use a subtle gray treatment. Selecting an item triggers {@link navigate}.
 *
 * @component
 * @returns {JSX.Element} A full-width horizontal bar of navigation buttons.
 *
 * @example
 * // Inside a fixed bottom app bar on mobile layouts
 * <MobileNavigation />
 */
export function MobileNavigation() {
    const path = useCurrentPath();

    return (
        <Group h="100%" justify="space-around" align="center" gap={0}>
            {navRoutes.map(({ path: to, nav }) => {
                return (
                    <UnstyledButton
                        key={to}
                        onClick={() => navigate(to)}
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '8px 4px',
                            height: '100%'
                        }}
                    >
                        <ActionIcon
                            size="lg"
                            variant={path === to ? 'filled' : 'subtle'}
                            color={path === to ? 'habitatGreen' : 'gray'}
                            component="div"
                            mx="auto"
                        >
                            <nav.icon size={20} />
                        </ActionIcon>
                        <Text
                            size="xs"
                            fw={path === to ? 700 : 400}
                            c={path === to ? 'habitatGreen' : 'dimmed'}
                            mt={2}
                        >
                            {nav.label}
                        </Text>
                    </UnstyledButton>
                );
            })}
        </Group>
    )
}