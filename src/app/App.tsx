import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import { DatabaseStatus } from './components/DatabaseStatus';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <DatabaseStatus />
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          classNames: {
            success: 'bg-green-50 border-green-200 text-green-900',
          },
        }}
      />
    </>
  );
}