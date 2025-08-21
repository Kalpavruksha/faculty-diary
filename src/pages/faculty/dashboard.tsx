import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Define types
interface TimetableEntry {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
}

interface WorkDiaryEntry {
  id: string;
  date: string;
  task: string;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  status: 'pending' | 'approved' | 'rejected';
}

export default function FacultyDashboard() {
  const { user, logout, getToken } = useAuth();
  const router = useRouter();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [recentEntries, setRecentEntries] = useState<WorkDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [timetableView, setTimetableView] = useState<'table' | 'form'>('table');

  // Protect this route - only accessible to authenticated faculty users
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role === 'admin') {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  // Fetch timetable data
  useEffect(() => {
    if (user && user.role !== 'admin') {
      fetchTimetable();
      fetchRecentEntries();
    }
  }, [user]);

  // Fetch faculty timetable
  const fetchTimetable = async () => {
    try {
      setLoading(true);
      
      // Get auth token using the getToken method from AuthContext
      const token = getToken ? getToken() : null;
      
      // Make API call to get timetable data
      const response = await fetch('/api/timetable/schedule', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch timetable');
      }

      const result = await response.json();
      
      if (!result.data || !Array.isArray(result.data)) {
        setTimetable([]);
        setLoading(false);
        return;
      }
      
      // Transform API response to match our interface
      const formattedTimetable = result.data.map((entry: any) => ({
        id: entry._id,
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        subject: entry.subject,
        room: entry.room
      }));
      
      setTimetable(formattedTimetable);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      // If API fails, fall back to dummy data for development
      if (process.env.NODE_ENV === 'development') {
        const dummyTimetable: TimetableEntry[] = [
          {
            id: '1',
            day: 'Monday',
            startTime: '09:00',
            endTime: '10:30',
            subject: 'Data Structures',
            room: 'Room 101'
          },
          {
            id: '2',
            day: 'Monday',
            startTime: '11:00',
            endTime: '12:30',
            subject: 'Algorithms',
            room: 'Room 102'
          },
          {
            id: '3',
            day: 'Wednesday',
            startTime: '09:00',
            endTime: '10:30',
            subject: 'Database Systems',
            room: 'Lab 201'
          },
          {
            id: '4',
            day: 'Friday',
            startTime: '13:00',
            endTime: '14:30',
            subject: 'Operating Systems',
            room: 'Room 105'
          }
        ];
        setTimetable(dummyTimetable);
      } else {
        setTimetable([]);
      }
      setLoading(false);
    }
  };

  // Fetch recent work diary entries
  const fetchRecentEntries = async () => {
    try {
      setLoadingEntries(true);
      
      // Get auth token using the getToken method from AuthContext
      const token = getToken ? getToken() : null;
      
      // Make API call to get work diary entries
      const response = await fetch('/api/work-diary/entry', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch work diary entries');
      }

      const result = await response.json();
      
      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        setRecentEntries([]);
        setLoadingEntries(false);
        return;
      }
      
      // Transform API response to match our interface (taking only the most recent 5 entries)
      const formattedEntries = result.data.slice(0, 5).map((entry: any) => ({
        id: entry._id,
        date: new Date(entry.date).toLocaleDateString(),
        task: entry.task,
        totalStudents: entry.totalStudents,
        presentStudents: entry.presentStudents,
        absentStudents: entry.absentStudents,
        status: entry.status
      }));
      
      setRecentEntries(formattedEntries);
      setLoadingEntries(false);
    } catch (error) {
      console.error('Error fetching recent entries:', error);
      // Fallback to empty array if the API call fails
      setRecentEntries([]);
      setLoadingEntries(false);
    }
  };

  // Add this function to your component
  const sendClassReminder = async (classId: string, method: 'sms' | 'call' | 'both' = 'sms') => {
    try {
      setLoading(true);
      
      const token = getToken ? getToken() : null;
      
      const response = await fetch('/api/faculty/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ classId, notificationType: method }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reminder');
      }
      
      alert(`Class reminder ${method === 'both' ? 'notifications' : method} sent successfully!`);
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      alert(error.message || 'Failed to send reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle timetable view between table and form
  const toggleTimetableView = () => {
    setTimetableView(prev => prev === 'table' ? 'form' : 'table');
  };

  // Group timetable entries by day for form view
  const timetableByDay = timetable.reduce((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = [];
    }
    acc[entry.day].push(entry);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  // Sort days in a logical order
  const sortedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    .filter(day => Object.keys(timetableByDay).includes(day));

  // If not authenticated, don't render the dashboard
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3a1c71] via-[#5f2c82] to-[#6a3093]">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden mb-6">
          <div className="p-6 flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold text-[#3a1c71] mb-4 sm:mb-0">Faculty Dashboard</h1>
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

        {/* Work Diary Actions */}
        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#3a1c71]">Work Diary Actions</h2>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/work-diary/entry"
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#3a1c71] to-[#6a3093] text-white font-semibold text-center shadow-md hover:opacity-90 transition flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create New Work Diary Entry
              </Link>
              
              <Link
                href="/faculty/work-diary-history"
                className="px-6 py-3 rounded-lg bg-white text-[#6a3093] font-semibold text-center shadow-md border border-[#6a3093] hover:bg-[#f5f3ff] transition flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                View History
              </Link>
            </div>
            
            {/* Recent Entries */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-[#3a1c71] mb-3">Recent Entries</h3>
              
              {loadingEntries ? (
                <div className="text-center py-4">Loading recent entries...</div>
              ) : recentEntries.length === 0 ? (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No recent work diary entries found.</p>
                  <p className="text-gray-600 mt-1">Create your first entry to get started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#f5f3ff]">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">
                          Task
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">
                          Students
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-[#f5f3ff]">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{entry.date}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{entry.task}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {entry.presentStudents}/{entry.totalStudents} present
                              <br />
                              {entry.absentStudents} absent
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              entry.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : entry.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                            </span>
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
          
        {/* Timetable Section */}
        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#3a1c71]">Your Weekly Timetable</h2>
              
              {/* View toggle button */}
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-600">View as:</span>
                <button 
                  onClick={toggleTimetableView}
                  className="px-3 py-1 rounded-md bg-[#f5f3ff] border border-[#ddd6fe] text-[#6a3093] text-sm font-medium hover:bg-[#ede9fe] transition"
                >
                  {timetableView === 'table' ? (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                      </svg>
                      Form View
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                      </svg>
                      Table View
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-4">Loading timetable...</div>
            ) : timetable.length === 0 ? (
              <div className="text-center py-4">No timetable entries found.</div>
            ) : timetableView === 'table' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#f5f3ff]">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">
                        Day
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">
                        Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">
                        Subject
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">
                        Room
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timetable.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#f5f3ff]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{entry.day}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {entry.startTime} - {entry.endTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.subject}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{entry.room}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => sendClassReminder(entry.id, 'sms')}
                              disabled={loading}
                              className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full hover:bg-indigo-200 disabled:opacity-50 flex items-center"
                              title="Send SMS Reminder"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                              </svg>
                              {loading ? 'Sending...' : 'SMS'}
                            </button>
                            <button
                              onClick={() => sendClassReminder(entry.id, 'call')}
                              disabled={loading}
                              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200 disabled:opacity-50 flex items-center"
                              title="Send Voice Call Reminder"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                              </svg>
                              {loading ? 'Calling...' : 'Call'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDays.map(day => (
                  <div key={day} className="bg-[#f5f3ff] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-[#3a1c71] mb-3">{day}</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {timetableByDay[day].map(entry => (
                        <div 
                          key={entry.id} 
                          className="bg-white rounded-lg shadow-sm p-4 border border-[#ddd6fe] hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-[#3a1c71]">{entry.subject}</h4>
                              <p className="text-sm text-gray-600">{entry.startTime} - {entry.endTime}</p>
                            </div>
                            <span className="px-2 py-1 text-xs bg-[#ede9fe] text-[#6a3093] rounded-full">
                              {entry.room}
                            </span>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                            <button
                              onClick={() => sendClassReminder(entry.id, 'sms')}
                              disabled={loading}
                              className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full hover:bg-indigo-200 disabled:opacity-50 flex items-center"
                              title="Send SMS Reminder"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                              </svg>
                              {loading ? 'Sending...' : 'Send SMS'}
                            </button>
                            <button
                              onClick={() => sendClassReminder(entry.id, 'call')}
                              disabled={loading}
                              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200 disabled:opacity-50 flex items-center"
                              title="Send Voice Call Reminder"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                              </svg>
                              {loading ? 'Calling...' : 'Call'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
          
        {/* Quick Links */}
        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#3a1c71]">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                href="/faculty/profile"
                className="bg-gradient-to-r from-[#f5f3ff] to-[#ede9fe] p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-[#ddd6fe]"
              >
                <div className="font-semibold text-[#4c1d95]">Update Profile</div>
                <p className="text-sm text-gray-600">Update your personal details</p>
              </Link>
              
              <Link 
                href="/change-password"
                className="bg-gradient-to-r from-[#f5f3ff] to-[#ede9fe] p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-[#ddd6fe]"
              >
                <div className="font-semibold text-[#4c1d95]">Change Password</div>
                <p className="text-sm text-gray-600">Update your login password</p>
              </Link>
              
              <a 
                href="mailto:support@workdiary.com"
                className="bg-gradient-to-r from-[#f5f3ff] to-[#ede9fe] p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-[#ddd6fe]"
              >
                <div className="font-semibold text-[#4c1d95]">Support</div>
                <p className="text-sm text-gray-600">Contact support for help</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 