import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function WorkDiaryEntry() {
  const [date, setDate] = useState('');
  const [activities, setActivities] = useState('');
  const [task, setTask] = useState('');
  const [hours, setHours] = useState('');
  const [totalStudents, setTotalStudents] = useState('');
  const [present, setPresent] = useState('');
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Check authentication
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const absent = totalStudents && present ? Math.max(Number(totalStudents) - Number(present), 0) : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    
    // Make sure user is authenticated
    if (!user || !user.email) {
      setError('You must be logged in to submit a work diary entry');
      setSubmitting(false);
      return;
    }
    
    try {
      // Create the entry data
      const entryData = {
        date,
        activities,
        task,
        hours,
        totalStudents,
        present,
        absent,
        status: status.toLowerCase(),
        email: user.email // Include the user's email for authentication
      };
      
      console.log('Submitting work diary entry:', entryData);
      
      const res = await fetch('/api/work-diary/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Work diary submission failed:', data);
        throw new Error(data.error || 'Submission failed');
      }
      
      setSuccess('Entry submitted successfully!');
      
      // Reset form
      setDate('');
      setActivities('');
      setTask('');
      setHours('');
      setTotalStudents('');
      setPresent('');
      
      // Redirect after short delay
      setTimeout(() => router.push('/faculty/dashboard'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render until we check if user is authenticated
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3a1c71] via-[#5f2c82] to-[#6a3093] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white/90 py-8 px-4 shadow-xl rounded-xl sm:px-10">
          <div className="flex justify-between items-center mb-6">
            <Link 
              href="/faculty/dashboard" 
              className="flex items-center text-[#6a3093] hover:text-[#3a1c71] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </Link>
            <h2 className="text-3xl font-bold text-center text-[#3a1c71]">Submit Work Diary</h2>
            <div className="w-32"></div> {/* Spacer for balance */}
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="bg-red-100 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>}
            
            {success && <div className="bg-green-100 border-l-4 border-green-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>}
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
              <input 
                id="date" 
                name="date" 
                type="date" 
                required 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#6a3093] focus:border-[#6a3093] sm:text-sm" 
              />
            </div>
            
            <div>
              <label htmlFor="task" className="block text-sm font-medium text-gray-700">Task Done</label>
              <input 
                id="task" 
                name="task" 
                type="text" 
                required 
                value={task} 
                onChange={e => setTask(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#6a3093] focus:border-[#6a3093] sm:text-sm" 
              />
            </div>
            
            <div>
              <label htmlFor="activities" className="block text-sm font-medium text-gray-700">Activities</label>
              <textarea 
                id="activities" 
                name="activities" 
                required 
                value={activities} 
                onChange={e => setActivities(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#6a3093] focus:border-[#6a3093] sm:text-sm" 
                rows={3}
              />
            </div>
            
            <div>
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700">Hours</label>
              <input 
                id="hours" 
                name="hours" 
                type="number" 
                min="1" 
                max="24" 
                required 
                value={hours} 
                onChange={e => setHours(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#6a3093] focus:border-[#6a3093] sm:text-sm" 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="totalStudents" className="block text-sm font-medium text-gray-700">Total Students</label>
                <input 
                  id="totalStudents" 
                  name="totalStudents" 
                  type="number" 
                  min="1" 
                  required 
                  value={totalStudents} 
                  onChange={e => setTotalStudents(e.target.value)} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#6a3093] focus:border-[#6a3093] sm:text-sm" 
                />
              </div>
              
              <div>
                <label htmlFor="present" className="block text-sm font-medium text-gray-700">Number Present</label>
                <input 
                  id="present" 
                  name="present" 
                  type="number" 
                  min="0" 
                  max={totalStudents ? Number(totalStudents) : undefined} 
                  required 
                  value={present} 
                  onChange={e => setPresent(e.target.value)} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#6a3093] focus:border-[#6a3093] sm:text-sm" 
                />
              </div>
              
              <div>
                <label htmlFor="absent" className="block text-sm font-medium text-gray-700">Number Absent</label>
                <input 
                  id="absent" 
                  name="absent" 
                  type="number" 
                  value={absent} 
                  readOnly 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm" 
                />
              </div>
            </div>
            
            <div>
              <button 
                type="submit" 
                disabled={submitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#3a1c71] to-[#6a3093] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6a3093] ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 