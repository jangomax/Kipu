import { RouterProvider } from 'react-router';
import { Masthead } from '@/components/shared';
import router from '@/routes';

function App() {
  return (
    <>
      <Masthead />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
