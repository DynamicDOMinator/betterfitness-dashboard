'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Eye, CreditCard, Calendar, X, DollarSign, ArrowUpDown, ArrowUp, ArrowDown, Edit, Save, History, XCircle } from 'lucide-react';

export default function SubscriptionsPage() {
  const { token } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('');
  const [editFormData, setEditFormData] = useState({
    planName: '',
    duration: '',
    price: '',
    startDate: '',
    changeReason: ''
  });
  const [updating, setUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelFormData, setCancelFormData] = useState({
    cancellationReason: '',
    refundAmount: '',
    refundStatus: 'not_applicable'
  });
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (token) {
      fetchSubscriptions();
    }
  }, [token]);

  useEffect(() => {
    let filtered = subscriptions.filter(subscription =>
      subscription.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.planName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(subscription => 
        subscription.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply sorting
    if (sortBy) {
      filtered = filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'status':
            aValue = a.status.toLowerCase();
            bValue = b.status.toLowerCase();
            break;
          case 'expirationDate':
            aValue = a.expirationDate ? new Date(a.expirationDate) : new Date(0);
            bValue = b.expirationDate ? new Date(b.expirationDate) : new Date(0);
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
            break;
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'price':
            aValue = parseFloat(a.price) || 0;
            bValue = parseFloat(b.price) || 0;
            break;
          default:
            return 0;
        }

        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchTerm, sortBy, sortOrder, statusFilter]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('http://localhost:3000/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      const result = await response.json();
      
      // Handle the API response structure with success, message, and data fields
      const data = result.success ? result.data : [];
      
      // Transform the data to match our expected structure
      const transformedData = data.map(subscription => ({
        id: subscription._id,
        name: subscription.name,
        email: subscription.email,
        phone: subscription.phone,
        planName: subscription.planName,
        price: subscription.price,
        status: subscription.planStatus || (subscription.isExpired ? 'expired' : 'active'), // Use planStatus first, then fallback to isExpired
        createdAt: subscription.createdAt,
        duration: subscription.duration,
        image: subscription.image, // This should contain the image object with url property
        expirationDate: subscription.expirationDate,
        isExpired: subscription.isExpired,
        daysRemaining: subscription.daysRemaining,
        planHistory: subscription.planHistory || [],
        cancellationDetails: subscription.cancellationDetails || null // Include cancellation details
      }));
      
      setSubscriptions(transformedData);
      setFilteredSubscriptions(transformedData);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setSubscriptions([]);
      setFilteredSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPlanColor = (subscription) => {
    const planName = subscription.planName.toLowerCase();
    if (planName.includes('premium') || planName.includes('pro')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    } else if (planName.includes('basic') || planName.includes('starter')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    } else if (planName.includes('enterprise') || planName.includes('business')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const openModal = (subscription) => {
    setSelectedSubscription(subscription);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSubscription(null);
  };

  const openEditModal = (subscription) => {
    setSelectedSubscription(subscription);
    setEditFormData({
      planName: subscription.planName || '',
      duration: subscription.duration || '',
      price: subscription.price || '',
      startDate: subscription.createdAt ? new Date(subscription.createdAt).toISOString().split('T')[0] : '',
      changeReason: ''
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedSubscription(null);
    setEditFormData({
      planName: '',
      duration: '',
      price: '',
      startDate: '',
      changeReason: ''
    });
  };

  const openCancelModal = (subscription) => {
    setSelectedSubscription(subscription);
    setCancelFormData({
      cancellationReason: '',
      refundAmount: '',
      refundStatus: 'not_applicable'
    });
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedSubscription(null);
    setCancelFormData({
      cancellationReason: '',
      refundAmount: '',
      refundStatus: 'not_applicable'
    });
  };

  const handleCancelFormChange = (e) => {
    const { name, value } = e.target;
    setCancelFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription || !cancelFormData.cancellationReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    setCancelling(true);
    try {
      const cancelData = {
        cancellationReason: cancelFormData.cancellationReason,
        refundAmount: cancelFormData.refundAmount ? parseFloat(cancelFormData.refundAmount) : null,
        refundStatus: cancelFormData.refundStatus || null
      };

      const response = await fetch(`http://localhost:3000/admin/users/${selectedSubscription.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cancelData)
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update the subscription in the local state
        const updatedSubscription = {
          ...selectedSubscription,
          status: 'cancelled',
          isExpired: true
        };

        setSubscriptions(prev => 
          prev.map(sub => sub.id === selectedSubscription.id ? updatedSubscription : sub)
        );

        alert('Subscription cancelled successfully!');
        closeCancelModal();
      } else {
        throw new Error(result.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription: ' + error.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateSubscription = async () => {
    if (!selectedSubscription) return;

    setUpdating(true);
    try {
      const updateData = {
        planName: editFormData.planName || undefined,
        duration: editFormData.duration || undefined,
        price: editFormData.price ? parseFloat(editFormData.price) : undefined,
        startDate: editFormData.startDate ? new Date(editFormData.startDate).toISOString() : undefined,
        changeReason: editFormData.changeReason || undefined
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const response = await fetch(`http://localhost:3000/admin/users/${selectedSubscription.id}/plan`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update the subscription in the local state
        const updatedSubscription = {
          ...selectedSubscription,
          planName: result.data.planName,
          duration: result.data.duration,
          price: result.data.price,
          expirationDate: result.data.expirationDate,
          daysRemaining: result.data.daysRemaining,
          isExpired: result.data.isExpired,
          status: result.data.isExpired ? 'expired' : 'active',
          planHistory: result.data.planHistory || []
        };

        setSubscriptions(prev => 
          prev.map(sub => sub.id === selectedSubscription.id ? updatedSubscription : sub)
        );

        alert('Subscription updated successfully!');
        closeEditModal();
      } else {
        throw new Error(result.message || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const totalRevenue = filteredSubscriptions.reduce((sum, sub) => {
    return sum + (parseFloat(sub.price) || 0);
  }, 0);

  // Calculate total active subscriptions (non-expired)
  const totalActiveSubscriptions = filteredSubscriptions.filter(sub => !sub.isExpired).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage user subscriptions and billing</p>
          </div>
          <div className="flex space-x-4">
            <div className="bg-green-100 dark:bg-green-900 px-4 py-2 rounded-lg">
              <span className="text-green-800 dark:text-green-200 font-medium">
                {formatCurrency(totalRevenue)} Revenue
              </span>
            </div>
            <div className="bg-emerald-100 dark:bg-emerald-900 px-4 py-2 rounded-lg">
              <span className="text-emerald-800 dark:text-emerald-200 font-medium">
                {totalActiveSubscriptions} Active
              </span>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg">
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                {filteredSubscriptions.length} Total
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search subscriptions..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Sort and Filter Dropdowns */}
          <div className="flex gap-2">
            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sort by...</option>
              <option value="status">Status</option>
              <option value="expirationDate">Expiry Date</option>
              <option value="createdAt">Created Date</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>
            
            {sortBy && (
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg border dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Image
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>User Info</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Plan
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Price</span>
                      {getSortIcon('price')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('expirationDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Expiration</span>
                      {getSortIcon('expirationDate')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Created Date</span>
                      {getSortIcon('createdAt')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    subscription.status === 'cancelled' 
                      ? 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500' 
                      : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex-shrink-0 h-12 w-12">
                        {(() => {
                          const imageUrl = subscription.image?.url;
                          
                          if (imageUrl) {
                            return (
                              <img
                                className={`h-12 w-12 rounded-full object-cover border-2 ${
                                  subscription.status === 'cancelled' 
                                    ? 'border-red-300 dark:border-red-600 opacity-75' 
                                    : 'border-gray-200 dark:border-gray-600'
                                }`}
                                src={imageUrl}
                                alt={subscription.name}
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  console.error('Failed to load image:', imageUrl);
                                  const initials = subscription.name
                                    ?.split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2) || '??';
                                  
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                                onLoad={() => {
                                  console.log('Table image loaded successfully:', imageUrl);
                                }}
                              />
                            );
                          } else {
                            const initials = subscription.name
                              ?.split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2) || '??';
                            
                            return (
                              <div className={`h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 ${
                                subscription.status === 'cancelled' 
                                  ? 'border-red-300 dark:border-red-600 opacity-75' 
                                  : 'border-gray-200 dark:border-gray-600'
                              }`}>
                                <span className="text-white text-sm font-bold">{initials}</span>
                              </div>
                            );
                          }
                        })()}
                        {/* Fallback div for failed image loads */}
                        <div 
                          className={`h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 ${
                            subscription.status === 'cancelled' 
                              ? 'border-red-300 dark:border-red-600 opacity-75' 
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                          style={{display: 'none'}}
                        >
                          <span className="text-white text-sm font-bold">
                            {subscription.name
                              ?.split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2) || '??'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        subscription.status === 'cancelled' 
                          ? 'text-gray-600 dark:text-gray-400' 
                          : 'text-gray-900 dark:text-white'
                      }`}>{subscription.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{subscription.email}</div>
                      {subscription.status === 'cancelled' && subscription.cancellationDetails && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Cancelled: {new Date(subscription.cancellationDetails.cancelledAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(subscription)}`}>
                        {subscription.planName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(subscription.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                        {subscription.status}
                      </span>
                      {subscription.status === 'active' && subscription.daysRemaining && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {subscription.daysRemaining} days left
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {subscription.expirationDate ? formatDate(subscription.expirationDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(subscription.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal(subscription)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => openEditModal(subscription)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center space-x-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        {subscription.status === 'active' && (
                          <button
                            onClick={() => openCancelModal(subscription)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center space-x-1"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No subscriptions found</p>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black/20 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 transform transition-all">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Subscription Details</h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
            
                <div className="space-y-4">
                  <div className="flex items-center space-x-6 mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0 h-20 w-20">
                      {(() => {
                        const imageUrl = selectedSubscription.image?.url;
                        
                        if (imageUrl) {
                           return (
                             <img
                               className="h-20 w-20 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg"
                               src={imageUrl}
                               alt={selectedSubscription.name}
                               crossOrigin="anonymous"
                               onError={(e) => {
                                 console.error('Failed to load image:', imageUrl);
                                 const initials = selectedSubscription.name
                                   ?.split(' ')
                                   .map(n => n[0])
                                   .join('')
                                   .toUpperCase()
                                   .slice(0, 2) || '??';
                                 
                                 e.target.style.display = 'none';
                                 e.target.nextElementSibling.style.display = 'flex';
                               }}
                               onLoad={() => {
                                 console.log('Modal image loaded successfully:', imageUrl);
                               }}
                             />
                           );
                        } else {
                          const initials = selectedSubscription.name
                            ?.split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || '??';
                          
                          return (
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white dark:border-gray-600 shadow-lg">
                              <span className="text-white text-xl font-bold">{initials}</span>
                            </div>
                          );
                        }
                      })()} 
                      {/* Fallback div for failed image loads */}
                      <div 
                        className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white dark:border-gray-600 shadow-lg" 
                        style={{display: 'none'}}
                      >
                        <span className="text-white text-xl font-bold">
                          {selectedSubscription.name
                            ?.split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || '??'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{selectedSubscription.name}</h4>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">{selectedSubscription.email}</p>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedSubscription.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {selectedSubscription.status}
                        </span>
                        {selectedSubscription.status === 'active' && selectedSubscription.daysRemaining && (
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {selectedSubscription.daysRemaining} days remaining
                          </span>
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Member since {new Date(selectedSubscription.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-600">
                      <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                        Plan Details
                      </h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Plan Name:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedSubscription.planName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Price:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(selectedSubscription.price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedSubscription.duration || 'Monthly'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-600">
                      <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                        Subscription Info
                      </h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(selectedSubscription.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Expiration Date:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedSubscription.expirationDate 
                              ? new Date(selectedSubscription.expirationDate).toLocaleDateString()
                              : 'N/A'
                            }
                          </span>
                        </div>
                        {selectedSubscription.status === 'active' && selectedSubscription.daysRemaining && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Days Remaining:</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {selectedSubscription.daysRemaining} days
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className={`font-medium ${getStatusColor(selectedSubscription.status).includes('green') 
                              ? 'text-green-600 dark:text-green-400' 
                              : getStatusColor(selectedSubscription.status).includes('red')
                              ? 'text-red-600 dark:text-red-400'
                              : getStatusColor(selectedSubscription.status).includes('orange')
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {selectedSubscription.status}
                          </span>
                        </div>
                       
                      </div>
                    </div>

                    {/* Cancellation Details Section */}
                    {selectedSubscription.status === 'cancelled' && selectedSubscription.cancellationDetails && (
                      <div className="md:col-span-2 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
                        <h5 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-4 flex items-center">
                          <XCircle className="h-5 w-5 mr-2 text-red-600" />
                          Cancellation Details
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-red-700 dark:text-red-300">Cancelled Date:</span>
                              <span className="font-medium text-red-900 dark:text-red-200">
                                {new Date(selectedSubscription.cancellationDetails.cancelledAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-700 dark:text-red-300">Cancelled By:</span>
                              <span className="font-medium text-red-900 dark:text-red-200">
                                {selectedSubscription.cancellationDetails.cancelledBy}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-red-700 dark:text-red-300">Refund Amount:</span>
                              <span className="font-medium text-red-900 dark:text-red-200">
                                {selectedSubscription.cancellationDetails.refundAmount 
                                  ? formatCurrency(selectedSubscription.cancellationDetails.refundAmount)
                                  : 'N/A'
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-700 dark:text-red-300">Refund Status:</span>
                              <span className="font-medium text-red-900 dark:text-red-200 capitalize">
                                {selectedSubscription.cancellationDetails.refundStatus?.replace('_', ' ') || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="flex flex-col">
                              <span className="text-red-700 dark:text-red-300 mb-2">Cancellation Reason:</span>
                              <span className="font-medium text-red-900 dark:text-red-200 bg-red-100 dark:bg-red-900/40 p-3 rounded-md">
                                {selectedSubscription.cancellationDetails.cancellationReason}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black/20 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 transform transition-all">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Subscription - {selectedSubscription.name}</h3>
                  <button
                    onClick={closeEditModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Update Form */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Edit className="h-5 w-5 mr-2 text-blue-600" />
                        Update Plan Details
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Plan Name
                          </label>
                          <select
                             name="planName"
                             value={editFormData.planName}
                             onChange={handleEditFormChange}
                             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                           >
                             <option value="">Select Plan</option>
                             <option value="Regular - Diet only">Regular - Diet only</option>
                             <option value="Regular - Diet & Exercise">Regular - Diet & Exercise</option>
                             <option value="Advanced coaching">Advanced coaching</option>
                             <option value="Elite athlete">Elite athlete</option>
                           </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Duration
                          </label>
                          <select
                            name="duration"
                            value={editFormData.duration}
                            onChange={handleEditFormChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select Duration</option>
                            <option value="1 month">1 month</option>
                            <option value="3 month">3 months</option>
                            <option value="6 month">6 months</option>
                            <option value="12 month">12 months</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Price ($)
                          </label>
                          <input
                            type="number"
                            name="price"
                            value={editFormData.price}
                            onChange={handleEditFormChange}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Enter price"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={editFormData.startDate}
                            onChange={handleEditFormChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Change Reason
                          </label>
                          <textarea
                            name="changeReason"
                            value={editFormData.changeReason}
                            onChange={handleEditFormChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Reason for this change (optional)"
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          onClick={closeEditModal}
                          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateSubscription}
                          disabled={updating}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                          {updating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              <span>Update Plan</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Plan History */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <History className="h-5 w-5 mr-2 text-purple-600" />
                        Plan History
                      </h4>
                      
                      {selectedSubscription.planHistory && selectedSubscription.planHistory.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {selectedSubscription.planHistory.map((history, index) => (
                            <div key={history._id || index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-600">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-medium text-gray-900 dark:text-white">{history.planName}</h5>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(history.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                                  <span className="text-gray-900 dark:text-white">{history.duration}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Price:</span>
                                  <span className="text-green-600 dark:text-green-400">{formatCurrency(history.price)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Period:</span>
                                  <span className="text-gray-900 dark:text-white">
                                    {new Date(history.startDate).toLocaleDateString()} - {new Date(history.expirationDate).toLocaleDateString()}
                                  </span>
                                </div>
                                {history.changedBy && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Changed by:</span>
                                    <span className="text-gray-900 dark:text-white">{history.changedBy}</span>
                                  </div>
                                )}
                                {history.changeReason && (
                                  <div className="mt-2">
                                    <span className="text-gray-600 dark:text-gray-400">Reason:</span>
                                    <p className="text-gray-900 dark:text-white mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                      {history.changeReason}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <History className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400">No plan history available</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">History will appear here after plan updates</p>
                        </div>
                      )}
                    </div>

                    {/* Current Plan Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Current Plan
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Plan:</span>
                          <span className="font-medium text-blue-900 dark:text-blue-100">{selectedSubscription.planName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Duration:</span>
                          <span className="font-medium text-blue-900 dark:text-blue-100">{selectedSubscription.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Price:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(selectedSubscription.price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Status:</span>
                          <span className={`font-medium ${selectedSubscription.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {selectedSubscription.status}
                          </span>
                        </div>
                        {selectedSubscription.daysRemaining && (
                          <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">Days Remaining:</span>
                            <span className="font-medium text-blue-900 dark:text-blue-100">{selectedSubscription.daysRemaining} days</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}
          {/* Cancel Modal */}
          {showCancelModal && selectedSubscription && (
           <div className="fixed inset-0 bg-black/20 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
             <div className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 transform transition-all">
               <div className="p-6">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Cancel Subscription</h3>
                   <button
                     onClick={closeCancelModal}
                     className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-colors"
                   >
                     <X className="h-5 w-5" />
                   </button>
                 </div>

                 <div className="mb-6">
                   <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                     <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                     <div>
                       <h4 className="font-medium text-red-900 dark:text-red-100">Cancel {selectedSubscription.name}'s Subscription</h4>
                       <p className="text-sm text-red-700 dark:text-red-300">This action cannot be undone.</p>
                     </div>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Cancellation Reason <span className="text-red-500">*</span>
                     </label>
                     <textarea
                       name="cancellationReason"
                       value={cancelFormData.cancellationReason}
                       onChange={handleCancelFormChange}
                       rows="3"
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                       placeholder="Please provide a reason for cancellation..."
                       required
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Refund Amount ($)
                     </label>
                     <input
                       type="number"
                       name="refundAmount"
                       value={cancelFormData.refundAmount}
                       onChange={handleCancelFormChange}
                       min="0"
                       step="0.01"
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                       placeholder="Enter refund amount (optional)"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Refund Status
                     </label>
                     <select
                       name="refundStatus"
                       value={cancelFormData.refundStatus}
                       onChange={handleCancelFormChange}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                     >
                       <option value="not_applicable">Not Applicable</option>
                       <option value="pending">Pending</option>
                       <option value="processed">Processed</option>
                       <option value="failed">Failed</option>
                     </select>
                   </div>
                 </div>

                 <div className="mt-6 flex justify-end space-x-3">
                   <button
                     onClick={closeCancelModal}
                     className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleCancelSubscription}
                     disabled={cancelling || !cancelFormData.cancellationReason.trim()}
                     className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                   >
                     {cancelling ? (
                       <>
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                         <span>Cancelling...</span>
                       </>
                     ) : (
                       <>
                         <XCircle className="h-4 w-4" />
                         <span>Cancel Subscription</span>
                       </>
                     )}
                   </button>
                 </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }