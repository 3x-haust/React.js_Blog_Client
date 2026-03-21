import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}