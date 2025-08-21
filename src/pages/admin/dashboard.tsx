import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Define types for our faculty reports
interface FacultyReport {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    department: string;
  };
  date: string;
  task: string;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  status: 'pending' | 'approved' | 'rejected';
}

export default function AdminDashboard() {
  const { user, logout, getToken } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<FacultyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [departments, setDepartments] = useState<string[]>([]);

  // Protect this route - only accessible to authenticated admin users
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role !== 'admin') {
      router.push('/faculty/dashboard');
    }
  }, [user, router]);

  // Fetch faculty reports
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token using the getToken method from AuthContext
      const token = getToken();
      
      console.log('Fetching reports with token:', token ? 'Token exists' : 'No token');
      
      // Make API call to get reports
      const response = await fetch('/api/admin/reports', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch faculty reports');
      }

      const reportsByDepartment = await response.json();
      
      // Check if reportsByDepartment has data
      if (!reportsByDepartment || Object.keys(reportsByDepartment).length === 0) {
        setReports([]);
        setDepartments([]);
        setLoading(false);
        return;
      }
      
      // Flatten the reports array from all departments
      let allReports: FacultyReport[] = [];
      
      Object.keys(reportsByDepartment).forEach(dept => {
        if (Array.isArray(reportsByDepartment[dept])) {
          allReports = [...allReports, ...reportsByDepartment[dept]];
        }
      });
      
      // Get unique departments
      const uniqueDepartments = Array.from(
        new Set(allReports.map(report => report.user?.department || 'Uncategorized'))
      );
      
      setDepartments(uniqueDepartments);
      setReports(allReports);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      setError(error.message || 'Failed to fetch reports');
      setLoading(false);
    }
  };

  const [processingReportId, setProcessingReportId] = useState<string | null>(null);

  const handleStatusChange = async (reportId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setProcessingReportId(reportId);
      
      // Get auth token using the getToken method from AuthContext
      const token = getToken();
      
      // Make API call to update status
      const response = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          entryId: reportId,
          status: newStatus
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      // Update the report status in the UI
      setReports(reports.map(report => 
        report._id === reportId ? { ...report, status: newStatus } : report
      ));
      
    } catch (error: any) {
      console.error(`Error changing status for report ${reportId}:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessingReportId(null);
    }
  };

  const handleResendReport = async (reportId: string) => {
    try {
      setProcessingReportId(reportId);
      
      // Get auth token using the getToken method from AuthContext
      const token = getToken();
      
      // Make API call to update status to pending (resend)
      const response = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          entryId: reportId,
          status: 'pending',
          resend: true
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend report');
      }
      
      // Update UI
      setReports(reports.map(report => 
        report._id === reportId ? { ...report, status: 'pending' } : report
      ));
      
      alert(`Report has been sent back to faculty for updates. Email notification sent.`);
      
    } catch (error: any) {
      console.error(`Error resending report ${reportId}:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessingReportId(null);
    }
  };

  const filteredReports = selectedDepartment === 'all' 
    ? reports 
    : reports.filter(report => 
        (report.user?.department || 'Uncategorized') === selectedDepartment
      );

  // If not authenticated or wrong role, don't render the dashboard
  if (!user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3a1c71] via-[#5f2c82] to-[#6a3093]">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden mb-6">
          <div className="p-6 flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold text-[#3a1c71] mb-4 sm:mb-0">Admin Dashboard</h1>
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

        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden mb-6">
          <div className="p-6">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <h2 className="text-xl font-semibold text-[#3a1c71]">Faculty Reports Overview</h2>
              <div className="flex items-center space-x-4">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Filter by Department:
                </label>
                <select
                  id="department"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#6a3093] focus:border-[#6a3093] sm:text-sm rounded-md"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-4">Loading reports...</div>
            ) : error ? (
              <div className="text-center py-4 text-red-600">
                <p>Error: {error}</p>
                <button 
                  onClick={fetchReports}
                  className="mt-2 px-4 py-2 bg-[#6a3093] text-white rounded hover:bg-[#3a1c71]"
                >
                  Retry
                </button>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-4">No reports found for this department.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#f5f3ff]">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">
                        Faculty
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">
                        Department
                      </th>
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr key={report._id} className="hover:bg-[#f5f3ff]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{report.user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{report.user.department || 'Uncategorized'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{new Date(report.date).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{report.task}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {report.presentStudents}/{report.totalStudents} present
                            <br />
                            {report.absentStudents} absent
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            report.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : report.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleStatusChange(report._id, 'approved')}
                              disabled={processingReportId === report._id || report.status === 'approved'}
                              className={`text-[#4f46e5] hover:text-[#3a1c71] ${
                                (processingReportId === report._id || report.status === 'approved') ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {processingReportId === report._id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleStatusChange(report._id, 'rejected')}
                              disabled={processingReportId === report._id || report.status === 'rejected'}
                              className={`text-red-600 hover:text-red-900 ${
                                (processingReportId === report._id || report.status === 'rejected') ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {processingReportId === report._id ? 'Processing...' : 'Reject'}
                            </button>
                            <button
                              onClick={() => handleResendReport(report._id)}
                              disabled={processingReportId === report._id}
                              className={`text-[#6a3093] hover:text-[#3a1c71] ${
                                processingReportId === report._id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {processingReportId === report._id ? 'Processing...' : 'Resend'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
          
        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#3a1c71]">Quick Links</h2>
            <div className="grid grid-cols-1 gap-4">
              <Link 
                href="/admin/reports"
                className="bg-gradient-to-r from-[#f5f3ff] to-[#ede9fe] p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-[#ddd6fe]"
              >
                <div className="font-semibold text-[#4c1d95]">View All Reports</div>
                <p className="text-sm text-gray-600">View and export detailed reports for all faculty members</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 