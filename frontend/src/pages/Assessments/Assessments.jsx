// frontend/src/pages/Assessments/Assessments.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArchiveBoxIcon,
  BuildingOfficeIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

export default function Assessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await client.get('/api/assessments/assessments/');
      // Ensure response.data is an array
      const data = Array.isArray(response.data) ? response.data : [];
      setAssessments(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError('Failed to load assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      draft: {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: DocumentTextIcon,
        gradient: 'from-gray-50 to-gray-100'
      },
      in_progress: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: ClockIcon,
        gradient: 'from-blue-50 to-blue-100'
      },
      submitted: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: DocumentTextIcon,
        gradient: 'from-yellow-50 to-yellow-100'
      },
      under_review: {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: EyeIcon,
        gradient: 'from-purple-50 to-purple-100'
      },
      reviewed: {
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: CheckCircleIcon,
        gradient: 'from-indigo-50 to-indigo-100'
      },
      approved: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircleIcon,
        gradient: 'from-green-50 to-green-100'
      },
      completed: {
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: CheckCircleIcon,
        gradient: 'from-emerald-50 to-emerald-100'
      },
      archived: {
        color: 'bg-slate-100 text-slate-800 border-slate-200',
        icon: ArchiveBoxIcon,
        gradient: 'from-slate-50 to-slate-100'
      }
    };
    return configs[status] || configs.draft;
  };

  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.organization?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.department?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    const counts = {};
    assessments.forEach(assessment => {
      counts[assessment.status] = (counts[assessment.status] || 0) + 1;
    });
    return counts;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-xl shadow-xl p-8 text-white">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-64 mb-4"></div>
            <div className="h-4 bg-white/20 rounded w-96"></div>
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

        {/* Table Skeleton */}
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-50 border-b border-gray-200"></div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-white border-b border-gray-100"></div>
            ))}
          </div>
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
            <h3 className="text-lg font-semibold text-red-800">Error Loading Assessments</h3>
            <p className="mt-2 text-red-700">{error}</p>
            <button
              onClick={fetchAssessments}
              className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-xl shadow-xl overflow-hidden">
        <div className="px-8 py-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Assessment Management</h1>
              <p className="mt-2 text-indigo-100 text-lg">
                Manage and track BCM assessments across your organization
              </p>
            </div>
            {(user?.role === 'admin' || user?.role === 'bcm_coordinator') && (
              <Link
                to="/assessments/new"
                className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Assessment
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-xl rounded-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate mb-1">Total Assessments</dt>
                  <dd className="text-2xl font-bold text-gray-900">{assessments.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-xl rounded-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate mb-1">Completed</dt>
                  <dd className="text-2xl font-bold text-gray-900">{statusCounts.completed || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-xl rounded-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate mb-1">In Progress</dt>
                  <dd className="text-2xl font-bold text-gray-900">{statusCounts.in_progress || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-xl rounded-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate mb-1">Overdue</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {assessments.filter(a => a.due_date && new Date(a.due_date) < new Date()).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <button className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
              <FunnelIcon className="h-5 w-5 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Assessments Table */}
      <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
        {filteredAssessments.length === 0 ? (
          <div className="text-center py-16">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No assessments found' : 'No assessments yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first BCM assessment.'
              }
            </p>
            {(user?.role === 'admin' || user?.role === 'bcm_coordinator') && !searchTerm && statusFilter === 'all' && (
              <Link
                to="/assessments/new"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Assessment
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Assessment Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Organization & Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredAssessments.map((assessment) => {
                  const statusConfig = getStatusConfig(assessment.status);
                  const StatusIcon = statusConfig.icon;
                  const isOverdue = assessment.due_date && new Date(assessment.due_date) < new Date();

                  return (
                    <tr key={assessment.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {assessment.reference_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {assessment.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created: {new Date(assessment.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {assessment.organization?.name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <UsersIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {assessment.department?.name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {formatStatus(assessment.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                          {assessment.due_date ? new Date(assessment.due_date).toLocaleDateString() : 'N/A'}
                        </div>
                        {isOverdue && (
                          <div className="text-xs text-red-500 mt-1">Overdue</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <Link
                            to={`/assessments/${assessment.id}`}
                            className="inline-flex items-center px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <EyeIcon className="h-3 w-3 mr-1" />
                            View
                          </Link>
                          {(user?.role === 'admin' || user?.role === 'bcm_coordinator') && (
                            <Link
                              to={`/assessments/${assessment.id}/edit`}
                              className="inline-flex items-center px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              <PencilIcon className="h-3 w-3 mr-1" />
                              Edit
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
