/**
 * Haupt-App-Komponente
 * Diese Datei ist der Einstiegspunkt für die gesamte App
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { MascotProvider } from './contexts/MascotContext';

function App() {
  return (
    <MascotProvider>
      <RouterProvider router={router} />
    </MascotProvider>
  );
}

export default App;
