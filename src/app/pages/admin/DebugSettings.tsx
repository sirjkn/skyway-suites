import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsArray),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize settings');
      }

      toast.success('Raptor settings initialized successfully!');
      loadRawSettings(); // Reload to show new settings
    } catch (error) {
      console.error('Failed to initialize Raptor settings:', error);
      toast.error('Failed to initialize settings');
    } finally {
      setLoading(false);
    }
  };

  const createEmailTemplatesTable = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}?endpoint=create-email-templates-table`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create table');
      }

      const data = await response.json();
      toast.success(data.message || 'Email templates table created successfully!');
    } catch (error) {
      console.error('Failed to create email templates table:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create table';
      toast.error(errorMessage);
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
            <Button onClick={createEmailTemplatesTable} disabled={loading} variant="default">
              Create Email Templates Table
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

      {/* Initialize Raptor Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Raptor Settings</CardTitle>
          <CardDescription>
            Initialize the Raptor settings in the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Click below to initialize the Raptor settings. This is required before you can use the Raptor features.
          </p>
          <Button 
            onClick={initializeRaptorSettings}
            disabled={loading}
            className="w-full"
          >
            Initialize Raptor Settings
          </Button>
        </CardContent>
      </Card>

      {/* Create Email Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates Table</CardTitle>
          <CardDescription>
            Initialize the email_templates table in the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Click below to create the email_templates table. This is required before you can use the Email Templates editor.
          </p>
          <Button 
            onClick={createEmailTemplatesTable}
            disabled={loading}
            className="w-full"
          >
            Create Email Templates Table
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}