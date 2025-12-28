import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  // Check if user is authenticated
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken');

  if (token) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}