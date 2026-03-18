'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function AuthGuard(props: P) {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
      } else {
        setReady(true);
      }
    }, [router]);

    if (!ready) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-500 text-sm animate-pulse">Loading…</div>
        </div>
      );
    }
    return <Component {...props} />;
  };
}
