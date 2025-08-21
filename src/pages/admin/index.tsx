import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminHome() {
  const { user, logout, getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Protect this route
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user.role !== 'admin') {
    router.push('/faculty/dashboard');
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  const generateTimetables = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Get auth token
      const token = getToken();
      
      // Make API call to generate timetables
      const response = await fetch('/api/timetable/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate timetables');
      }
      
      setSuccess(`Timetables generated successfully for ${data.facultyCount} faculty members.`);
    } catch (error: any) {
      console.error('Error generating timetables:', error);
      setError(error.message || 'An error occurred while generating timetables');
    } finally {
      setLoading(false);
    }
  };
  
  const generateDemoTimetables = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Make API call to generate timetables for demo purposes
      const response = await fetch('/api/timetable/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generateForDemo: true })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate demo timetables');
      }
      
      setSuccess(`Demo timetables generated successfully for ${data.facultyCount} faculty members. CS subjects like Java, SQL, DBMS, ADA, and OS have been assigned.`);
    } catch (error: any) {
      console.error('Error generating demo timetables:', error);
      setError(error.message || 'An error occurred while generating demo timetables');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3a1c71] via-[#5f2c82] to-[#6a3093]">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden mb-6">
          <div className="p-6 flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold text-[#3a1c71] mb-4 sm:mb-0">Admin Portal</h1>
            <div className="flex items-center space-x-4">
              <Link 
                href="/profile"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                My Profile
              </Link>
              <button 
                onClick={logout}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#3a1c71] to-[#6a3093] hover:opacity-90"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-[#3a1c71]">System Management</h2>
            
            {error && (
              <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
                <p className="font-bold">Success</p>
                <p>{success}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                <h3 className="text-lg font-medium text-[#3a1c71] mb-3">Timetable Management</h3>
                <p className="text-gray-600 mb-4">
                  Generate timetables for all faculty members. This will create random schedules
                  for each faculty member with classes spread throughout the week.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={generateTimetables}
                    disabled={loading}
                    className={`px-4 py-2 bg-[#6a3093] text-white rounded-md hover:bg-[#3a1c71] transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Generating...' : 'Generate Timetables'}
                  </button>
                  
                  <button
                    onClick={generateDemoTimetables}
                    disabled={loading}
                    className={`px-4 py-2 bg-[#9a4fb9] text-white rounded-md hover:bg-[#7e3c96] transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Generating...' : 'Generate Demo CS Timetables'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Demo timetables include CS subjects: Java, SQL, DBMS, ADA, OS, etc.
                </p>
              </div>
              
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                <h3 className="text-lg font-medium text-[#3a1c71] mb-3">Faculty Management</h3>
                <p className="text-gray-600 mb-4">
                  View and manage faculty members, including approving new registrations
                  and resetting passwords.
                </p>
                <Link
                  href="/admin/dashboard"
                  className="px-4 py-2 bg-[#6a3093] text-white rounded-md hover:bg-[#3a1c71] transition-colors inline-block"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#3a1c71]">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                href="/admin/dashboard"
                className="bg-gradient-to-r from-[#f5f3ff] to-[#ede9fe] p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-[#ddd6fe]"
              >
                <div className="font-semibold text-[#4c1d95]">Faculty Reports</div>
                <p className="text-sm text-gray-600">View and manage faculty work diary reports</p>
              </Link>
              
              <Link 
                href="/change-password"
                className="bg-gradient-to-r from-[#f5f3ff] to-[#ede9fe] p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-[#ddd6fe]"
              >
                <div className="font-semibold text-[#4c1d95]">Change Password</div>
                <p className="text-sm text-gray-600">Update your account password</p>
              </Link>
              
              <a 
                href="mailto:support@workdiary.com"
                className="bg-gradient-to-r from-[#f5f3ff] to-[#ede9fe] p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-[#ddd6fe]"
              >
                <div className="font-semibold text-[#4c1d95]">Support</div>
                <p className="text-sm text-gray-600">Contact system support</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 