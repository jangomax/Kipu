import { useEffect, useMemo, useState } from 'react';
import {
  AppShell,
  Autocomplete,
  Title,
  ActionIcon,
  Avatar,
  Menu,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import { IconArrowRight, IconSearch, IconLogout2, IconMoonStars, IconSun } from '@tabler/icons-react';
import { useSpotifyUser } from '@/hooks/useSpotifyUser';
import { queryClient } from '@/util/api-helper';
import { clearTokens } from '@/util/auth';
import router from '@/routes';

export const AppNavbar = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { data: user } = useSpotifyUser();
  const initialLocation = router.state.location;
  const initialQuery = new URLSearchParams(initialLocation?.search ?? '').get('query') ?? '';
  const [value, setValue] = useState(initialQuery);
  const [showSearch, setShowSearch] = useState(
    initialLocation?.pathname?.startsWith('/app') ?? false,
  );

  const profileImage = user?.images?.[0]?.url;
  const profileFallback = useMemo(
    () => user?.displayName?.trim().charAt(0).toUpperCase() || 'U',
    [user?.displayName],
  );

  useEffect(() => {
    const handleLocationChange = ({
      location,
    }: {
      location: { pathname: string; search?: string };
    }) => {
      const params = new URLSearchParams(location.search ?? '');
      setValue(params.get('query') ?? '');
      setShowSearch(location.pathname?.startsWith('/app') ?? false);
    };

    const unsubscribe = router.subscribe(handleLocationChange);

    // Ensure initial state is in sync even if no navigation occurs after mount
    handleLocationChange({ location: router.state.location });

    return unsubscribe;
  }, []);

  const handleSearch = () => {
    const trimmed = value.trim();

    if (!trimmed) {
      router.navigate('/app');
      return;
    }

    router.navigate(`/app?query=${encodeURIComponent(trimmed)}`);
  };

  const handleLogout = () => {
    clearTokens();
    queryClient.clear();
    router.navigate('/');
  };

  const handleToggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AppShell.Header
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        gap: '0.5rem',
      }}
    >
      <Title order={2}>Kipu</Title>
      {showSearch && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Autocomplete
            placeholder="Search for songs"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            data={[]}
            value={value}
            onChange={setValue}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSearch();
              }
            }}
          rightSection={
            <ActionIcon
              aria-label="Search"
              variant="subtle"
              color="gray"
              onClick={handleSearch}
            >
              <IconArrowRight size={16} stroke={1.5} />
            </ActionIcon>
          }
          styles={{
            root: {
              width: 'min(480px, 70vw)',
            },
            input: {
              fontSize: '0.875rem',
            },
          }}
        />
      </div>
      )}
      {showSearch && user && (
        <Menu width={190} position="bottom-end" withinPortal>
          <Menu.Target>
            <UnstyledButton aria-label="Open profile menu">
              <Avatar src={profileImage} radius="lg" size={32} name={user.displayName}>
                {profileFallback}
              </Avatar>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>{user.displayName || 'Spotify user'}</Menu.Label>
            <Menu.Item
              leftSection={colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoonStars size={16} />}
              onClick={handleToggleColorScheme}
            >
              {colorScheme === 'dark' ? 'Light mode' : 'Dark mode'}
            </Menu.Item>
            <Menu.Item color="red" leftSection={<IconLogout2 size={16} />} onClick={handleLogout}>
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}
    </AppShell.Header>
  );
};
