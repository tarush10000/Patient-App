import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function HomePage() {
  // Check if user is authenticated
  const cookieStore = cookies();
  const token = cookieStore.get('authToken');

  if (token) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}