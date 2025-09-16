// frontend/src/pages/Organizations/Organizations.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import {
  BuildingOfficeIcon,
  PlusIcon,
  UsersIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function Organizations() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [showAddDept, setShowAddDept] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department_name: '',
    department_description: ''
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await client.get('/api/organizations/');
      setOrganizations(response.data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSelect = (org) => {
    setSelectedOrg(org);
    fetchDepartments(org.id);
    fetchUsers(org.id);
  };

  const fetchDepartments = async (orgId) => {
    try {
      const response = await client.get(`/api/departments/?organization=${orgId}`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchUsers = async (orgId) => {
    try {
      const response = await client.get(`/api/organizations/${orgId}/users/`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const handleAddOrganization = async (e) => {
    e.preventDefault();
    try {
      await client.post('/api/organizations/', {
        name: formData.name,
        description: formData.description
      });
      setShowAddOrg(false);
      setFormData({
        name: '',
        description: '',
        department_name: '',
        department_description: ''
      });
      fetchOrganizations();
    } catch (error) {
      console.error('Error adding organization:', error);
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;

    try {
      await client.post('/api/departments/', {
        name: formData.department_name,
        organization_id: selectedOrg.id,
        description: formData.department_description
      });
      setShowAddDept(false);
      setFormData({
        ...formData,
        department_name: '',
        department_description: ''
      });
      fetchDepartments(selectedOrg.id);
    } catch (error) {
      console.error('Error adding department:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      department_name: '',
      department_description: ''
    });
  };

  const closeOrgModal = () => {
    setShowAddOrg(false);
    resetForm();
  };

  const closeDeptModal = () => {
    setShowAddDept(false);
    resetForm();
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-xl shadow-xl p-8 text-white">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-64 mb-4"></div>
            <div className="h-4 bg-white/20 rounded w-96"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white shadow-xl rounded-xl border border-gray-100 p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
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
            <div>
              <h1 className="text-3xl font-bold">Organization Management</h1>
              <p className="mt-2 text-indigo-100 text-lg">
                View and manage organizations and their departments
              </p>
            </div>
            {user && (
              <button
                onClick={() => setShowAddOrg(true)}
                className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Organization
              </button>
            )}
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
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredOrganizations.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-12 text-center">
              <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No organizations found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first organization.'}
              </p>
            </div>
          </div>
        ) : (
          filteredOrganizations.map((org) => (
            <div
              key={org.id}
              className={`bg-white shadow-xl rounded-xl border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                selectedOrg?.id === org.id
                  ? 'ring-2 ring-indigo-500 shadow-2xl scale-105'
                  : ''
              }`}
              onClick={() => handleOrgSelect(org)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <BuildingOfficeIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{org.name}</h3>
                    <p className="text-sm text-gray-500">ID: {org.id}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {org.description || 'No description available'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Created: {new Date(org.created_at).toLocaleDateString()}</span>
                  <EyeIcon className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Organization Details */}
      {selectedOrg && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Departments */}
          <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-100 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-green-600 mr-2" />
                  {selectedOrg.name} - Departments
                </h3>
                {(user?.role === 'admin' || user?.role === 'bcm_coordinator' || user?.role === 'steering_committee') && (
                  <button
                    onClick={() => setShowAddDept(true)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 shadow-lg"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Department
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {departments.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 italic">No departments found for this organization.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {departments.map((dept) => (
                    <div key={dept.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-gray-900">{dept.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">ID: {dept.id}</p>
                          {dept.description && (
                            <p className="text-sm text-gray-700 mt-2">{dept.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Created: {new Date(dept.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Users */}
          <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-100 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <UsersIcon className="h-5 w-5 text-blue-600 mr-2" />
                {selectedOrg.name} - Users ({users.length})
              </h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {users.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 italic">No users found for this organization.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <div key={user.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {user.first_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-gray-900 truncate">
                              {user.first_name} {user.last_name}
                            </h4>
                            <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            user.is_active
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <p className="text-xs text-gray-400">
                            {user.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}