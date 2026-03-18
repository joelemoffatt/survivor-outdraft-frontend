import { NavigationItem } from '../components/shared/ResponsiveNavigation';

const playerNavigationItems: NavigationItem[] = [
  { name: 'index', label: 'Home', href: '/(player)/', icon: 'home' },
  { name: 'team', label: 'My Team', href: '/(player)/team', icon: 'people' },
  { name: 'group', label: 'Group', href: '/(player)/group', icon: 'people-circle' },
  { name: 'more', label: 'More', href: '/more', icon: 'ellipsis-horizontal' },
];

const adminNavigationItems: NavigationItem[] = [
  { name: 'index', label: 'Home', href: '/admin', icon: 'home' },
  { name: 'social', label: 'Social', href: '/admin/social', icon: 'people' },
  { name: 'game', label: 'Game', href: '/admin/game', icon: 'game-controller' },
  { name: 'more', label: 'More', href: '/more', icon: 'ellipsis-horizontal' },
];

export function getNavigationConfig(isAdminView: boolean) {
  if (isAdminView) {
    return {
      items: adminNavigationItems,
      baseRoute: '/admin',
      logo: 'construct',
    };
  }

  return {
    items: playerNavigationItems,
    baseRoute: '/(player)',
    logo: 'flag',
  };
}
