import { RouterProvider } from 'react-router';
import router from '@/routes';
import { AppShell } from '@mantine/core';
import { AppNavbar } from './components/navbar';
import { useInitializeMobileDetection } from './stores/useUiStore';

function App() {
  useInitializeMobileDetection();

  return (
    <>
      <AppShell padding="md" header={{ height: 50 }}>
        <AppNavbar />
        <AppShell.Main>
          <RouterProvider router={router} />
        </AppShell.Main>
      </AppShell>
    </>
  );
}

export default App;
