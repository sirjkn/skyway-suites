import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Calendar, CreditCard, Mail, Phone, Pencil, Trash2 } from 'lucide-react';
import { getCustomers, Customer, createCustomer, updateCustomer, deleteCustomer } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';

export function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const data = await getCustomers();
    setCustomers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomer(formData);
      toast.success('Customer added successfully!');
      setShowAddDialog(false);
      setFormData({ name: '', email: '', phone: '' });
      loadCustomers();
    } catch (error) {
      toast.error('Failed to add customer');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      try {
        await updateCustomer(editingCustomer.id, formData);
        toast.success('Customer updated successfully!');
        setShowEditDialog(false);
        setFormData({ name: '', email: '', phone: '' });
        loadCustomers();
      } catch (error) {
        toast.error('Failed to update customer');
      }
    }
  };

  const handleDelete = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      toast.success('Customer deleted successfully!');
      loadCustomers();
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Customers</h1>
        <p className="text-gray-600">Manage your customer database</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
        <Link to="/admin/bookings">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Bookings
          </Button>
        </Link>
        <Link to="/admin/payments">
          <Button variant="outline">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-gray-600 mb-0.5">Total Customers</div>
            <div className="text-xl font-semibold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-gray-600 mb-0.5">Total Bookings</div>
            <div className="text-xl font-semibold">
              {customers.reduce((sum, c) => sum + c.totalBookings, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-gray-600 mb-0.5">New This Month</div>
            <div className="text-xl font-semibold text-green-600">
              {customers.filter(c => {
                const createdDate = new Date(c.createdAt);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && 
                       createdDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b text-sm">
                  <th className="text-left py-2 px-3 font-medium">Name</th>
                  <th className="text-left py-2 px-3 font-medium">Email</th>
                  <th className="text-left py-2 px-3 font-medium">Phone</th>
                  <th className="text-left py-2 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-blue-600">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="font-medium">{customer.name}</div>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        {customer.email}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={() => {
                            setEditingCustomer(customer);
                            setFormData({ name: customer.name, email: customer.email, phone: customer.phone });
                            setShowEditDialog(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this customer?')) {
                              handleDelete(customer.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog.Root open={showAddDialog} onOpenChange={setShowAddDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
            <Dialog.Title className="text-2xl mb-4">Add New Customer</Dialog.Title>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Full Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Phone</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="submit">Add Customer</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Customer Dialog */}
      <Dialog.Root open={showEditDialog} onOpenChange={setShowEditDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
            <Dialog.Title className="text-2xl mb-4">Edit Customer</Dialog.Title>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Full Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Phone</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="submit">Update Customer</Button>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}