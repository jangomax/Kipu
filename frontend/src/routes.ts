import { createBrowserRouter } from 'react-router';
import { LandingPage } from '@/components/landing';
import { CallbackPage } from '@/components/auth';
import { AppPage } from '@/components/app';

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
]);

export default router;
