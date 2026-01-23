import { RouterProvider } from 'react-router';
import router from '@/routes';
import { AppShell, Box, Container } from '@mantine/core';
import { AppNavbar } from './components/navbar';
import { useInitializeMobileDetection } from './stores/useUiStore';
import { SpotifyPlayer } from '@/components/player';
import { useEffect, useState } from 'react';

function App() {
  useInitializeMobileDetection();
  const [showPlayer, setShowPlayer] = useState(
    () => sessionStorage.getItem('kipu_player_visible') === '1',
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ visible: boolean }>).detail;
      if (detail?.visible !== undefined) {
        setShowPlayer(detail.visible);
      }
    };

    window.addEventListener('kipu-player-visibility', handler);
    return () => window.removeEventListener('kipu-player-visibility', handler);
  }, []);

  const handleClosePlayer = () => {
    sessionStorage.setItem('kipu_player_visible', '0');
    setShowPlayer(false);
    window.dispatchEvent(new CustomEvent('kipu-player-visibility', { detail: { visible: false } }));
  };

  return (
    <>
      <AppShell padding="md" header={{ height: 50 }}>
        <AppNavbar />
        <AppShell.Main style={{ paddingBottom: '140px' }}>
          <RouterProvider router={router} />
        </AppShell.Main>
      </AppShell>
      {showPlayer && (
        <Box
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 200,
          }}
        >
          <Container size="xl">
            <SpotifyPlayer onClose={handleClosePlayer} />
          </Container>
        </Box>
      )}
    </>
  );
}

export default App;
