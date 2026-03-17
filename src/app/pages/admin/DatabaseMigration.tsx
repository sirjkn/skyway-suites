import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function DatabaseMigration() {
  const [isRunning, setIsRunning] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const runMigration = async () => {
    setIsRunning(true);
    setMigrationStatus('idle');
    setMessage('');
    
    try {
      const response = await fetch('/api?endpoint=migrate');
      const data = await response.json();
      
      if (data.success) {
        setMigrationStatus('success');
        setMessage(data.message);
        toast.success('Migration completed successfully!');
      } else {
        setMigrationStatus('error');
        setMessage(data.error || 'Migration failed');
        toast.error('Migration failed');
      }
    } catch (error) {
      setMigrationStatus('error');
      setMessage(error instanceof Error ? error.message : String(error));
      toast.error('Failed to run migration');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl mb-2">Database Migration</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Run database migrations to update your schema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Add Categorized Photos Column
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">This migration will:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Add a <code className="bg-gray-100 px-1 py-0.5 rounded">categorized_photos</code> column to the properties table</li>
              <li>Set the column type as JSONB to store photo categories</li>
              <li>Initialize with an empty object for existing properties</li>
            </ul>
          </div>

          {migrationStatus === 'success' && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Migration Successful</p>
                <p className="text-sm text-green-700 mt-1">{message}</p>
              </div>
            </div>
          )}

          {migrationStatus === 'error' && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Migration Failed</p>
                <p className="text-sm text-red-700 mt-1">{message}</p>
              </div>
            </div>
          )}

          <Button 
            onClick={runMigration} 
            disabled={isRunning}
            className="w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Migration...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Run Migration
              </>
            )}
          </Button>

          <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="font-medium mb-1">⚠️ Important Notes:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>This migration is safe to run multiple times (uses IF NOT EXISTS)</li>
              <li>Existing properties will not be affected</li>
              <li>After running the migration, you can start categorizing photos in Add/Edit Property</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
