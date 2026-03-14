import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const API_BASE_URL = 'https://skyway-suites.vercel.app/api';

export default function EmailDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}?endpoint=email-diagnostics`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Diagnostics error:', errorData);
        toast.error(`Failed to load diagnostics: ${errorData.details || errorData.error}`);
        setDiagnostics(null);
        return;
      }
      
      const data = await response.json();
      console.log('Diagnostics data:', data);
      setDiagnostics(data);
    } catch (error) {
      console.error('Diagnostics fetch error:', error);
      toast.error('Failed to load diagnostics - check console for details');
      setDiagnostics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B7C3C]"></div>
        </div>
      </div>
    );
  }

  if (!diagnostics) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load diagnostics
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📧 Email System Diagnostics</h1>

      {/* SMTP Configuration Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {diagnostics.smtpConfigured ? (
            <span className="text-green-600">✅ SMTP Configured</span>
          ) : (
            <span className="text-red-600">❌ SMTP Not Configured</span>
          )}
        </h2>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">SMTP Host:</span>
              <div className="font-mono text-sm mt-1">
                {diagnostics.settings.smtpHost}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">SMTP Port:</span>
              <div className="font-mono text-sm mt-1">
                {diagnostics.settings.smtpPort}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">SMTP Username:</span>
              <div className="font-mono text-sm mt-1">
                {diagnostics.settings.smtpUsername}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Has Password:</span>
              <div className="font-mono text-sm mt-1">
                {diagnostics.settings.hasPassword ? '✅ Yes' : '❌ No'}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">SMTP Secure:</span>
              <div className="font-mono text-sm mt-1">
                {diagnostics.settings.smtpSecure}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">From Address:</span>
              <div className="font-mono text-sm mt-1">
                {diagnostics.settings.emailFromAddress}
              </div>
            </div>
          </div>
        </div>

        {!diagnostics.smtpConfigured && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Action Required:</strong> Go to Settings → Notifications and click
              "Initialize Raptor Mail Server" to configure SMTP.
            </p>
          </div>
        )}
      </div>

      {/* Customer Database Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">👥 Customer Database</h2>

        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-600">Customers with Email:</span>
            <div className="text-2xl font-bold text-[#6B7C3C] mt-1">
              {diagnostics.database.customersWithEmail}
            </div>
          </div>

          {diagnostics.database.sampleCustomer && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">Sample Customer:</p>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>{' '}
                  <span className="font-mono">{diagnostics.database.sampleCustomer.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>{' '}
                  <span className="font-mono">{diagnostics.database.sampleCustomer.email}</span>
                </div>
                <div>
                  <span className="text-gray-600">ID:</span>{' '}
                  <span className="font-mono text-xs">{diagnostics.database.sampleCustomer.id}</span>
                </div>
              </div>
            </div>
          )}

          {diagnostics.database.customersWithEmail === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>No customers with emails found.</strong> Create a test account to receive emails.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">📊 System Status</h2>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {diagnostics.smtpConfigured ? (
              <>
                <span className="text-green-600">✅</span>
                <span>SMTP is properly configured</span>
              </>
            ) : (
              <>
                <span className="text-red-600">❌</span>
                <span>SMTP needs to be configured</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {diagnostics.database.customersWithEmail > 0 ? (
              <>
                <span className="text-green-600">✅</span>
                <span>Customers have email addresses</span>
              </>
            ) : (
              <>
                <span className="text-red-600">❌</span>
                <span>No customers with email addresses</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {diagnostics.settings.hasPassword ? (
              <>
                <span className="text-green-600">✅</span>
                <span>SMTP password is set</span>
              </>
            ) : (
              <>
                <span className="text-red-600">❌</span>
                <span>SMTP password is missing</span>
              </>
            )}
          </div>
        </div>

        {diagnostics.smtpConfigured && diagnostics.database.customersWithEmail > 0 && diagnostics.settings.hasPassword ? (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-semibold">
              🎉 Email system is ready! Try creating a booking or payment to test.
            </p>
          </div>
        ) : (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-semibold">
              ⚠️ Email system is not ready. Please fix the issues above.
            </p>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={loadDiagnostics}
          className="px-4 py-2 bg-[#6B7C3C] text-white rounded-lg hover:bg-[#5a6832] transition-colors"
        >
          🔄 Refresh Diagnostics
        </button>
      </div>
    </div>
  );
}