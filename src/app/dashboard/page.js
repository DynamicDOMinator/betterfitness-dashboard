'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Users, CreditCard, TrendingUp, Activity, BarChart3, PieChart, LineChart } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalSubscriptions: 0,
    totalRevenue: 0,
    activeUsers: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      fetchChartData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      // Fetch contacts
      const contactsResponse = await fetch('http://localhost:3000/contact');
      
      // Check if response is JSON
      const contactsContentType = contactsResponse.headers.get('content-type');
      if (!contactsContentType || !contactsContentType.includes('application/json')) {
        console.error('Contacts API returned non-JSON response:', await contactsResponse.text());
        setStats({ totalContacts: 0, totalSubscriptions: 0, totalRevenue: 0, activeUsers: 0 });
        setRecentActivities([]);
        return;
      }
      
      const contactsResult = await contactsResponse.json();
      const contactsData = contactsResult.success ? contactsResult.data : [];
      
      // Fetch subscriptions (users)
      const subscriptionsResponse = await fetch('http://localhost:3000/users');
      
      // Check if response is JSON
      const subscriptionsContentType = subscriptionsResponse.headers.get('content-type');
      if (!subscriptionsContentType || !subscriptionsContentType.includes('application/json')) {
        console.error('Subscriptions API returned non-JSON response:', await subscriptionsResponse.text());
        setStats({ totalContacts: contactsData.length, totalSubscriptions: 0, totalRevenue: 0, activeUsers: 0 });
        setRecentActivities([]);
        return;
      }
      
      const subscriptionsResult = await subscriptionsResponse.json();
      const subscriptionsData = subscriptionsResult.success ? subscriptionsResult.data : [];

      // Calculate stats
      const totalRevenue = subscriptionsData.reduce((sum, sub) => {
        const price = parseFloat(sub.price) || 0;
        return sum + price;
      }, 0);

      setStats({
        totalContacts: contactsData.length,
        totalSubscriptions: subscriptionsData.length,
        totalRevenue: totalRevenue,
        activeUsers: subscriptionsData.filter(sub => sub.status === 'active').length
      });

      // Create recent activities
      const activities = [
        ...contactsData.slice(0, 3).map((contact, index) => ({
          id: `contact-${contact.id || `fallback-${Date.now()}-${index}`}`,
          type: 'contact',
          message: `New contact from ${contact.name}`,
          time: contact.createdAt || new Date().toISOString()
        })),
        ...subscriptionsData.slice(0, 2).map((sub, index) => ({
          id: `subscription-${sub.id || `fallback-${Date.now()}-${index}`}`,
          type: 'subscription',
          message: `New ${sub.planName} subscription by ${sub.name}`,
          time: sub.createdAt || new Date().toISOString()
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await fetch('http://localhost:3000/admin/charts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Charts API request failed:', response.status);
        return;
      }
      
      const result = await response.json();
      if (result.success) {
        setChartData(result.data);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Chart color schemes
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Revenue Line Chart Component
  const RevenueChart = () => {
    if (!chartData?.revenueOverTime?.data) return null;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <LineChart className="h-6 w-6 text-blue-500 mr-3" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Revenue Over Time</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{chartData.revenueOverTime.description}</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={chartData.revenueOverTime.data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [`$${value}`, 'Revenue']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Revenue: <span className="font-semibold text-blue-600 dark:text-blue-400">${chartData.revenueOverTime.totalRevenue}</span>
          </p>
        </div>
      </div>
    );
  };

  // Active Users Bar Chart Component
  const ActiveUsersChart = () => {
    if (!chartData?.activeUsersByPlan?.data) return null;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <BarChart3 className="h-6 w-6 text-green-500 mr-3" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Active Users by Plan</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{chartData.activeUsersByPlan.description}</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.activeUsersByPlan.data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="planName" 
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [value, 'Active Users']}
              />
              <Legend />
              <Bar 
                dataKey="activeUsers" 
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Active Users: <span className="font-semibold text-green-600 dark:text-green-400">{chartData.activeUsersByPlan.totalActiveUsers}</span>
          </p>
        </div>
      </div>
    );
  };

  // Churn vs Signups Pie Chart Component
  const ChurnSignupsChart = () => {
    if (!chartData?.churnVsSignups?.data) return null;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <PieChart className="h-6 w-6 text-purple-500 mr-3" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Churn vs New Signups</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{chartData.churnVsSignups.description}</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData.churnVsSignups.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ label, percentage }) => `${label}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.churnVsSignups.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => [value, name]}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Period: <span className="font-semibold">{chartData.churnVsSignups.period}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Churn Rate: <span className="font-semibold text-red-600 dark:text-red-400">{chartData.churnVsSignups.churnRate}%</span>
          </p>
        </div>
      </div>
    );
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-red-600 dark:from-white dark:to-red-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
              Welcome back! Here's what's happening with your fitness platform.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Activity className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100 dark:border-blue-800/30">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Total Contacts</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded"></div>
                    ) : (
                      stats.totalContacts.toLocaleString()
                    )}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100 dark:border-green-800/30">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Subscriptions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded"></div>
                    ) : (
                      stats.totalSubscriptions.toLocaleString()
                    )}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 dark:border-purple-800/30">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"></div>
                    ) : (
                      formatCurrency(stats.totalRevenue)
                    )}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

      
        </div>

        {/* Charts Section */}
        {chartData && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive insights into your fitness platform performance</p>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {chartData.metadata ? new Date(chartData.metadata.generatedAt).toLocaleString() : 'N/A'}
              </div>
            </div>

            {/* Revenue Chart - Full Width */}
            <RevenueChart />

            {/* Bar and Pie Charts - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ActiveUsersChart />
              <ChurnSignupsChart />
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Activity className="h-6 w-6 text-red-500 mr-3" />
              Recent Activities
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Latest updates from your fitness platform</p>
          </div>
          <div className="p-8">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4">
                    <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-6">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      activity.type === 'contact' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                        : 'bg-gradient-to-br from-green-500 to-green-600'
                    }`}>
                      {activity.type === 'contact' ? (
                        <Users className="h-6 w-6 text-white" />
                      ) : (
                        <CreditCard className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {formatDate(activity.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No recent activities</p>
                <p className="text-gray-400 dark:text-gray-500 mt-2">Activities will appear here as they happen</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}