'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  Calendar, 
  RefreshCw, 
  BarChart3, 
  PieChart, 
  Activity,
  Clock,
  Target,
  Wallet
} from 'lucide-react';

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch subscription data to calculate revenue and refunds
      const response = await fetch('https://dashboard.bettrfitness.com/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const subscriptions = result.data;
        
        // Calculate analytics from subscription data
        const calculatedAnalytics = calculateAnalytics(subscriptions);
        setAnalytics(calculatedAnalytics);
      } else {
        throw new Error(result.message || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (subscriptions) => {
    const totalUsers = subscriptions.length;
    const activeUsers = subscriptions.filter(sub => sub.planStatus === 'active').length;
    const cancelledUsers = subscriptions.filter(sub => sub.planStatus === 'cancelled').length;
    
    // Calculate total revenue from all subscription payments (current + history)
    const totalRevenue = subscriptions.reduce((sum, sub) => {
      let userRevenue = sub.price || 0; // Current subscription price
      
      // Add revenue from plan history
      if (sub.planHistory && sub.planHistory.length > 0) {
        sub.planHistory.forEach(historyItem => {
          userRevenue += historyItem.price || 0;
        });
      }
      
      return sum + userRevenue;
    }, 0);
    
    // Calculate total refunds from cancellation details
    const totalRefunds = subscriptions.reduce((sum, sub) => {
      if (sub.cancellationDetails && sub.cancellationDetails.refundAmount) {
        return sum + sub.cancellationDetails.refundAmount;
      }
      return sum;
    }, 0);
    
    // Calculate net revenue (total revenue - refunds)
    const netRevenue = totalRevenue - totalRefunds;
    
    // Calculate renewal rate
    const expiredUsers = subscriptions.filter(sub => sub.isExpired).length;
    const renewedUsers = subscriptions.filter(sub => !sub.isExpired && sub.planHistory.length > 0).length;
    const renewalRate = expiredUsers > 0 ? Math.round((renewedUsers / (renewedUsers + expiredUsers)) * 100) : 0;
    
    // Calculate average subscription duration
    const totalDays = subscriptions.reduce((sum, sub) => {
      const createdDate = new Date(sub.createdAt);
      const currentDate = new Date();
      const daysDiff = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
      return sum + daysDiff;
    }, 0);
    const avgDays = totalUsers > 0 ? Math.round(totalDays / totalUsers) : 0;
    const avgMonths = Math.round(avgDays / 30 * 10) / 10;
    
    // Calculate lifetime value
    const averageLTV = totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0;
    
    // Calculate revenue per plan
    const planRevenue = {};
    subscriptions.forEach(sub => {
      if (!planRevenue[sub.planName]) {
        planRevenue[sub.planName] = {
          totalRevenue: 0,
          userCount: 0
        };
      }
      planRevenue[sub.planName].totalRevenue += sub.price || 0;
      planRevenue[sub.planName].userCount += 1;
    });
    
    // Add average revenue per plan
    Object.keys(planRevenue).forEach(planName => {
      const plan = planRevenue[planName];
      plan.averageRevenue = plan.userCount > 0 ? (plan.totalRevenue / plan.userCount).toFixed(2) : '0.00';
    });
    
    return {
      summary: {
        totalUsers,
        activeUsers,
        cancelledUsers,
        totalRevenue,
        totalRefunds,
        netRevenue,
        generatedAt: new Date().toISOString()
      },
      renewalRate: {
        percentage: renewalRate,
        renewedUsers,
        expiredUsers,
        description: "Percentage of users who renewed their subscription after expiration"
      },
      averageSubscriptionDuration: {
        days: avgDays,
        months: avgMonths,
        description: "Average time users maintain their subscription"
      },
      lifetimeValue: {
        average: averageLTV,
        total: totalRevenue,
        clientCount: totalUsers,
        description: "Average revenue generated per customer over their lifetime"
      },
      monthlyRecurringRevenue: {
        current: Math.round(totalRevenue / 12), // Rough estimate
        byMonth: {},
        description: "Estimated monthly recurring revenue based on current subscriptions"
      },
      revenuePerPlan: {
        breakdown: planRevenue,
        description: "Revenue breakdown by subscription plan type"
      }
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-red-500 text-lg font-medium">Error loading analytics</div>
          <div className="text-gray-600 dark:text-gray-400">{error}</div>
          <button
            onClick={fetchAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-400">No analytics data available</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
              Comprehensive insights into your fitness platform performance
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Activity className="h-4 w-4" />
              <span>Generated: {formatDate(analytics.summary.generatedAt)}</span>
            </div>
            <button
              onClick={fetchAnalytics}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {/* Total Users */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100 dark:border-blue-800/30">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {analytics.summary.totalUsers.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100 dark:border-green-800/30">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Active Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {analytics.summary.activeUsers.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Cancelled Users */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-100 dark:border-red-800/30">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/10 to-red-600/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">Cancelled Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {analytics.summary.cancelledUsers.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 dark:border-purple-800/30">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(analytics.summary.totalRevenue)}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Total Refunds */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-100 dark:border-orange-800/30">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-orange-600/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">Total Refunds</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(analytics.summary.totalRefunds)}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Net Revenue */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-emerald-100 dark:border-emerald-800/30">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Net Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(analytics.summary.netRevenue)}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Renewal Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <TrendingUp className="h-6 w-6 text-orange-500 mr-3" />
                Renewal Rate
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{analytics.renewalRate.description}</p>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  {analytics.renewalRate.percentage}%
                </div>
                <div className="text-gray-600 dark:text-gray-400">Renewal Rate</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analytics.renewalRate.renewedUsers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Renewed</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {analytics.renewalRate.expiredUsers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Expired</div>
                </div>
              </div>
            </div>
          </div>

          {/* Average Subscription Duration */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Clock className="h-6 w-6 text-blue-500 mr-3" />
                Average Subscription Duration
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{analytics.averageSubscriptionDuration.description}</p>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {analytics.averageSubscriptionDuration.days}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Days</div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {analytics.averageSubscriptionDuration.months}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Months</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lifetime Value */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Wallet className="h-6 w-6 text-green-500 mr-3" />
                Customer Lifetime Value
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{analytics.lifetimeValue.description}</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(analytics.lifetimeValue.average)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Average LTV</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(analytics.lifetimeValue.total)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total LTV</div>
                  </div>
                  <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                    <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
                      {analytics.lifetimeValue.clientCount}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Clients</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Recurring Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="h-6 w-6 text-purple-500 mr-3" />
                Monthly Recurring Revenue
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{analytics.monthlyRecurringRevenue.description}</p>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {formatCurrency(analytics.monthlyRecurringRevenue.current)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Current MRR</div>
                {Object.keys(analytics.monthlyRecurringRevenue.byMonth).length === 0 && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">No monthly data available yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Per Plan */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <PieChart className="h-6 w-6 text-indigo-500 mr-3" />
              Revenue Breakdown by Plan
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{analytics.revenuePerPlan.description}</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(analytics.revenuePerPlan.breakdown).map(([planName, data], index) => (
                <div key={planName} className={`p-6 rounded-xl border-2 ${
                  index === 0 
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700' 
                    : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700'
                }`}>
                  <h4 className={`text-lg font-semibold mb-4 ${
                    index === 0 
                      ? 'text-blue-900 dark:text-blue-100' 
                      : 'text-green-900 dark:text-green-100'
                  }`}>
                    {planName}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${
                        index === 0 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        Total Revenue:
                      </span>
                      <span className={`font-bold ${
                        index === 0 
                          ? 'text-blue-900 dark:text-blue-100' 
                          : 'text-green-900 dark:text-green-100'
                      }`}>
                        {formatCurrency(data.totalRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${
                        index === 0 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        Users:
                      </span>
                      <span className={`font-bold ${
                        index === 0 
                          ? 'text-blue-900 dark:text-blue-100' 
                          : 'text-green-900 dark:text-green-100'
                      }`}>
                        {data.userCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${
                        index === 0 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        Avg Revenue:
                      </span>
                      <span className={`font-bold ${
                        index === 0 
                          ? 'text-blue-900 dark:text-blue-100' 
                          : 'text-green-900 dark:text-green-100'
                      }`}>
                        {formatCurrency(parseFloat(data.averageRevenue))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}