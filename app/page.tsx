import { redirect } from 'next/navigation';

/**
 * Root Route (http://localhost:3000/):
 * Direct access to private vault data is strictly forbidden.
 * Pasting or opening the root URL immediately directs to the Authentication portal (/login).
 */
export default function RootPage() {
  redirect('/login');
}
