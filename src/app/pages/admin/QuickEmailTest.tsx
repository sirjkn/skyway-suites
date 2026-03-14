import { useState } from 'react';
import { toast } from 'sonner';

const API_BASE_URL = 'https://skyway-suites.vercel.app/api';

export default function QuickEmailTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}?endpoint=settings&action=category&category=notifications`);
      const data = await response.json();
      console.log('Settings from database:', data);
      setResult({ type: 'settings', data });
      toast.success('Settings loaded - check console');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load settings');
      setResult({ type: 'error', error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const checkCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}?endpoint=customers`);
      const data = await response.json();
      console.log('Customers:', data);
      setResult({ type: 'customers', data });
      toast.success(`Found ${data.length} customers`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load customers');
      setResult({ type: 'error', error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 Quick Email System Test</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Manual Checks</h2>
        
        <div className="space-y-4">
          <div>
            <button
              onClick={checkSettings}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : '1. Check SMTP Settings in Database'}
            </button>
            <p className="text-sm text-gray-600 mt-2">
              This will fetch all notification settings from the database and log them to console
            </p>
          </div>

          <div>
            <button
              onClick={checkCustomers}
              disabled={loading}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : '2. Check Customers in Database'}
            </button>
            <p className="text-sm text-gray-600 mt-2">
              This will fetch all customers and log them to console
            </p>
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="bg-white p-4 rounded border border-gray-200 overflow-auto max-h-96 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Instructions:</strong>
        </p>
        <ol className="text-sm text-blue-800 mt-2 ml-5 list-decimal space-y-1">
          <li>Open browser console (Press F12)</li>
          <li>Click "Check SMTP Settings"</li>
          <li>Look at the console - it will show what's in the database</li>
          <li>If empty, go to Settings → Notifications → Click "Initialize Raptor Mail Server"</li>
          <li>Come back and click "Check SMTP Settings" again</li>
        </ol>
      </div>
    </div>
  );
}
