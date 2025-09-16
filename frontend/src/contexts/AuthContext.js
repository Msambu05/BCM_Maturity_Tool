import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

// Role-based permissions based on use cases
export const PERMISSIONS = {
  // Admin permissions
  ADMIN: {
    canManageUsers: true,
    canManageOrganizations: true,
    canManageDepartments: true,
    canConfigureFramework: true,
    canManageRoles: true,
    canViewAuditLogs: true,
    canConfigureNotifications: true,
    canViewAllAssessments: true,
    canEditAllAssessments: true,
    canGenerateReports: true,
    canViewAnalytics: true,
    canApproveAssessments: true
  },

  // BCM Coordinator permissions
  BCM_COORDINATOR: {
    canManageUsers: false,
    canManageOrganizations: false,
    canManageDepartments: false,
    canConfigureFramework: false,
    canManageRoles: false,
    canViewAuditLogs: false,
    canConfigureNotifications: false,
    canViewAllAssessments: true,
    canEditAllAssessments: true,
    canGenerateReports: true,
    canViewAnalytics: true,
    canApproveAssessments: true,
    // Coordinator specific
    canInitiateAssessments: true,
    canAssignQuestions: true,
    canReviewAssessments: true,
    canUploadEvidence: true
  },

  // Business Unit Champion permissions
  BUSINESS_UNIT_CHAMPION: {
    canManageUsers: false,
    canManageOrganizations: false,
    canManageDepartments: false,
    canConfigureFramework: false,
    canManageRoles: false,
    canViewAuditLogs: false,
    canConfigureNotifications: false,
    canViewAllAssessments: false,
    canEditAllAssessments: false,
    canGenerateReports: false,
    canViewAnalytics: false,
    canApproveAssessments: false,
    // Champion specific
    canViewAssignedAssessments: true,
    canSubmitRatings: true,
    canUploadEvidence: true,
    canEditResponses: true
  },

  // Steering Committee permissions
  STEERING_COMMITTEE: {
    canManageUsers: false,
    canManageOrganizations: false,
    canManageDepartments: false,
    canConfigureFramework: false,
    canManageRoles: false,
    canViewAuditLogs: false,
    canConfigureNotifications: false,
    canViewAllAssessments: true,
    canEditAllAssessments: false,
    canGenerateReports: true,
    canViewAnalytics: true,
    canApproveAssessments: false,
    // Committee specific
    canViewDashboards: true,
    canDownloadReports: true,
    canReviewRoadmap: true
  }
};

export const ROLES = {
  ADMIN: 'admin',
  BCM_COORDINATOR: 'bcm_coordinator',
  BUSINESS_UNIT_CHAMPION: 'business_unit_champion',
  STEERING_COMMITTEE: 'steering_committee'
};

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const accessToken = localStorage.getItem('access');
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await client.get('/api/profile/');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      // Token might be expired, try to refresh
      await refreshToken();
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refresh');
    if (!refreshToken) {
      logout();
      return;
    }

    try {
      const response = await client.post('/api/auth/token/refresh/', {
        refresh: refreshToken
      });

      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);

      // Retry getting user data
      const userResponse = await client.get('/api/profile/');
      setUser(userResponse.data);
      setIsAuthenticated(true);
    } catch (error) {
      logout();
    }
  };

  const login = async (username, password) => {
    try {
      const response = await client.post('/api/login/', {
        username,
        password
      });

      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);

      const userResponse = await client.get('/api/profile/');
      setUser(userResponse.data);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
    setIsAuthenticated(false);
    setLastRefresh(Date.now());
  };

  // Force refresh user data from server
  const refreshUserData = async () => {
    try {
      const response = await client.get('/api/profile/');
      const newUserData = response.data;

      // Check if user data has changed
      if (!user || JSON.stringify(user) !== JSON.stringify(newUserData)) {
        setUser(newUserData);
        setLastRefresh(Date.now());
        return { success: true, data: newUserData };
      }

      return { success: true, data: user };
    } catch (error) {
      console.error('Failed to refresh user data:', error);

      // If token is invalid, clear it
      if (error.response?.status === 401) {
        logout();
        return { success: false, error: 'Session expired. Please login again.' };
      }

      return { success: false, error: error.response?.data?.detail || 'Failed to refresh user data' };
    }
  };

  // Check if user is active
  const isUserActive = () => {
    return user?.is_active === true;
  };

  // Get user status description
  const getUserStatus = () => {
    if (!user) return 'Not logged in';
    return user.is_active ? 'Active' : 'Inactive';
  };

  // Role-based permission checking
  const hasPermission = (permission) => {
    if (!user || !user.role) return false;

    const rolePermissions = PERMISSIONS[user.role.toUpperCase().replace('_', '_')];
    return rolePermissions ? rolePermissions[permission] : false;
  };

  const getUserRole = () => {
    return user?.role || null;
  };

  const isAdmin = () => user?.role === ROLES.ADMIN;
  const isBCMCoordinator = () => user?.role === ROLES.BCM_COORDINATOR;
  const isBusinessUnitChampion = () => user?.role === ROLES.BUSINESS_UNIT_CHAMPION;
  const isSteeringCommittee = () => user?.role === ROLES.STEERING_COMMITTEE;

  const value = {
    user,
    isAuthenticated,
    loading,
    lastRefresh,
    login,
    logout,
    refreshToken,
    refreshUserData,
    // User status utilities
    isUserActive,
    getUserStatus,
    // Role-based utilities
    hasPermission,
    getUserRole,
    isAdmin,
    isBCMCoordinator,
    isBusinessUnitChampion,
    isSteeringCommittee,
    // Constants
    PERMISSIONS,
    ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
