import { createBrowserRouter } from 'react-router';
import { LandingPage } from '@/components/landing';

const router = createBrowserRouter([
  {
    path: '/',
    Component: LandingPage,
  },
]);

export default router;
