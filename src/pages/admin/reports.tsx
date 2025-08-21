import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface ReportData {
  id: string;
  facultyName: string;
  department: string;
  month: string;
  year: number;
  totalEntries: number;
  totalHours: number;
  averageAttendance: number;
}

export default function AdminReports() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Protect this route
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role !== 'admin') {
      router.push('/faculty/dashboard');
    }
  }, [user, router]);

  // Fetch reports data
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchReports();
    }
  }, [user, selectedDepartment, selectedMonth, selectedYear]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // This would be replaced with an actual API call
      // For now, we'll use dummy data
      const dummyReports: ReportData[] = [
        {
          id: '1',
          facultyName: 'John Doe',
          department: 'Computer Science',
          month: 'May',
          year: 2023,
          totalEntries: 22,
          totalHours: 66,
          averageAttendance: 85
        },
        {
          id: '2',
          facultyName: 'Jane Smith',
          department: 'Electronics',
          month: 'May',
          year: 2023,
          totalEntries: 18,
          totalHours: 54,
          averageAttendance: 92
        },
        {
          id: '3',
          facultyName: 'Robert Johnson',
          department: 'Civil Engineering',
          month: 'May',
          year: 2023,
          totalEntries: 20,
          totalHours: 60,
          averageAttendance: 88
        },
        {
          id: '4',
          facultyName: 'Sarah Williams',
          department: 'Computer Science',
          month: 'April',
          year: 2023,
          totalEntries: 21,
          totalHours: 63,
          averageAttendance: 79
        }
      ];
      
      // Get unique departments
      const uniqueDepartments = Array.from(new Set(dummyReports.map(report => report.department)));
      setDepartments(uniqueDepartments);
      
      // Filter reports based on selection
      let filteredReports = [...dummyReports];
      
      if (selectedDepartment !== 'all') {
        filteredReports = filteredReports.filter(report => report.department === selectedDepartment);
      }
      
      if (selectedMonth !== 'all') {
        filteredReports = filteredReports.filter(report => report.month === selectedMonth);
      }
      
      filteredReports = filteredReports.filter(report => report.year === selectedYear);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setReports(filteredReports);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLoading(false);
    }
  };

  // Generate month options
  const months = [
    { value: 'all', label: 'All Months' },
    { value: 'January', label: 'January' },
    { value: 'February', label: 'February' },
    { value: 'March', label: 'March' },
    { value: 'April', label: 'April' },
    { value: 'May', label: 'May' },
    { value: 'June', label: 'June' },
    { value: 'July', label: 'July' },
    { value: 'August', label: 'August' },
    { value: 'September', label: 'September' },
    { value: 'October', label: 'October' },
    { value: 'November', label: 'November' },
    { value: 'December', label: 'December' }
  ];

  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const handleExport = () => {
    alert('Reports exported successfully (This would download a CSV file in a real implementation)');
  };

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
                href="/admin/dashboard"
                className="flex items-center text-[#6a3093] hover:text-[#3a1c71] transition-colors mr-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#3a1c71]">Faculty Reports</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gradient-to-r from-[#3a1c71] to-[#6a3093] text-white rounded-md shadow-sm hover:opacity-90 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export Reports
              </button>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#3a1c71]">Filter Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  id="department"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#6a3093] focus:border-[#6a3093] sm:text-sm"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#6a3093] focus:border-[#6a3093] sm:text-sm"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#6a3093] focus:border-[#6a3093] sm:text-sm"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Reports Table */}
        <div className="bg-white/90 shadow-xl rounded-xl overflow-hidden">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#6a3093]"></div>
                <p className="mt-2 text-gray-600">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-lg font-medium text-gray-600">No reports found for the selected filters</p>
                <p className="mt-1 text-gray-500">Try changing your filter criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#f5f3ff]">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">Faculty</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">Department</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">Period</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">Entries</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">Hours</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">Avg. Attendance</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a1c71] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-[#f5f3ff]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{report.facultyName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{report.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{report.month} {report.year}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{report.totalEntries}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{report.totalHours}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{report.averageAttendance}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-[#6a3093] hover:text-[#3a1c71]">
                            View Details
                          </button>
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