import { useState, useEffect } from 'react';
import { CreditCard, Search, Download, RefreshCw, CheckCircle, XCircle, Clock, User, Phone, Home, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { toast } from 'sonner';
import { getMpesaTransactions, MpesaTransaction } from '../../lib/api';

export function MpesaTransactions() {
  const [transactions, setTransactions] = useState<MpesaTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<MpesaTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, statusFilter, transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getMpesaTransactions();
      setTransactions(data);
      setFilteredTransactions(data);
    } catch (error) {
      console.error('Error fetching M-Pesa transactions:', error);
      toast.error('Failed to load M-Pesa transactions');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.phone_number?.toLowerCase().includes(term) ||
        t.mpesa_receipt_number?.toLowerCase().includes(term) ||
        t.customer_name?.toLowerCase().includes(term) ||
        t.customer_email?.toLowerCase().includes(term) ||
        t.property_name?.toLowerCase().includes(term) ||
        t.checkout_request_id?.toLowerCase().includes(term)
      );
    }

    setFilteredTransactions(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Customer', 'Phone', 'Property', 'Amount', 'Receipt', 'Status'];
    const csvData = filteredTransactions.map(t => [
      new Date(t.created_at).toLocaleString(),
      t.customer_name || 'N/A',
      t.phone_number,
      t.property_name || 'N/A',
      `KES ${parseFloat(t.amount).toLocaleString()}`,
      t.mpesa_receipt_number || 'Pending',
      t.status
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mpesa-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Completed
          </div>
        );
      case 'pending':
        return (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
            <Clock className="h-3 w-3" />
            Pending
          </div>
        );
      case 'failed':
      case 'cancelled':
        return (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
            <XCircle className="h-3 w-3" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
            {status}
          </div>
        );
    }
  };

  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    failed: transactions.filter(t => t.status === 'failed' || t.status === 'cancelled').length,
    totalAmount: transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-[#6B7C3C]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3a3a3a]">M-Pesa Transactions</h1>
          <p className="text-gray-600 mt-1">View and manage all M-Pesa payment transactions</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchTransactions}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={exportToCSV}
            className="gap-2 bg-[#6B7C3C] hover:bg-[#5a6830]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-[#3a3a3a]">{stats.total}</p>
              </div>
              <CreditCard className="h-8 w-8 text-[#6B7C3C]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-[#6B7C3C]">
                KES {stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by phone, receipt, customer, property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-[#6B7C3C] hover:bg-[#5a6830]' : ''}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('completed')}
                className={statusFilter === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                className={statusFilter === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'failed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('failed')}
                className={statusFilter === 'failed' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Failed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </CardTitle>
          <CardDescription>
            {filteredTransactions.length === transactions.length
              ? 'Showing all M-Pesa transactions'
              : `Filtered from ${transactions.length} total transactions`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transactions found</p>
              {(searchTerm || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-gray-600">
                    <th className="pb-3 font-medium">Date & Time</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Property</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Receipt</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Checkout ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-4">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium text-[#3a3a3a]">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {new Date(transaction.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium text-[#3a3a3a]">
                              {transaction.customer_name || 'N/A'}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {transaction.customer_email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="font-mono">{transaction.phone_number}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Home className="h-4 w-4 text-gray-400" />
                          <span>{transaction.property_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="font-semibold text-[#6B7C3C]">
                          KES {parseFloat(transaction.amount).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="text-sm font-mono">
                          {transaction.mpesa_receipt_number || (
                            <span className="text-gray-400 italic">Pending</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="py-4">
                        <div className="text-xs font-mono text-gray-500 max-w-[150px] truncate">
                          {transaction.checkout_request_id}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}