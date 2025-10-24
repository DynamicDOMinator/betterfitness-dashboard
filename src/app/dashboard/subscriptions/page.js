'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Eye, CreditCard, Calendar, X, DollarSign, ArrowUpDown, ArrowUp, ArrowDown, Edit, Save, History, XCircle, FileText, Plus, Trash2, Settings, Receipt } from 'lucide-react';

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
    changeReason: '',
    nextPlan: {
      planName: '',
      duration: '',
      price: '',
      notes: ''
    }
  });
  const [updating, setUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelFormData, setCancelFormData] = useState({
    cancellationReason: '',
    refundAmount: '',
    refundStatus: 'not_applicable'
  });
  const [cancelling, setCancelling] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [userNotes, setUserNotes] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [noteFormData, setNoteFormData] = useState({
    content: '',
    noteId: null
  });
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNote, setDeletingNote] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusFormData, setStatusFormData] = useState({
    status: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showNextPlanModal, setShowNextPlanModal] = useState(false);
  const [nextPlanFormData, setNextPlanFormData] = useState({
    status: '',
    notes: ''
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentImageUrl, setPaymentImageUrl] = useState('');
  const [selectedPaymentSubscription, setSelectedPaymentSubscription] = useState(null);
  const [updatingNextPlan, setUpdatingNextPlan] = useState(false);

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
      const response = await fetch('https://dashboard.bettrfitness.com/users', {
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
        status: subscription.status || subscription.planStatus || 'active', // Use status first, then planStatus from API response
        createdAt: subscription.createdAt,
        duration: subscription.duration,
        image: subscription.image, // This should contain the image object with url property
        expirationDate: subscription.expirationDate,
        isExpired: subscription.isExpired,
        daysRemaining: subscription.daysRemaining,
        planHistory: subscription.planHistory || [],
        cancellationDetails: subscription.cancellationDetails || null, // Include cancellation details
        nextPlan: subscription.nextPlan || null // Add nextPlan field for future API integration
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
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 animate-pulse';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Helper function to check if subscription has a valid next plan
  const hasValidNextPlan = (subscription) => {
    return subscription.nextPlan && 
           subscription.nextPlan.planName && 
           subscription.nextPlan.planName.trim() !== '' &&
           subscription.nextPlan.addedAt; // Check if nextPlan has actual data, not just empty object
  };

  // Helper function to get next plan status color
  const getNextPlanStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
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

  const openPaymentModal = (imageUrl, subscription = null) => {
    setPaymentImageUrl(imageUrl);
    setSelectedPaymentSubscription(subscription);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentImageUrl('');
    setSelectedPaymentSubscription(null);
  };

  const openEditModal = (subscription) => {
    setSelectedSubscription(subscription);
    setEditFormData({
      planName: subscription.planName || '',
      duration: subscription.duration || '',
      price: subscription.price || '',
      startDate: subscription.createdAt ? new Date(subscription.createdAt).toISOString().split('T')[0] : '',
      changeReason: '',
      nextPlan: {
        planName: subscription.nextPlan?.planName || '',
        duration: subscription.nextPlan?.duration || '',
        price: subscription.nextPlan?.price || '',
        notes: subscription.nextPlan?.notes || ''
      }
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
      changeReason: '',
      nextPlan: {
        planName: '',
        duration: '',
        price: '',
        notes: ''
      }
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

      const response = await fetch(`https://dashboard.bettrfitness.com/admin/users/${selectedSubscription.id}/cancel`, {
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

  const openStatusModal = (subscription) => {
    setSelectedSubscription(subscription);
    setStatusFormData({
      status: subscription.status
    });
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedSubscription(null);
    setStatusFormData({
      status: ''
    });
  };

  const handleStatusFormChange = (e) => {
    const { name, value } = e.target;
    setStatusFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateStatus = async () => {
    if (!selectedSubscription || !statusFormData.status.trim()) {
      alert('Please select a status');
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await fetch(`https://dashboard.bettrfitness.com/users/${selectedSubscription.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: statusFormData.status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update the subscription in the local state
        const updatedSubscription = {
          ...selectedSubscription,
          status: statusFormData.status
        };

        setSubscriptions(prev => 
          prev.map(sub => sub.id === selectedSubscription.id ? updatedSubscription : sub)
        );

        alert('Status updated successfully!');
        closeStatusModal();
      } else {
        throw new Error(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status: ' + error.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nextPlan fields
    if (name.startsWith('nextPlan.')) {
      const fieldName = name.split('.')[1];
      setEditFormData(prev => ({
        ...prev,
        nextPlan: {
          ...prev.nextPlan,
          [fieldName]: value
        }
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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

      // Add nextPlan data if any fields are filled
      if (editFormData.nextPlan.planName || editFormData.nextPlan.duration || editFormData.nextPlan.price || editFormData.nextPlan.notes) {
        updateData.nextPlan = {
          planName: editFormData.nextPlan.planName || undefined,
          duration: editFormData.nextPlan.duration || undefined,
          price: editFormData.nextPlan.price ? parseFloat(editFormData.nextPlan.price) : undefined,
          notes: editFormData.nextPlan.notes || undefined
        };

        // Remove undefined values from nextPlan
        Object.keys(updateData.nextPlan).forEach(key => {
          if (updateData.nextPlan[key] === undefined) {
            delete updateData.nextPlan[key];
          }
        });
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const response = await fetch(`https://dashboard.bettrfitness.com/admin/users/${selectedSubscription.id}/plan`, {
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

  // Notes functionality
  const openNotesModal = async (subscription) => {
    setSelectedSubscription(subscription);
    setShowNotesModal(true);
    setNoteFormData({ content: '', noteId: null });
    await fetchUserNotes(subscription.id);
  };

  // Next Plan functionality
  const openNextPlanModal = (subscription) => {
    setSelectedSubscription(subscription);
    setNextPlanFormData({
      status: '',
      notes: ''
    });
    setShowNextPlanModal(true);
  };

  const closeNextPlanModal = () => {
    setShowNextPlanModal(false);
    setSelectedSubscription(null);
    setNextPlanFormData({
      status: '',
      notes: ''
    });
  };

  const handleNextPlanFormChange = (e) => {
    const { name, value } = e.target;
    setNextPlanFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNextPlanStatusUpdate = async () => {
    if (!selectedSubscription || !nextPlanFormData.status) {
      alert('Please select a status');
      return;
    }

    setUpdatingNextPlan(true);
    try {
      const response = await fetch(`https://dashboard.bettrfitness.com/admin/users/${selectedSubscription.id}/next-plan/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: nextPlanFormData.status,
          notes: nextPlanFormData.notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update next plan status');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update the subscription in the local state
        setSubscriptions(prev => 
          prev.map(sub => 
            sub.id === selectedSubscription.id 
              ? { 
                  ...sub, 
                  nextPlan: { 
                    ...sub.nextPlan, 
                    status: nextPlanFormData.status 
                  } 
                } 
              : sub
          )
        );

        alert('Next plan status updated successfully!');
        closeNextPlanModal();
      } else {
        throw new Error(result.message || 'Failed to update next plan status');
      }
    } catch (error) {
      console.error('Error updating next plan status:', error);
      alert('Failed to update next plan status: ' + error.message);
    } finally {
      setUpdatingNextPlan(false);
    }
  };

  const closeNotesModal = () => {
    setShowNotesModal(false);
    setSelectedSubscription(null);
    setUserNotes([]);
    setCurrentUserId(null);
    setNoteFormData({ content: '', noteId: null });
  };

  const fetchUserNotes = async (userId) => {
    setLoadingNotes(true);
    try {
      const response = await fetch(`https://dashboard.bettrfitness.com/users/${userId}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const result = await response.json();
      if (result.success) {
        setUserNotes(result.data.notes || []);
        setCurrentUserId(result.data.user.id); // Store the actual user ID from API
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      setUserNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleNoteFormChange = (e) => {
    const { name, value } = e.target;
    setNoteFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveNote = async () => {
    if (!selectedSubscription || !noteFormData.content.trim()) {
      alert('Please enter note content');
      return;
    }

    setSavingNote(true);
    try {
      let requestBody;
      
      if (noteFormData.noteId) {
        // Editing existing note - include both content and noteId
        requestBody = {
          content: noteFormData.content,
          noteId: noteFormData.noteId
        };
      } else {
        // Creating new note - only content
        requestBody = {
          content: noteFormData.content
        };
      }

      const response = await fetch(`https://dashboard.bettrfitness.com/users/${currentUserId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      const result = await response.json();
      if (result.success) {
        alert(noteFormData.noteId ? 'Note updated successfully!' : 'Note added successfully!');
        setNoteFormData({ content: '', noteId: null });
        await fetchUserNotes(selectedSubscription.id); // Refresh notes
      } else {
        throw new Error(result.message || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note: ' + error.message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleEditNote = (note) => {
    setNoteFormData({
      content: note.content,
      noteId: note._id
    });
  };

  const cancelEditNote = () => {
    setNoteFormData({ content: '', noteId: null });
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    setDeletingNote(noteId);
    try {
      const response = await fetch(`https://dashboard.bettrfitness.com/users/${currentUserId}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      const result = await response.json();
      if (result.success) {
        alert('Note deleted successfully!');
        // If we were editing this note, clear the form
        if (noteFormData.noteId === noteId) {
          setNoteFormData({ content: '', noteId: null });
        }
        await fetchUserNotes(selectedSubscription.id); // Refresh notes
      } else {
        throw new Error(result.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note: ' + error.message);
    } finally {
      setDeletingNote(null);
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
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Created Date</span>
                      {getSortIcon('createdAt')}
                    </div>
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
                        <div className={`h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 ${
                          subscription.status === 'cancelled' 
                            ? 'border-red-300 dark:border-red-600 opacity-75' 
                            : 'border-gray-200 dark:border-gray-600'
                        }`}>
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
                      } flex items-center`}>
                        {subscription.name}
                        {hasValidNextPlan(subscription) && (
                          <div className="ml-2 relative flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping absolute"></div>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{subscription.email}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{subscription.phone}</div>
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
                       <p className={` w-fit mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(subscription)}`}>
                        {subscription.duration}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(subscription.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                        {subscription.status === 'pending' && (
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-1"></div>
                        )}
                        {subscription.status}
                      </span>
                      {subscription.status === 'active' && subscription.daysRemaining && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {subscription.daysRemaining} days left
                        </div>
                      )}
                    </td>
                 
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(subscription.createdAt)}
                    </td>

   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {subscription.expirationDate ? formatDate(subscription.expirationDate) : 'N/A'}
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
                        <button
                          onClick={() => openNotesModal(subscription)}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 flex items-center space-x-1"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Notes</span>
                        </button>
                        <button
                          onClick={() => openStatusModal(subscription)}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 flex items-center space-x-1"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Status</span>
                        </button>
                        <button
                          onClick={() => {
                            // Build image URL from subscription data
                            let imageUrl = '';
                            if (subscription.image && subscription.image.filename) {
                              imageUrl = `https://dashboard.bettrfitness.com/uploads/${subscription.image.filename}`;
                            } else if (subscription.nextPlan && subscription.nextPlan.image && subscription.nextPlan.image.filename) {
                              imageUrl = `https://dashboard.bettrfitness.com/uploads/${subscription.nextPlan.image.filename}`;
                            } else {
                              // Fallback to a default image or show error
                              imageUrl = 'https://dashboard.bettrfitness.com/uploads/image-1761313343971-632279523.png';
                            }
                            openPaymentModal(imageUrl, subscription);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center space-x-1"
                        >
                          <Receipt className="h-4 w-4" />
                          <span>Payment</span>
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

        {/* Status Change Modal */}
        {showStatusModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black/20 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 transform transition-all">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Change Status for {selectedSubscription.name}
                  </h3>
                  <button
                    onClick={closeStatusModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Status: 
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSubscription.status)} ml-2`}>
                        {selectedSubscription.status === 'pending' && (
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-1"></div>
                        )}
                        {selectedSubscription.status}
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Status
                    </label>
                    <select
                      name="status"
                      value={statusFormData.status}
                      onChange={handleStatusFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="expired">Expired</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={closeStatusModal}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus || statusFormData.status === selectedSubscription.status}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {updatingStatus ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4" />
                        <span>Update Status</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Payment Verification Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-xl bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Payment Verification - {selectedPaymentSubscription?.name || 'User'}
                </h3>
                <button
                  onClick={closePaymentModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {selectedPaymentSubscription && (
                  <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Current Plan */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Current Plan</h4>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Plan:</span> {selectedPaymentSubscription.planName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Price:</span> ${selectedPaymentSubscription.price}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Status:</span> 
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                              selectedPaymentSubscription.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : selectedPaymentSubscription.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {selectedPaymentSubscription.status}
                            </span>
                          </p>
                          {selectedPaymentSubscription.image && selectedPaymentSubscription.image.filename && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Image:</p>
                              <div className="relative w-full h-48">
                                <Image
                                  src={`https://dashboard.bettrfitness.com/uploads/${selectedPaymentSubscription.image.filename}`}
                                  alt="Current Plan Payment"
                                  fill
                                  className="rounded-lg shadow-sm object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500 dark:text-gray-400 text-sm" style={{ display: 'none' }}>
                                  Unable to load current plan image
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Next Plan */}
                      {selectedPaymentSubscription.nextPlan && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Next Plan</h4>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Plan:</span> {selectedPaymentSubscription.nextPlan.planName || 'Not specified'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Price:</span> ${selectedPaymentSubscription.nextPlan.price || 'Not specified'}
                            </p>
                            {selectedPaymentSubscription.nextPlan.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Notes:</span> {selectedPaymentSubscription.nextPlan.notes}
                              </p>
                            )}
                            {selectedPaymentSubscription.nextPlan.image && selectedPaymentSubscription.nextPlan.image.filename && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Image:</p>
                                <div className="relative w-full h-48">
                                  <Image
                                    src={`https://dashboard.bettrfitness.com/uploads/${selectedPaymentSubscription.nextPlan.image.filename}`}
                                    alt="Next Plan Payment"
                                    fill
                                    className="rounded-lg shadow-sm object-contain"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'block';
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500 dark:text-gray-400 text-sm" style={{ display: 'none' }}>
                                    Unable to load next plan image
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Main Payment Image */}
                <div className="flex justify-center">
                  <div className="max-w-4xl w-full">
                   
                    <div className="relative w-full">
                   
                      <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500 dark:text-gray-400" style={{ display: 'none' }}>
                        <div>
                          <p>Unable to load payment image</p>
                          <p className="text-sm mt-2">URL: {paymentImageUrl}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closePaymentModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
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
                               className={`h-20 w-20 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg`}
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
                        
                        {/* Subscription Info integrated into Plan Details */}
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-4">
                          <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subscription Info</h6>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {selectedSubscription.createdAt ? new Date(selectedSubscription.createdAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Expiration Date:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {selectedSubscription.expirationDate ? new Date(selectedSubscription.expirationDate).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Days Remaining:</span>
                              <span className={`font-medium ${
                                selectedSubscription.daysRemaining > 30 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : selectedSubscription.daysRemaining > 7 
                                  ? 'text-orange-600 dark:text-orange-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {selectedSubscription.daysRemaining || 0} days
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Status:</span>
                              <span className={`font-medium ${getStatusColor(selectedSubscription.status)}`}>
                                {selectedSubscription.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-600">
                      <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                        Next Plan
                      </h5>
                      {selectedSubscription.nextPlan ? (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Plan Name:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedSubscription.nextPlan.planName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Price:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {formatCurrency(selectedSubscription.nextPlan.price)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedSubscription.nextPlan.duration}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Scheduled Start Date:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedSubscription.nextPlan.scheduledStartDate 
                                ? new Date(selectedSubscription.nextPlan.scheduledStartDate).toLocaleDateString()
                                : 'N/A'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Scheduled Expiration Date:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedSubscription.nextPlan.scheduledExpirationDate 
                                ? new Date(selectedSubscription.nextPlan.scheduledExpirationDate).toLocaleDateString()
                                : 'N/A'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Added By:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedSubscription.nextPlan.addedBy || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Added At:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedSubscription.nextPlan.addedAt 
                                ? new Date(selectedSubscription.nextPlan.addedAt).toLocaleDateString()
                                : 'N/A'
                              }
                            </span>
                          </div>
                          {selectedSubscription.nextPlan.notes && (
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-4">
                              <span className="text-gray-600 dark:text-gray-400 block mb-2">Notes:</span>
                              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {selectedSubscription.nextPlan.notes}
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getNextPlanStatusColor(selectedSubscription.nextPlan.status)}`}>
                              {selectedSubscription.nextPlan.status || 'pending'}
                            </span>
                          </div>
                          
                          {/* Action buttons for pending status */}
                          {selectedSubscription.nextPlan.status === 'pending' && (
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                              <div className="flex justify-end space-x-3">
                                <button
                                  onClick={() => {
                                    setNextPlanFormData({
                                      status: 'rejected',
                                      notes: ''
                                    });
                                    setShowNextPlanModal(true);
                                  }}
                                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span>Reject</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setNextPlanFormData({
                                      status: 'approved',
                                      notes: ''
                                    });
                                    setShowNextPlanModal(true);
                                  }}
                                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                                >
                                  <Calendar className="h-4 w-4" />
                                  <span>Approve</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400">No next plan scheduled</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Schedule a next plan to see details here</p>
                        </div>
                      )}
                    </div>

                    {/* Plan History Section */}
                    <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <History className="h-5 w-5 mr-2 text-purple-600" />
                        Plan History
                      </h4>
                      
                      {selectedSubscription.planHistory && selectedSubscription.planHistory.length > 0 ? (
                        <div className="space-y-4 max-h-64 overflow-y-auto">
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

                <div className="max-w-2xl mx-auto">
                  {/* Schedule Next Plan Section */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-green-600" />
                      Schedule Next Plan
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Next Plan Name
                        </label>
                        <select
                          name="nextPlan.planName"
                          value={editFormData.nextPlan.planName}
                          onChange={handleEditFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select Next Plan</option>
                          <option value="Regular - Diet only">Regular - Diet only</option>
                          <option value="Regular - Diet & Exercise">Regular - Diet & Exercise</option>
                          <option value="Advanced coaching">Advanced coaching</option>
                          <option value="Elite athlete">Elite athlete</option>
                          <option value="VIP Plan">VIP Plan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Next Plan Duration
                        </label>
                        <select
                          name="nextPlan.duration"
                          value={editFormData.nextPlan.duration}
                          onChange={handleEditFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select Duration</option>
                          <option value="1 month">1 month</option>
                          <option value="3 months">3 months</option>
                          <option value="6 months">6 months</option>
                          <option value="12 months">12 months</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Next Plan Price ($)
                        </label>
                        <input
                          type="number"
                          name="nextPlan.price"
                          value={editFormData.nextPlan.price}
                          onChange={handleEditFormChange}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter next plan price"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Notes
                        </label>
                        <textarea
                          name="nextPlan.notes"
                          value={editFormData.nextPlan.notes}
                          onChange={handleEditFormChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Notes about the next plan (e.g., 'Upgrade to VIP after current plan expires')"
                        />
                      </div>
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
                       <h4 className="font-medium text-red-900 dark:text-red-100">Cancel {selectedSubscription.name}&apos;s Subscription</h4>
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

        {/* Notes Modal */}
        {showNotesModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black/20 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 transform transition-all">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Notes for {selectedSubscription.name}
                  </h3>
                  <button
                    onClick={closeNotesModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Add/Edit Note Form */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    {noteFormData.noteId ? 'Edit Note' : 'Add New Note'}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Note Content
                      </label>
                      <textarea
                        name="content"
                        value={noteFormData.content}
                        onChange={handleNoteFormChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Enter your note here..."
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      {noteFormData.noteId && (
                        <button
                          onClick={cancelEditNote}
                          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        onClick={handleSaveNote}
                        disabled={savingNote || !noteFormData.content.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {savingNote ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>{noteFormData.noteId ? 'Update Note' : 'Add Note'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes List */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Existing Notes ({userNotes.length})
                  </h4>
                  
                  {loadingNotes ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : userNotes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No notes found for this user.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {userNotes.map((note) => (
                        <div key={note._id} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{note.content}</p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => handleEditNote(note)}
                                className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 flex items-center space-x-1"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note._id)}
                                disabled={deletingNote === note._id}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingNote === note._id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                    <span>Deleting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex flex-wrap gap-4">
                              <span>Added by: {note.addedByName}</span>
                              <span>Created: {new Date(note.createdAt).toLocaleString()}</span>
                              {note.lastEditedAt && (
                                <span>Last edited: {new Date(note.lastEditedAt).toLocaleString()} by {note.lastEditedByName}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Plan Modal */}
        {showNextPlanModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black/20 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 transform transition-all">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Next Plan for {selectedSubscription.name}
                  </h3>
                  <button
                    onClick={closeNextPlanModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {selectedSubscription.nextPlan && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Plan Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Plan:</span> {selectedSubscription.nextPlan.planName}</div>
                        <div><span className="font-medium">Duration:</span> {selectedSubscription.nextPlan.duration}</div>
                        <div><span className="font-medium">Price:</span> ${selectedSubscription.nextPlan.price}</div>
                        <div><span className="font-medium">Start Date:</span> {formatDate(selectedSubscription.nextPlan.scheduledStartDate)}</div>
                        <div><span className="font-medium">Current Status:</span> 
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${getNextPlanStatusColor(selectedSubscription.nextPlan.status)}`}>
                            {selectedSubscription.nextPlan.status}
                          </span>
                        </div>
                        {selectedSubscription.nextPlan.notes && (
                          <div><span className="font-medium">Notes:</span> {selectedSubscription.nextPlan.notes}</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Update Status
                      </label>
                      <select
                        name="status"
                        value={nextPlanFormData.status}
                        onChange={handleNextPlanFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select status</option>
                        <option value="approved">Approve</option>
                        <option value="rejected">Reject</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        name="notes"
                        value={nextPlanFormData.notes}
                        onChange={handleNextPlanFormChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Add notes about this decision..."
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={closeNextPlanModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleNextPlanStatusUpdate}
                        disabled={updatingNextPlan || !nextPlanFormData.status}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center space-x-2"
                      >
                        {updatingNextPlan && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        <span>{updatingNextPlan ? 'Updating...' : 'Update Status'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </DashboardLayout>
    );
  }