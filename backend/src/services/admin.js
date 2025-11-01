const { supabase, supabaseAdmin } = require('../config/supabase');
const User = require('../domain/User');
const UserStatus = require('../domain/enum/UserStatus');
const Role = require('../domain/enum/Role');
const ReportStatus = require('../domain/enum/ReportStatus');
const NotificationService = require('./notificationService');

/**
 * Admin Service
 * Handles administrative operations including user management, dashboard statistics,
 * user status modifications (suspend, deactivate, reactivate), and report management
 * 
 * @class AdminService
 * @example
 * const adminService = new AdminService();
 * const stats = await adminService.getDashboardStats();
 * const users = await adminService.getAllUsers(1, 10);
 */
class AdminService {
  
  /**
   * Get dashboard statistics for admin panel
   * Provides overview of users, active/suspended/deactivated counts, and pending reports
   * 
   * @returns {Promise<Object>} Dashboard statistics object
   * @returns {number} returns.totalUsers - Total number of users in system
   * @returns {number} returns.activeUsers - Number of active users
   * @returns {number} returns.suspendedUsers - Number of suspended users
   * @returns {number} returns.deactivatedUsers - Number of deactivated users
   * @returns {number} returns.pendingReports - Number of pending reports
   * @throws {Error} If statistics retrieval fails
   * 
   * @example
   * const stats = await adminService.getDashboardStats();
   * // Returns: { totalUsers: 150, activeUsers: 120, suspendedUsers: 5, deactivatedUsers: 25, pendingReports: 3 }
   */
  async getDashboardStats() {
    try {
      // Get all users from Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        throw new Error(`Failed to fetch users: ${authError.message}`);
      }

      // Calculate stats
      const totalUsers = authData.users.length;
      const activeUsers = authData.users.filter(user => 
        (user.user_metadata?.status || UserStatus.ACTIVE) === UserStatus.ACTIVE
      ).length;
      const suspendedUsers = authData.users.filter(user => 
        user.user_metadata?.status === UserStatus.SUSPENDED
      ).length;
      const deactivatedUsers = authData.users.filter(user => 
        user.user_metadata?.status === UserStatus.DEACTIVATED
      ).length;

      // Get pending reports count (if table exists)
      let pendingReports = 0;
      try {
        const { count: reportCount, error: reportError } = await supabaseAdmin
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', ReportStatus.PENDING);
        
        if (!reportError) {
          pendingReports = reportCount || 0;
        }
      } catch (error) {
        console.warn('Reports table may not exist:', error);
      }

      return {
        totalUsers,
        activeUsers,
        suspendedUsers,
        deactivatedUsers,
        pendingReports
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  /**
   * Get all users with pagination and filtering
   * Combines data from Supabase Auth and user_profiles table
   * 
   * @param {number} [page=1] - Page number (1-indexed)
   * @param {number} [limit=10] - Number of users per page
   * @param {Object} [filters={}] - Filter options
   * @param {string} [filters.role] - Filter by user role
   * @param {string} [filters.status] - Filter by user status
   * @param {string} [filters.search] - Search term for name/email
   * @returns {Promise<Object>} Paginated users result
   * @returns {Array} returns.users - Array of user objects
   * @returns {number} returns.total - Total number of users
   * @returns {number} returns.page - Current page number
   * @returns {number} returns.limit - Users per page
   * @returns {number} returns.totalPages - Total number of pages
   * @throws {Error} If user retrieval fails
   * 
   * @example
   * const result = await adminService.getAllUsers(1, 20, { role: 'ELDERLY', status: 'ACTIVE' });
   * console.log(`Found ${result.total} users`);
   */
  async getAllUsers(page = 1, limit = 10, filters = {}) {
    try {
      // Get users from Supabase Auth (using admin client)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: limit
      });

      if (authError) {
        throw new Error(`Failed to fetch auth users: ${authError.message}`);
      }

      // Get user profiles from database (using admin client to bypass RLS)
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('user_profiles')
        .select('*');

      if (profilesError) {
        console.warn('Failed to fetch profiles:', profilesError);
      }

      // Create a map of profiles by user_id for quick lookup
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });
      }

      let users = authData.users.map(authUser => {
        const profile = profilesMap.get(authUser.id);
        return {
          // Auth user data
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at,
          user_metadata: authUser.user_metadata,
          
          // Profile data (if exists)
          profile: profile || null,
          
          // Combined fields for easier access
          fullname: authUser.user_metadata?.name || authUser.user_metadata?.full_name || profile?.username,
          role: authUser.user_metadata?.role || profile?.role,
          status: authUser.user_metadata?.status || UserStatus.ACTIVE,
          avatar_url: authUser.user_metadata?.avatar_url || profile?.avatar_url,
          online: profile?.online || false
        };
      });

      // Apply filters
      if (filters.status) {
        users = users.filter(user => user.status === filters.status);
      }
      if (filters.role) {
        users = users.filter(user => user.role === filters.role);
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        users = users.filter(user => 
          user.email?.toLowerCase().includes(searchTerm) ||
          user.fullname?.toLowerCase().includes(searchTerm) ||
          user.profile?.username?.toLowerCase().includes(searchTerm)
        );
      }

      // Transform to our User domain model
      const transformedUsers = users.map(user => new User({
        userid: user.id,
        fullname: user.fullname,
        phone: user.user_metadata?.phone || '',
        email: user.email,
        profilePicture: user.avatar_url,
        status: user.status,
        role: user.role, // Add role field
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        suspendedAt: user.user_metadata?.suspended_at,
        suspensionReason: user.user_metadata?.suspension_reason,
        suspensionDuration: user.user_metadata?.suspension_duration,
        suspensionEndDate: user.user_metadata?.suspension_end_date,
        deactivatedAt: user.user_metadata?.deactivated_at,
        deactivationReason: user.user_metadata?.deactivation_reason,
        bannedAt: user.user_metadata?.banned_at,
        banReason: user.user_metadata?.ban_reason
      }));

      return {
        users: transformedUsers,
        total: authData.total || users.length,
        page,
        totalPages: Math.ceil((authData.total || users.length) / limit)
      };
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Get user by ID (combines Auth user + profile data)
  async getUserById(userId) {
    try {
      // Get auth user data using admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (authError) {
        if (authError.message.includes('not found')) {
          throw new Error('User not found');
        }
        throw new Error(`Failed to fetch user: ${authError.message}`);
      }

      // Get profile data using admin client
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('Failed to fetch profile:', profileError);
      }

      const authUser = authData.user;
      
      // Transform to our User domain model
      return new User({
        userid: authUser.id,
        fullname: authUser.user_metadata?.name || authUser.user_metadata?.full_name || profileData?.username,
        phone: authUser.user_metadata?.phone || '',
        email: authUser.email,
        profilePicture: authUser.user_metadata?.avatar_url || profileData?.avatar_url,
        status: authUser.user_metadata?.status || UserStatus.ACTIVE,
        createdAt: authUser.created_at,
        updatedAt: authUser.updated_at,
        suspendedAt: authUser.user_metadata?.suspended_at,
        suspensionReason: authUser.user_metadata?.suspension_reason,
        suspensionDuration: authUser.user_metadata?.suspension_duration,
        suspensionEndDate: authUser.user_metadata?.suspension_end_date,
        deactivatedAt: authUser.user_metadata?.deactivated_at,
        deactivationReason: authUser.user_metadata?.deactivation_reason,
        bannedAt: authUser.user_metadata?.banned_at,
        banReason: authUser.user_metadata?.ban_reason,
        // Additional profile data
        role: authUser.user_metadata?.role || profileData?.role,
        online: profileData?.online || false
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Suspend a user account
   * Updates both Auth metadata and profile status
   * @param {string} userId - User ID to suspend
   * @param {string} reason - Reason for suspension
   * @param {string} adminId - Admin user ID performing suspension
   * @param {number} [duration=7] - Suspension duration in days (7, 30, or 90)
   * @returns {Promise<User>} Updated user domain object
   * @throws {Error} If user cannot be suspended or update fails
   */
  async suspendUser(userId, reason, adminId, duration = 7) {
    try {
      // First get the user to validate
      const user = await this.getUserById(userId);
      
      // Check if user is manageable by admin (not an admin themselves)
      if (!user.isManageableByAdmin()) {
        throw new Error(`Cannot suspend admin users. Only elderly and volunteer users can be suspended.`);
      }
      
      if (!user.canBeSuspended()) {
        throw new Error(`User cannot be suspended. Current status: ${user.status}, role: ${user.role}. Only elderly and volunteer users can be suspended. Caregivers remain permanently active.`);
      }

      // Validate duration
      if (![7, 30, 90].includes(duration)) {
        throw new Error('Invalid suspension duration. Must be 7, 30, or 90 days.');
      }

      const suspendedAt = new Date().toISOString();
      const suspensionEndDate = new Date();
      suspensionEndDate.setDate(suspensionEndDate.getDate() + duration);
      const suspensionEndDateISO = suspensionEndDate.toISOString();
      
      // Get current user data to preserve existing metadata
      const { data: currentUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      // Update auth user metadata using admin client
      const { data: authUpdateData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...currentUser.user.user_metadata,
          status: UserStatus.SUSPENDED,
          suspended_at: suspendedAt,
          suspension_reason: reason,
          suspension_duration: duration,
          suspension_end_date: suspensionEndDateISO
        }
      });

      if (authError) {
        throw new Error(`Failed to update auth user: ${authError.message}`);
      }

      // Also update profile table if profile exists
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update({ 
          status: UserStatus.SUSPENDED,
          updated_at: suspendedAt 
        })
        .eq('user_id', userId);

      if (profileError) {
        console.warn('Failed to update profile status:', profileError);
        // Don't throw error - auth update is primary
      }

      // Log admin action
      await this.logAdminAction(adminId, 'SUSPEND_USER', userId, { reason });

      // Send notification to user based on their role
      try {
        const updatedUser = await this.getUserById(userId);
        if (updatedUser.role === Role.ELDERLY || updatedUser.role === 'ELDERLY') {
          await NotificationService.notifyAccountSuspended(userId, duration, reason);
        } else if (updatedUser.role === Role.CAREGIVER || updatedUser.role === 'CAREGIVER') {
          await NotificationService.notifyCaregiverAccountSuspended(userId, duration, reason);
        } else if (updatedUser.role === Role.VOLUNTEER || updatedUser.role === 'VOLUNTEER') {
          await NotificationService.notifyVolunteerAccountSuspended(userId, duration, reason);
        }
      } catch (notifError) {
        console.error('Error sending suspension notification:', notifError);
        // Don't fail the suspension if notification fails
      }

      // Return updated user
      return await this.getUserById(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deactivate a user account
   * Updates both Auth metadata and profile status
   * @param {string} userId - User ID to deactivate
   * @param {string} reason - Reason for deactivation
   * @param {string} adminId - Admin user ID performing deactivation
   * @returns {Promise<User>} Updated user domain object
   * @throws {Error} If user cannot be deactivated or update fails
   */
  async deactivateUser(userId, reason, adminId) {
    try {
      // First get the user to validate
      const user = await this.getUserById(userId);
      
      // Check if user is manageable by admin (not an admin themselves)
      if (!user.isManageableByAdmin()) {
        throw new Error(`Cannot deactivate admin users. Only elderly and volunteer users can be deactivated.`);
      }
      
      if (!user.canBeDeactivated()) {
        throw new Error(`User cannot be deactivated. Current status: ${user.status}, role: ${user.role}. Only elderly and volunteer users can be deactivated. Caregivers remain permanently active.`);
      }

      const deactivatedAt = new Date().toISOString();
      
      // Get current user data to preserve existing metadata
      const { data: currentUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      // Update auth user metadata using admin client
      const { data: authUpdateData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...currentUser.user.user_metadata,
          status: UserStatus.DEACTIVATED,
          deactivated_at: deactivatedAt,
          deactivation_reason: reason
        }
      });

      if (authError) {
        throw new Error(`Failed to update auth user: ${authError.message}`);
      }

      // Also update profile table if profile exists
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update({ 
          status: UserStatus.DEACTIVATED,
          updated_at: deactivatedAt 
        })
        .eq('user_id', userId);

      if (profileError) {
        console.warn('Failed to update profile status:', profileError);
        // Don't throw error - auth update is primary
      }

      // Log admin action
      await this.logAdminAction(adminId, 'DEACTIVATE_USER', userId, { reason });

      // Send notification to user based on their role
      try {
        const updatedUser = await this.getUserById(userId);
        if (updatedUser.role === Role.ELDERLY || updatedUser.role === 'ELDERLY') {
          await NotificationService.notifyAccountDeactivated(userId, reason);
        } else if (updatedUser.role === Role.CAREGIVER || updatedUser.role === 'CAREGIVER') {
          await NotificationService.notifyCaregiverAccountDeactivated(userId, reason);
        } else if (updatedUser.role === Role.VOLUNTEER || updatedUser.role === 'VOLUNTEER') {
          await NotificationService.notifyVolunteerAccountDeactivated(userId, reason);
        }
      } catch (notifError) {
        console.error('Error sending deactivation notification:', notifError);
        // Don't fail the deactivation if notification fails
      }

      // Return updated user
      return await this.getUserById(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reactivate a deactivated user account
   * @param {string} userId - User ID to reactivate
   * @param {string} adminId - Admin user ID performing reactivation
   * @param {string} reason - Reason for reactivation
   * @returns {Promise<User>} Updated user domain object
   * @throws {Error} If user cannot be reactivated or update fails
   */
  async reactivateUser(userId, adminId, reason) {
    try {
      // First get the user to validate
      const user = await this.getUserById(userId);
      
      // Check if user is manageable by admin (not an admin themselves)
      if (!user.isManageableByAdmin()) {
        throw new Error(`Cannot reactivate admin users. Only elderly and volunteer users can be reactivated.`);
      }
      
      if (!user.canBeReactivated()) {
        throw new Error(`User cannot be reactivated. Current status: ${user.status}, role: ${user.role}. Only deactivated elderly and volunteer users can be reactivated.`);
      }

      const reactivatedAt = new Date().toISOString();
      
      // Get current user data to preserve existing metadata
      const { data: currentUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      // Update auth user metadata using admin client
      const { data: authUpdateData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...currentUser.user.user_metadata,
          status: UserStatus.ACTIVE,
          deactivated_at: null,
          deactivation_reason: null,
          reactivated_at: reactivatedAt,
          reactivated_by: adminId,
          reactivation_reason: reason
        }
      });

      if (authError) {
        throw new Error(`Failed to update auth user: ${authError.message}`);
      }

      // Also update profile table if profile exists
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update({ 
          status: UserStatus.ACTIVE,
          updated_at: reactivatedAt 
        })
        .eq('user_id', userId);

      if (profileError) {
        console.warn('Failed to update profile status:', profileError);
        // Don't throw error - auth update is primary
      }

      // Log admin action with reason
      await this.logAdminAction(adminId, 'REACTIVATE_USER', userId, { reason });

      // Return updated user
      return await this.getUserById(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unsuspend a suspended user account
   * Can be automatic (when duration expires) or manual (admin action)
   * @param {string} userId - User ID to unsuspend
   * @param {string} [reason='Suspension period expired'] - Reason for unsuspension
   * @returns {Promise<User>} Updated user domain object
   * @throws {Error} If user cannot be unsuspended or update fails
   */
  async unsuspendUser(userId, reason = 'Suspension period expired') {
    try {
      // First get the user to validate
      const user = await this.getUserById(userId);
      
      // Check if user can be unsuspended (only suspended users)
      if (!user.canBeUnsuspended()) {
        throw new Error(`User cannot be unsuspended. Current status: ${user.status}, role: ${user.role}. Only suspended elderly and volunteer users can be unsuspended.`);
      }

      const unsuspendedAt = new Date().toISOString();
      
      // Get current user data to preserve existing metadata
      const { data: currentUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      // Update auth user metadata using admin client
      const { data: authUpdateData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...currentUser.user.user_metadata,
          status: UserStatus.ACTIVE,
          suspended_at: null,
          suspension_reason: null,
          suspension_duration: null,
          suspension_end_date: null,
          unsuspended_at: unsuspendedAt,
          unsuspension_reason: reason
        }
      });

      if (authError) {
        throw new Error(`Failed to update auth user: ${authError.message}`);
      }

      // Also update profile table if profile exists
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update({ 
          status: UserStatus.ACTIVE,
          updated_at: unsuspendedAt 
        })
        .eq('user_id', userId);

      if (profileError) {
        console.warn('Failed to update profile status:', profileError);
        // Don't throw error - auth update is primary
      }

      // Log system action (no adminId for automatic actions)
      await this.logAdminAction('SYSTEM', 'AUTO_UNSUSPEND_USER', userId, { reason });

      // Send notification to user based on their role
      try {
        const updatedUser = await this.getUserById(userId);
        if (updatedUser.role === Role.ELDERLY || updatedUser.role === 'ELDERLY') {
          await NotificationService.notifyAccountUnsuspended(userId);
        } else if (updatedUser.role === Role.CAREGIVER || updatedUser.role === 'CAREGIVER') {
          await NotificationService.notifyCaregiverAccountUnsuspended(userId);
        } else if (updatedUser.role === Role.VOLUNTEER || updatedUser.role === 'VOLUNTEER') {
          await NotificationService.notifyVolunteerAccountUnsuspended(userId);
        }
      } catch (notifError) {
        console.error('Error sending unsuspension notification:', notifError);
        // Don't fail the unsuspension if notification fails
      }

      // Return updated user
      return await this.getUserById(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Log admin action for audit trail
   * @param {string} adminId - Admin user ID (or 'SYSTEM' for automatic actions)
   * @param {string} action - Action type (e.g., 'SUSPEND_USER', 'DEACTIVATE_USER')
   * @param {string} targetId - Target user/resource ID
   * @param {Object} [metadata={}] - Additional metadata about the action
   * @returns {Promise<void>}
   */
  async logAdminAction(adminId, action, targetId, metadata = {}) {
    try {
      const { error } = await supabaseAdmin
        .from('admin_logs')
        .insert({
          admin_id: adminId,
          action,
          target_id: targetId,
          metadata,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log admin action:', error);
        // Don't throw error for logging failure to avoid breaking main operation
      }
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  /**
   * Get admin activity logs with pagination
   * @param {number} [page=1] - Page number (1-indexed)
   * @param {number} [limit=20] - Logs per page
   * @param {Object} [filters={}] - Filter options
   * @param {string} [filters.adminId] - Filter by admin ID
   * @param {string} [filters.action] - Filter by action type
   * @returns {Promise<Object>} Paginated logs result
   * @returns {Array} returns.logs - Array of log objects
   * @returns {number} returns.total - Total number of logs
   * @returns {number} returns.page - Current page number
   * @returns {number} returns.totalPages - Total number of pages
   * @throws {Error} If log retrieval fails
   */
  async getAdminLogs(page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let query = supabaseAdmin
        .from('admin_logs')
        .select(`
          *,
          admin:admin_id(id, profile)
        `, { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (filters.adminId) {
        query = query.eq('admin_id', filters.adminId);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch admin logs: ${error.message}`);
      }

      return {
        logs: data,
        total: count,
        page,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

module.exports = new AdminService();