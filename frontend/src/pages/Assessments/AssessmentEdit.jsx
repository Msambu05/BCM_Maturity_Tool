import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeftIcon,
  UsersIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export default function AssessmentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [users, setUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssessment();
    fetchUsers();
  }, [id]);

  const fetchAssessment = async () => {
    try {
      const response = await client.get(`/api/assessments/assessments/${id}/`);
      setAssessment(response.data);
      setAssignedUsers(response.data.assigned_to || []);
    } catch (err) {
      console.error('Error fetching assessment:', err);
      setError('Failed to load assessment');
    }
  };

  const fetchUsers = async () => {
    try {
      if (assessment?.organization?.id) {
        // Fetch users from the assessment's organization
        const response = await client.get(`/api/organizations/${assessment.organization.id}/users/`);
        // Filter users who can be assigned (business_unit_champion role)
        const assignableUsers = response.data.filter(u => u.role === 'business_unit_champion');
        setUsers(assignableUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId) => {
    setAssignedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await client.patch(`/api/assessments/assessments/${id}/`, {
        assigned_to: assignedUsers
      });

      navigate('/assessments');
    } catch (err) {
      console.error('Error updating assessment:', err);
      setError('Failed to update assessment assignments');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-xl shadow-xl p-8 text-white">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-64 mb-4"></div>
            <div className="h-4 bg-white/20 rounded w-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-8">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-red-800">Error</h3>
            <p className="mt-2 text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-xl shadow-xl overflow-hidden">
        <div className="px-8 py-8 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <button
                  onClick={() => navigate('/assessments')}
                  className="inline-flex items-center px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/30 transition-all duration-200"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </button>
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-5 w-5" />
                  <span className="text-sm">Edit Assessment</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">{assessment?.name}</h1>
              <p className="text-indigo-100 text-lg mb-4">
                Reference: {assessment?.reference_number}
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <BuildingOfficeIcon className="h-4 w-4" />
                  <span>{assessment?.organization?.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-4 w-4" />
                  <span>{assessment?.department?.name}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 shadow-lg disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Assignment Section */}
      <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Assign Assessment</h2>
          <p className="text-gray-600">Select Business Unit Champions to perform this assessment</p>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-8">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No Business Unit Champions available for assignment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((assignableUser) => (
              <label
                key={assignableUser.id}
                className="relative flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={assignedUsers.includes(assignableUser.id)}
                  onChange={() => handleUserToggle(assignableUser.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {assignableUser.first_name} {assignableUser.last_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {assignableUser.email}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {assignableUser.department?.name || 'No Department'}
                  </div>
                </div>
                {assignedUsers.includes(assignableUser.id) && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                )}
              </label>
            ))}
          </div>
        )}

        {assignedUsers.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                {assignedUsers.length} user{assignedUsers.length !== 1 ? 's' : ''} assigned
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
