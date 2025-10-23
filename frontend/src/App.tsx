import { Link, RouterProvider } from 'react-router';
import router from '@/routes';
import { AppShell, Title } from '@mantine/core';

function App() {
  return (
    <>
      <AppShell padding="md" header={{ height: 50 }}>
        <AppShell.Header style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem' }}>
          <Title order={2}>Kipu</Title>
        </AppShell.Header>
        <AppShell.Main>
          <RouterProvider router={router} />
        </AppShell.Main>
      </AppShell>
    </>
  );
}

export default App;
