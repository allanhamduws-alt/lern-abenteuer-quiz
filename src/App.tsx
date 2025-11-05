/**
 * Haupt-App-Komponente
 * Diese Datei ist der Einstiegspunkt für die gesamte App
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './router';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
