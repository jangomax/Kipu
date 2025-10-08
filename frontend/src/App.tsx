import { Container, Stack } from '@mantine/core';
import { Masthead } from '@/components/shared';

function App() {
  return (
    <>
      <Masthead />
      <Container size="md" py="xl">
        <Stack></Stack>
      </Container>
    </>
  );
}

export default App;
