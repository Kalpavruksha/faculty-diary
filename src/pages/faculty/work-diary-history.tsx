import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface WorkDiaryEntry {
  _id: string;
  date: string;
  task: string;
  activities: string;
  hours: number;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  status: 'pending' | 'approved' | 'rejected';
}

export default function WorkDiaryHistory() {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<WorkDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1); // Current month
  const [year, setYear] = useState(new Date().getFullYear()); // Current year

  // Protect this route
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role === 'admin') {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  // Fetch work diary entries
  useEffect(() => {
    if (user && user.role !== 'admin') {
      fetchEntries();
    }
  }, [user, month, year]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token using the getToken method from AuthContext
      const token = getToken();
      
      console.log('Fetching work diary entries with token:', token ? 'Token exists' : 'No token');
      
      // Make API call with proper authentication
      const response = await fetch('/api/work-diary/entry', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch work diary entries');
      }

      const result = await response.json();
      
      if (!result.data || !Array.isArray(result.data)) {
        setEntries([]);
        setLoading(false);
        return;
      }
      
      // Filter entries by selected month and year
      const filteredEntries = result.data.filter((entry: any) => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getMonth() + 1 === month && 
          entryDate.getFullYear() === year
        );
      });
      
      setEntries(filteredEntries);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching work diary entries:', error);
      setError(error.message || 'Failed to fetch entries');
      setLoading(false);
    }
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Generate month options
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3a1c71] via-[#5f2c82] to-[#6a3093]">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden mb-6">
          <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center">
              <Link
                href="/faculty/dashboard"
                className="flex items-center text-[#6a3093] hover:text-[#3a1c71] transition-colors mr-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#3a1c71]">Work Diary History</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-2">
                <label htmlFor="month" className="text-sm font-medium text-gray-700">Month:</label>
                <select 
                  id="month" 
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#6a3093] focus:border-[#6a3093]"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label htmlFor="year" className="text-sm font-medium text-gray-700">Year:</label>
                <select 
                  id="year" 
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#6a3093] focus:border-[#6a3093]"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Entries Table */}
        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#6a3093]"></div>
                <p className="mt-2 text-gray-600">Loading work diary entries...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">
                <p className="mt-2 text-lg font-medium">Error: {error}</p>
                <button 
                  onClick={fetchEntries}
                  className="mt-2 px-4 py-2 bg-[#6a3093] text-white rounded hover:bg-[#3a1c71]"
                >
                  Retry
                </button>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-lg font-medium text-gray-600">No work diary entries found for this period</p>
                <p className="mt-1 text-gray-500">Try selecting a different month or year</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#f5f3ff]">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">Task</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">Hours</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">Students</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry) => (
                      <tr key={entry._id} className="hover:bg-[#f5f3ff]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{entry.task}</div>
                          <div className="text-xs text-gray-500 mt-1">{entry.activities}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.hours}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {entry.presentStudents}/{entry.totalStudents} present
                          </div>
                          <div className="text-xs text-gray-500">{entry.absentStudents} absent</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(entry.status)}`}>
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-[#6a3093] hover:text-[#3a1c71]">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 