import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { API_BASE_URL } from '../../lib/api';
import { toast } from 'sonner';

export default function DebugSettings() {
  const [rawSettings, setRawSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadRawSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}?endpoint=debug-settings`);
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      const data = await response.json();
      setRawSettings(data);
      toast.success(`Loaded ${data.count} settings from database`);
    } catch (error) {
      console.error('Failed to load raw settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const initializeRaptorSettings = async () => {
    try {
      setLoading(true);
      
      const settingsArray = [
        { category: 'notifications', key: 'smtp_host', value: 'raptor.vivawebhost.com' },
        { category: 'notifications', key: 'smtp_port', value: '587' },
        { category: 'notifications', key: 'smtp_username', value: 'info@skywaysuites.co.ke' },
        { category: 'notifications', key: 'smtp_password', value: '^we;RW{8OMGUOazE' },
        { category: 'notifications', key: 'smtp_secure', value: 'false' },
        { category: 'notifications', key: 'email_from_address', value: 'info@skywaysuites.co.ke' },
        { category: 'notifications', key: 'email_from_name', value: 'Skyway Suites' },
        { category: 'notifications', key: 'email_provider', value: 'smtp' },
      ];

      const response = await fetch(`${API_BASE_URL}?endpoint=settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsArray),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Raptor settings initialized!');
      
      // Reload to confirm
      setTimeout(loadRawSettings, 500);
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      toast.error('Failed to initialize settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Debug: Raw Settings Database</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={loadRawSettings} disabled={loading}>
              {loading ? 'Loading...' : 'Load Raw Settings'}
            </Button>
            <Button onClick={initializeRaptorSettings} disabled={loading} variant="default">
              Initialize Raptor Settings Directly
            </Button>
          </div>

          {rawSettings && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Database Contents ({rawSettings.count} rows):</h3>
              <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Category</th>
                      <th className="text-left py-2">Key</th>
                      <th className="text-left py-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawSettings.settings.map((setting: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{setting.category}</td>
                        <td className="py-2 font-mono text-xs">{setting.key}</td>
                        <td className="py-2 font-mono text-xs">
                          {setting.key.includes('password') ? '••••••••' : setting.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
