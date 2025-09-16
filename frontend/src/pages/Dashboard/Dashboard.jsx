// frontend/src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user, getUserRole } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch overview stats
      const statsResponse = await client.get('/api/dashboard/overview-stats/');
      const statsData = statsResponse.data;

      // Fetch recent activity
      const activityResponse = await client.get('/api/dashboard/recent-activity/');
      const activityData = activityResponse.data;

      // For admin and coordinators, fetch department comparison
      let departmentData = [];
      if (['admin', 'bcm_coordinator', 'steering_committee'].includes(user.role)) {
        try {
          const deptResponse = await client.get('/api/dashboard/department-comparison/');
          departmentData = deptResponse.data;
        } catch (error) {
          console.error('Error fetching department data:', error);
        }
      }

      setDashboardData({
        summary: statsData,
        recent_activity: activityData.recent_assessments || [],
        department_comparison: departmentData,
        // Add other data as needed
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-xl shadow-xl p-8 text-white">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-64 mb-4"></div>
            <div className="h-4 bg-white/20 rounded w-96 mb-6"></div>
            <div className="h-6 bg-white/20 rounded w-48"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white shadow-xl rounded-xl border border-gray-100 p-6">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Sections Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map(i => (
            <div key={i} className="bg-white shadow-xl rounded-xl border border-gray-100 p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-8">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
            <p className="mt-2 text-red-700">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.summary || {};
  const role = getUserRole();

  // Role-based dashboard content
  const renderStatsCards = () => {
    switch (role) {
      case 'admin':
        return (
          <>
            <StatCard
              icon={UsersIcon}
              label="Total Users"
              value={dashboardData?.total_users || 0}
              trend="+12%"
              trendUp={true}
              color="from-blue-500 to-cyan-500"
            />
            <StatCard
              icon={DocumentTextIcon}
              label="Total Assessments"
              value={stats.total_assessments || 0}
              trend="+8%"
              trendUp={true}
              color="from-green-500 to-emerald-500"
            />
            <StatCard
              icon={ClockIcon}
              label="Active Assessments"
              value={stats.active_assessments || 0}
              trend="-3%"
              trendUp={false}
              color="from-orange-500 to-red-500"
            />
            <StatCard
              icon={ExclamationTriangleIcon}
              label="Overdue Assessments"
              value={stats.overdue_assessments || 0}
              trend="+5%"
              trendUp={false}
              color="from-red-500 to-pink-500"
            />
          </>
        );
      case 'bcm_coordinator':
        return (
          <>
            <StatCard
              icon={DocumentTextIcon}
              label="Total Assessments"
              value={stats.total_assessments || 0}
              trend="+15%"
              trendUp={true}
              color="from-indigo-500 to-blue-500"
            />
            <StatCard
              icon={ClockIcon}
              label="Active Assessments"
              value={stats.active_assessments || 0}
              trend="+7%"
              trendUp={true}
              color="from-purple-500 to-pink-500"
            />
            <StatCard
              icon={CheckCircleIcon}
              label="Completed Assessments"
              value={stats.completed_assessments || 0}
              trend="+22%"
              trendUp={true}
              color="from-green-500 to-teal-500"
            />
            <StatCard
              icon={BuildingOfficeIcon}
              label="Departments"
              value={dashboardData?.total_departments || 0}
              trend="+2%"
              trendUp={true}
              color="from-cyan-500 to-blue-500"
            />
          </>
        );
      case 'business_unit_champion':
        return (
          <>
            <StatCard
              icon={BuildingOfficeIcon}
              label="Organization"
              value={user?.organization?.name || 'Not Assigned'}
              color="from-indigo-500 to-purple-500"
              isText={true}
            />
            <StatCard
              icon={UsersIcon}
              label="Department"
              value={user?.department?.name || 'Not Assigned'}
              color="from-blue-500 to-indigo-500"
              isText={true}
            />
            <StatCard
              icon={DocumentTextIcon}
              label="Assigned Assessments"
              value={dashboardData?.assigned_assessments || 0}
              trend="+10%"
              trendUp={true}
              color="from-green-500 to-emerald-500"
            />
            <StatCard
              icon={ClockIcon}
              label="Pending Responses"
              value={dashboardData?.pending_responses || 0}
              trend="-8%"
              trendUp={true}
              color="from-orange-500 to-yellow-500"
            />
            <StatCard
              icon={CheckCircleIcon}
              label="Submitted Responses"
              value={dashboardData?.submitted_responses || 0}
              trend="+18%"
              trendUp={true}
              color="from-teal-500 to-green-500"
            />
            <StatCard
              icon={ExclamationTriangleIcon}
              label="Overdue Responses"
              value={dashboardData?.overdue_responses || 0}
              trend="-12%"
              trendUp={true}
              color="from-red-500 to-orange-500"
            />
          </>
        );
      case 'steering_committee':
        return (
          <>
            <StatCard
              icon={ChartBarIcon}
              label="Overall Maturity Level"
              value={dashboardData?.overall_maturity || 'N/A'}
              color="from-purple-500 to-indigo-500"
              isText={true}
            />
            <StatCard
              icon={DocumentTextIcon}
              label="Reports Available"
              value={dashboardData?.reports_available || 0}
              trend="+25%"
              trendUp={true}
              color="from-blue-500 to-cyan-500"
            />
            <StatCard
              icon={BuildingOfficeIcon}
              label="Improvement Roadmap"
              value={dashboardData?.roadmap_status || 'N/A'}
              color="from-green-500 to-blue-500"
              isText={true}
            />
            <StatCard
              icon={UsersIcon}
              label="Users"
              value={dashboardData?.total_users || 0}
              trend="+6%"
              trendUp={true}
              color="from-indigo-500 to-blue-500"
            />
          </>
        );
      default:
        return (
          <>
            <StatCard
              icon={DocumentTextIcon}
              label="Total Assessments"
              value={stats.total_assessments || 0}
              trend="+9%"
              trendUp={true}
              color="from-blue-500 to-indigo-500"
            />
            <StatCard
              icon={ClockIcon}
              label="Active Assessments"
              value={stats.active_assessments || 0}
              trend="+4%"
              trendUp={true}
              color="from-orange-500 to-red-500"
            />
            <StatCard
              icon={ExclamationTriangleIcon}
              label="Overdue Assessments"
              value={stats.overdue_assessments || 0}
              trend="-15%"
              trendUp={true}
              color="from-red-500 to-pink-500"
            />
            <StatCard
              icon={CheckCircleIcon}
              label="Completed Assessments"
              value={stats.completed_assessments || 0}
              trend="+20%"
              trendUp={true}
              color="from-green-500 to-teal-500"
            />
          </>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-xl shadow-xl overflow-hidden">
        <div className="px-8 py-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {user?.first_name || user?.username}!
              </h1>
              <p className="mt-2 text-indigo-100 text-lg">
                Here's what's happening with your BCM assessments today.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <ChartBarIcon className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          {/* Role Indicator */}
          <div className="mt-6 inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30">
            <UsersIcon className="h-4 w-4 mr-2" />
            Role: {role ? role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not assigned'}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 gap-6 ${
        role === 'business_unit_champion' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        {renderStatsCards()}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-100 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                Recent Activity
              </h3>
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <BellAlertIcon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {dashboardData?.recent_activity?.length > 0 ? (
                dashboardData.recent_activity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border border-gray-100">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                        <DocumentTextIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <CalendarDaysIcon className="h-3 w-3 mr-1" />
                        {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">No recent activity</h3>
                  <p className="mt-2 text-sm text-gray-500">Activity will appear here as assessments are created and updated.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-red-50 to-orange-100 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ClockIcon className="h-5 w-5 text-red-600 mr-2" />
                Upcoming Deadlines
              </h3>
              <div className="h-8 w-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {dashboardData?.upcoming_deadlines?.length > 0 ? (
                dashboardData.upcoming_deadlines.map((deadline, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg hover:from-red-100 hover:to-orange-100 transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          deadline.days_remaining <= 3 ? 'bg-red-500' : 'bg-orange-500'
                        }`}>
                          <ClockIcon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {deadline.assessment?.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {deadline.assessment?.department?.name} - {deadline.assessment?.organization?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        deadline.days_remaining <= 3
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {deadline.days_remaining} days left
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {new Date(deadline.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <ClockIcon className="mx-auto h-16 w-16 text-gray-400" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">No upcoming deadlines</h3>
                  <p className="mt-2 text-sm text-gray-500">All assessments are up to date!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Department Comparison for Admin/Coordinators */}
      {['admin', 'bcm_coordinator', 'steering_committee'].includes(role) && dashboardData?.department_comparison?.length > 0 && (
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-indigo-100 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ChartBarIcon className="h-5 w-5 text-purple-600 mr-2" />
                Department Performance Comparison
              </h3>
              <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <ArrowTrendingUpIcon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.department_comparison.map((dept, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-900">{dept.name}</h4>
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      dept.maturity_level >= 4 ? 'bg-green-100 text-green-800' :
                      dept.maturity_level >= 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Level {dept.maturity_level}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Assessments:</span>
                      <span className="font-semibold">{dept.total_assessments}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-semibold text-green-600">{dept.completed_assessments}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-semibold">{dept.completion_percentage}%</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${dept.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, trendUp, color = "from-indigo-500 to-blue-500", isText = false }) {
  return (
    <div className="bg-white overflow-hidden shadow-xl rounded-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            <div className={`h-12 w-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          {trend && (
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
              trendUp ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {trendUp ? (
                <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
              )}
              {trend}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold text-gray-900 ${isText ? 'text-lg' : ''}`}>
            {isText ? value : (typeof value === 'number' ? value.toLocaleString() : value)}
          </p>
        </div>
      </div>
    </div>
  );
}
