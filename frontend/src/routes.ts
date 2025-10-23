import { createBrowserRouter } from 'react-router';
import { LandingPage } from '@/components/landing';
import { CallbackPage } from '@/components/auth';
import { AppPage } from '@/components/app';
import { PlaylistDetailPage } from '@/components/app/playlist';

const router = createBrowserRouter([
  {
    path: '/',
    Component: LandingPage,
  },
  {
    path: '/callback',
    Component: CallbackPage,
  },
  {
    path: '/app',
    Component: AppPage,
  },
  {
    path: '/app/playlists/:playlistId',
    Component: PlaylistDetailPage,
  },
]);

export default router;
