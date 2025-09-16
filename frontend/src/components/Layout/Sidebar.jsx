import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// Role-based navigation configuration
const getNavigationItems = (userRole) => {
  const baseItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'bcm_coordinator', 'business_unit_champion', 'steering_committee'] },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon, roles: ['admin', 'bcm_coordinator', 'business_unit_champion', 'steering_committee'] },
  ];

  const roleSpecificItems = {
    admin: [
      { name: 'Assessments', href: '/assessments', icon: DocumentTextIcon },
      { name: 'Organizations', href: '/organizations', icon: BuildingOfficeIcon },
      { name: 'Users', href: '/users', icon: UsersIcon },
      { name: 'Reports', href: '/reports', icon: ChartBarIcon },
      { name: 'System Settings', href: '/settings', icon: Cog6ToothIcon },
    ],
    bcm_coordinator: [
      { name: 'Assessments', href: '/assessments', icon: DocumentTextIcon },
      { name: 'Organizations', href: '/organizations', icon: BuildingOfficeIcon },
      { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    ],
    business_unit_champion: [
      { name: 'My Assessments', href: '/assessments', icon: DocumentTextIcon },
    ],
    steering_committee: [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Reports', href: '/reports', icon: ChartBarIcon },
      { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    ],
  };

  const items = [...baseItems];

  if (userRole && roleSpecificItems[userRole]) {
    items.push(...roleSpecificItems[userRole]);
  }

  return items;
};

export default function Sidebar() {
  const location = useLocation();
  const { user, getUserRole } = useAuth();
  const userRole = getUserRole();
  const navigation = getNavigationItems(userRole);

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-blue-600">
          <h1 className="text-xl font-bold text-white">BCM Tool</h1>
        </div>

        {/* User Info */}
        <div className="flex-shrink-0 flex border-b border-gray-200 p-4">
          <div className="flex items-center">
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
              <p className="text-gray-500 capitalize">{userRole?.replace('_', ' ') || 'No Role'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 bg-white space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive
                      ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="text-xs text-gray-500">
              BCM Maturity Tool v1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
