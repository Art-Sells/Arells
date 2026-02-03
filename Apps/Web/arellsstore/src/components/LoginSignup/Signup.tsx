"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Signup: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
};

export default Signup;
