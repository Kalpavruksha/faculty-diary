import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to their respective dashboards
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/faculty/dashboard');
      }
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3a1c71] via-[#5f2c82] to-[#6a3093] flex items-center justify-center p-4">
      <div className="bg-white/90 rounded-xl shadow-xl p-10 max-w-2xl w-full">
        <h1 className="text-5xl font-extrabold text-center text-[#3a1c71] mb-6">
          Welcome to <span className="text-[#6a3093]">WorkDiary</span>
        </h1>
        
        <p className="text-lg text-center text-gray-600 mb-10">
          Manage your work from one place. Schedule activities, track submissions, and monitor your academic progress with our comprehensive faculty portal.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/register" 
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#3a1c71] to-[#6a3093] text-white font-semibold text-center shadow-md hover:opacity-90 transition"
          >
            Get Started
          </Link>
          
          <Link 
            href="/login" 
            className="px-6 py-3 rounded-lg bg-white text-[#6a3093] font-semibold text-center shadow-md border border-[#6a3093] hover:bg-[#f5f3ff] transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
} 