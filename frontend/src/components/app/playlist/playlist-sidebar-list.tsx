import { CSSProperties, useState } from 'react';
import { Loader, ScrollArea, Stack, Text, useMantineTheme } from '@mantine/core';
import type { SpotifyPlaylist } from '@/types/spotify';

interface PlaylistSidebarListProps {
  playlists: SpotifyPlaylist[];
  currentId: string;
  onSelect: (playlistId: string) => void;
  style?: CSSProperties;
  scrollHeight?: number | string;
  loading?: boolean;
}

export const PlaylistSidebarList = ({
  playlists,
  currentId,
  onSelect,
  style,
  scrollHeight = 'calc(100vh - 120px)',
  loading = false,
}: PlaylistSidebarListProps) => {
  const theme = useMantineTheme();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const colorScheme = (theme as any).colorScheme === 'dark' ? 'dark' : 'light';
  const hoverBg = colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[1];
  const activeBg = colorScheme === 'dark' ? 'rgba(51, 154, 240, 0.25)' : 'rgba(51, 154, 240, 0.12)';
  const baseColor = colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7];
  const hoverColor = colorScheme === 'dark' ? theme.colors.gray[2] : theme.colors.dark[7];
  const activeColor = colorScheme === 'dark' ? theme.colors.blue[2] : theme.colors.blue[7];

  return (
    <Stack
      gap="sm"
      style={{
        width: 260,
        minWidth: 260,
        flex: '0 0 260px',
        height: scrollHeight,
        position: 'sticky',
        top: 'calc(var(--app-shell-header-height, 50px) + 16px)',
        alignSelf: 'flex-start',
        ...(style ?? {}),
      }}
    >
      <Text fw={600} size="sm">
      </Text>
      <ScrollArea style={{ flex: 1 }} type="hover" offsetScrollbars>
        {playlists.length === 0 ? (
          <Stack gap="xs" align="center" justify="center" style={{ height: '100%' }}>
            {loading ? (
              <>
                <Loader size="sm" />
                <Text size="xs" c="dimmed">
                  Loading playlists...
                </Text>
              </>
            ) : (
              <Text size="xs" c="dimmed">
                No playlists available
              </Text>
            )}
          </Stack>
        ) : (
          <Stack gap="xs" component="nav">
            {playlists.map((playlist) => {
              const isCurrent = playlist.id === currentId;
              const isHovered = hoveredId === playlist.id;

              const backgroundColor = isCurrent
                ? activeBg
                : isHovered
                ? hoverBg
                : 'transparent';

              const textColor = isCurrent
                ? activeColor
                : isHovered
                ? hoverColor
                : baseColor;

              return (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => onSelect(playlist.id)}
                  onMouseEnter={() => setHoveredId(playlist.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    backgroundColor,
                    color: textColor,
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    border: 'none',
                    borderRadius: theme.radius.md,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    fontSize: theme.fontSizes.sm,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease, color 150ms ease',
                  }}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  <Text size="sm" fw={isCurrent ? 600 : 500} lineClamp={1} style={{ color: 'inherit' }}>
                    {playlist.name}
                  </Text>
                </button>
              );
            })}
          </Stack>
        )}
      </ScrollArea>
    </Stack>
  );
};
