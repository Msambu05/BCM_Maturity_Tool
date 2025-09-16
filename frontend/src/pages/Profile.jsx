// frontend/src/pages/Profile.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import {
  UserCircleIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function Profile() {
  const { user, refreshUserData, isUserActive, getUserStatus } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await client.get('/api/profile/');
      setProfileData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load profile data. Please check your connection and try again.');
      console.error('Profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await refreshUserData();
      if (result.success) {
        setProfileData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to refresh profile data');
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
          <div>
            <h3 className="text-sm font-semibold text-red-800">Error Loading Profile</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const profile = profileData || user;

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-xl shadow-xl overflow-hidden">
        <div className="px-8 py-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                  <UserCircleIcon className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">
                  {profile?.first_name} {profile?.last_name}
                </h1>
                <p className="text-lg text-indigo-100 mt-1">
                  {profile?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-sm text-indigo-200 mt-1">
                  @{profile?.username}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 transition-all duration-200"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Personal Information */}
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <IdentificationIcon className="h-5 w-5 text-gray-600 mr-2" />
              Personal Information
            </h3>
          </div>
          <div className="px-6 py-6">
            <dl className="space-y-5">
              <div className="flex items-start">
                <IdentificationIcon className="h-5 w-5 text-indigo-500 mr-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Employee ID</dt>
                  <dd className="text-sm text-gray-900 mt-1 font-medium">{profile?.employee_id || 'Not provided'}</dd>
                </div>
              </div>

              <div className="flex items-start">
                <IdentificationIcon className="h-5 w-5 text-indigo-500 mr-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Title</dt>
                  <dd className="text-sm text-gray-900 mt-1 font-medium">{profile?.title || 'Not provided'}</dd>
                </div>
              </div>

              <div className="flex items-start">
                <EnvelopeIcon className="h-5 w-5 text-indigo-500 mr-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Email</dt>
                  <dd className="text-sm text-gray-900 mt-1 font-medium">{profile?.email}</dd>
                </div>
              </div>

              <div className="flex items-start">
                <PhoneIcon className="h-5 w-5 text-indigo-500 mr-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Phone</dt>
                  <dd className="text-sm text-gray-900 mt-1 font-medium">{profile?.phone_number || 'Not provided'}</dd>
                </div>
              </div>

              <div className="flex items-start">
                <DevicePhoneMobileIcon className="h-5 w-5 text-indigo-500 mr-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Mobile</dt>
                  <dd className="text-sm text-gray-900 mt-1 font-medium">{profile?.mobile_number || 'Not provided'}</dd>
                </div>
              </div>

              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-indigo-500 mr-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Office Location</dt>
                  <dd className="text-sm text-gray-900 mt-1 font-medium">{profile?.office_location || 'Not provided'}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        {/* Organization Information */}
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-100 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 text-blue-600 mr-2" />
              Organization Information
            </h3>
          </div>
          <div className="px-6 py-6">
            <dl className="space-y-5">
              <div className="flex items-start">
                <BuildingOfficeIcon className="h-5 w-5 text-blue-500 mr-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Organization</dt>
                  <dd className="text-sm text-gray-900 mt-1 font-medium">
                    {profile?.organization?.name || 'Not assigned'}
                  </dd>
                </div>
              </div>

              <div className="flex items-start">
                <BuildingOfficeIcon className="h-5 w-5 text-blue-500 mr-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Department</dt>
                  <dd className="text-sm text-gray-900 mt-1 font-medium">
                    {profile?.department?.name || 'Not assigned'}
                  </dd>
                </div>
              </div>

              <div className="flex items-start">
                <UserCircleIcon className="h-5 w-5 text-blue-500 mr-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Role</dt>
                  <dd className="text-sm text-gray-900 mt-1 font-medium">
                    {profile?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-100 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            Account Status
          </h3>
        </div>
        <div className="px-6 py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`h-4 w-4 rounded-full ${isUserActive() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="ml-3 text-sm font-semibold text-gray-900">
                  {getUserStatus()}
                </span>
              </div>
              {!isUserActive() && (
                <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Contact administrator</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <ClockIcon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                <div>
                  <dt className="text-xs font-medium text-blue-700 uppercase tracking-wide">Last Login</dt>
                  <dd className="text-sm text-blue-900 mt-1">
                    {profile?.last_login ? new Date(profile.last_login).toLocaleString() : 'Never'}
                  </dd>
                </div>
              </div>

              <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                <div>
                  <dt className="text-xs font-medium text-purple-700 uppercase tracking-wide">Account Created</dt>
                  <dd className="text-sm text-purple-900 mt-1">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </dd>
                </div>
              </div>

              {profile?.last_activity && (
                <div className="flex items-center p-3 bg-indigo-50 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                  <div>
                    <dt className="text-xs font-medium text-indigo-700 uppercase tracking-wide">Last Activity</dt>
                    <dd className="text-sm text-indigo-900 mt-1">
                      {new Date(profile.last_activity).toLocaleString()}
                    </dd>
                  </div>
                </div>
              )}

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-gray-500 mr-3 flex-shrink-0" />
                <div>
                  <dt className="text-xs font-medium text-gray-700 uppercase tracking-wide">Last Updated</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Unknown'}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
