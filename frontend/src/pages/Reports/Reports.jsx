import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import {
  DocumentTextIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PlusIcon,
  BuildingOfficeIcon,
  UsersIcon,
  PresentationChartLineIcon,
  ClipboardDocumentListIcon,
  CogIcon
} from '@heroicons/react/24/outline';

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await client.get('/api/reports/generated-reports/');
      setReports(response.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    try {
      setGenerating(true);
      const response = await client.post('/api/reports/generate/', {
        type: reportType,
        organization_id: user?.organization?.id
      });
      setSelectedReport(response.data);
      fetchReports(); // Refresh the list
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId) => {
    try {
      const response = await client.get(`/api/reports/generated-reports/${reportId}/download/`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading report:', err);
    }
  };

  const getReportCards = () => {
    const baseReports = [
      {
        id: 'assessment_summary',
        title: 'Assessment Summary Report',
        description: 'Comprehensive BCM maturity assessment with scores and recommendations',
        icon: ChartBarIcon,
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      {
        id: 'gap_analysis',
        title: 'Gap Analysis Report',
        description: 'Identify gaps between current and target maturity levels',
        icon: MagnifyingGlassIcon,
        color: 'from-green-500 to-emerald-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      {
        id: 'trend_analysis',
        title: 'Trend Analysis Report',
        description: 'Track improvement progress over time',
        icon: PresentationChartLineIcon,
        color: 'from-purple-500 to-violet-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      },
      {
        id: 'improvement_roadmap',
        title: 'Improvement Roadmap',
        description: 'Strategic roadmap for BCM maturity improvement',
        icon: CogIcon,
        color: 'from-orange-500 to-red-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      }
    ];

    // Add role-specific reports
    if (user?.role === 'bcm_coordinator' || user?.role === 'admin') {
      baseReports.push({
        id: 'department_comparison',
        title: 'Department Performance Report',
        description: 'Detailed performance analysis by department',
        icon: BuildingOfficeIcon,
        color: 'from-cyan-500 to-blue-600',
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-200'
      });
    }

    if (user?.role === 'steering_committee' || user?.role === 'admin') {
      baseReports.push({
        id: 'executive_summary',
        title: 'Executive Summary',
        description: 'High-level overview for executive decision making',
        icon: ClipboardDocumentListIcon,
        color: 'from-red-500 to-pink-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      });
    }

    return baseReports;
  };

  const getStatusConfig = (status) => {
    const configs = {
      processing: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: ClockIcon,
        label: 'Processing'
      },
      completed: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircleIcon,
        label: 'Completed'
      },
      failed: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: ExclamationTriangleIcon,
        label: 'Failed'
      },
      downloaded: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: ArrowDownTrayIcon,
        label: 'Downloaded'
      }
    };
    return configs[status] || configs.processing;
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.report_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesFormat = formatFilter === 'all' || report.format === formatFilter;

    return matchesSearch && matchesStatus && matchesFormat;
  });

  const getStatusCounts = () => {
    const counts = {};
    reports.forEach(report => {
      counts[report.status] = (counts[report.status] || 0) + 1;
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

        {/* Report Cards Skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white shadow-xl rounded-xl border border-gray-100 p-6">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
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
              <h1 className="text-3xl font-bold">Reports & Analytics</h1>
              <p className="mt-2 text-indigo-100 text-lg">
                Generate comprehensive BCM assessment reports and analytics.
                {user?.role === 'steering_committee' && ' Executive-level insights and strategic recommendations.'}
                {user?.role === 'bcm_coordinator' && ' Organization-wide performance analysis and improvement tracking.'}
              </p>
            </div>
            {(user?.role === 'admin' || user?.role === 'bcm_coordinator') && (
              <button
                onClick={() => generateReport('assessment_summary')}
                disabled={generating}
                className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                {generating ? 'Generating...' : 'Quick Report'}
              </button>
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
                  <dt className="text-sm font-medium text-gray-500 truncate mb-1">Total Reports</dt>
                  <dd className="text-2xl font-bold text-gray-900">{reports.length}</dd>
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
                <div className="h-12 w-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate mb-1">Processing</dt>
                  <dd className="text-2xl font-bold text-gray-900">{statusCounts.processing || 0}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate mb-1">Failed</dt>
                  <dd className="text-2xl font-bold text-gray-900">{statusCounts.failed || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {getReportCards().map((report) => {
          const IconComponent = report.icon;
          return (
            <div key={report.id} className={`bg-white shadow-xl rounded-xl border ${report.borderColor} hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden`}>
              <div className={`h-2 bg-gradient-to-r ${report.color}`}></div>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${report.color} text-white mr-4`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-6">{report.description}</p>
                <button
                  onClick={() => generateReport(report.id)}
                  disabled={generating}
                  className={`w-full bg-gradient-to-r ${report.color} text-white px-4 py-3 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg font-semibold disabled:opacity-50`}
                >
                  {generating ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
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
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="downloaded">Downloaded</option>
            </select>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="all">All Formats</option>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="word">Word</option>
              <option value="html">HTML</option>
            </select>
            <button className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
              <FunnelIcon className="h-5 w-5 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
        </div>
        {filteredReports.length === 0 ? (
          <div className="text-center py-16">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' || formatFilter !== 'all' ? 'No reports found' : 'No reports generated yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' || formatFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Generate your first BCM assessment report to get started with analytics and insights.'
              }
            </p>
            {(user?.role === 'admin' || user?.role === 'bcm_coordinator') && !searchTerm && statusFilter === 'all' && formatFilter === 'all' && (
              <button
                onClick={() => generateReport('assessment_summary')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Generate First Report
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReports.map((report) => {
              const statusConfig = getStatusConfig(report.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div key={report.id} className="px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-semibold text-gray-900">{report.title}</h3>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {report.format.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Report Type: {report.report_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        <span>Generated: {new Date(report.generated_at).toLocaleDateString()}</span>
                        {report.file_size && <span>Size: {(report.file_size / 1024 / 1024).toFixed(2)} MB</span>}
                      </div>
                      {report.description && (
                        <p className="mt-1 text-sm text-gray-600">{report.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="inline-flex items-center px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View
                      </button>
                      {report.status === 'completed' && (
                        <button
                          onClick={() => downloadReport(report.id)}
                          className="inline-flex items-center px-3 py-1 text-xs font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedReport.title}</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Report Type</label>
                    <p className="text-sm text-gray-900">{selectedReport.report_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Format</label>
                    <p className="text-sm text-gray-900">{selectedReport.format.toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="text-sm text-gray-900">{selectedReport.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Generated</label>
                    <p className="text-sm text-gray-900">{new Date(selectedReport.generated_at).toLocaleString()}</p>
                  </div>
                </div>
                {selectedReport.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-900">{selectedReport.description}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parameters</label>
                  <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {JSON.stringify(selectedReport.parameters, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-3">
              {selectedReport.status === 'completed' && (
                <button
                  onClick={() => downloadReport(selectedReport.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Download Report
                </button>
              )}
              <button
                onClick={() => setSelectedReport(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
