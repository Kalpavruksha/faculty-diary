import { useState } from 'react';

export default function TestEmail() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const sendTestEmail = async () => {
    try {
      setStatus('loading');
      const response = await fetch('/api/test-email', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage('Test email sent successfully! Check your inbox.');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Test Email Configuration
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <button
            onClick={sendTestEmail}
            disabled={status === 'loading'}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {status === 'loading' ? 'Sending...' : 'Send Test Email'}
          </button>

          {status === 'success' && (
            <div className="mt-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 