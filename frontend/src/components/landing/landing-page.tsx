import { Button, Container, Stack, Title, Text, Card, Avatar, Group, Loader } from '@mantine/core';
import { useNavigate } from 'react-router';
import { useSpotifyLogin } from '@/hooks/useSpotifyLogin';
import { useSpotifyUser } from '@/hooks/useSpotifyUser';
import { clearTokens } from '@/util/auth';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { mutate: login, isPending: isLoggingIn } = useSpotifyLogin();
  const { data: user, isLoading: isFetchingUser, refetch } = useSpotifyUser();

  const handleLogin = () => {
    login();
  };

  const handleGetStarted = () => {
    navigate('/app');
  };

  const handleLogout = () => {
    clearTokens();
    window.location.reload();
  };

  if (isFetchingUser) {
    return (
      <Container size="sm" style={{ marginTop: '5rem' }}>
        <Stack gap="lg" align="center">
          <Loader size="xl" />
        </Stack>
      </Container>
    );
  }

  // un-authenticated
  if (!user) {
    return (
      <Container size="sm" style={{ marginTop: '5rem' }}>
        <Stack gap="lg" align="center">
          <Title order={1}>Welcome to Kipu</Title>
          <Text size="lg" c="dimmed" ta="center">
            Connect your Spotify account to get started.
          </Text>
          <Button size="lg" color="green" onClick={handleLogin} loading={isLoggingIn}>
            Login with Spotify
          </Button>
        </Stack>
      </Container>
    );
  }

  // authenticated
  return (
    <Container size="sm" style={{ marginTop: '5rem' }}>
      <Stack gap="lg" align="center">
        <Title order={1}>Welcome to Kipu</Title>
        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ width: '100%' }}>
          <Group>
            {user.images && user.images.length > 0 && (
              <Avatar src={user.images[0].url} size="xl" radius="xl" />
            )}
            <Stack gap="xs">
              <Title order={3}>{user.displayName}</Title>
              <Text size="sm" c="dimmed">
                {user.email}
              </Text>
              {user.product && (
                <Text size="sm" c="dimmed">
                  Spotify {user.product.charAt(0).toUpperCase() + user.product.slice(1)}
                </Text>
              )}
            </Stack>
          </Group>
        </Card>
        <Text size="lg" ta="center">
          Your Spotify account has been successfully connected!
        </Text>
        <Group>
          <Button size="lg" onClick={handleGetStarted}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" color="red" onClick={handleLogout}>
            Logout
          </Button>
        </Group>
      </Stack>
    </Container>
  );
};
