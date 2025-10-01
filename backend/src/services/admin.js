const { supabase, supabaseAdmin } = require('../config/supabase');
const User = require('../domain/User');

class AdminService {
  
  // Get dashboard statistics
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
        (user.user_metadata?.status || 'active') === 'active'
      ).length;
      const suspendedUsers = authData.users.filter(user => 
        user.user_metadata?.status === 'suspended'
      ).length;
      const deactivatedUsers = authData.users.filter(user => 
        user.user_metadata?.status === 'deactivated'
      ).length;

      // Get help requests count (if table exists)
      let totalRequests = 0;
      let pendingRequests = 0;
      try {
        const { count: requestCount, error: requestError } = await supabaseAdmin
          .from('help_requests')
          .select('*', { count: 'exact', head: true });
        
        if (!requestError) {
          totalRequests = requestCount || 0;
        }

        const { count: pendingCount, error: pendingError } = await supabaseAdmin
          .from('help_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        if (!pendingError) {
          pendingRequests = pendingCount || 0;
        }
      } catch (error) {
        console.warn('Help requests table may not exist:', error);
      }

      // Get pending reports count (if table exists)
      let pendingReports = 0;
      try {
        const { count: reportCount, error: reportError } = await supabaseAdmin
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
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
        totalRequests,
        pendingRequests,
        pendingReports
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  // Get all users with pagination (combines Auth users + profiles)
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
          status: authUser.user_metadata?.status || 'active',
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
        status: authUser.user_metadata?.status || 'active',
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

  // Suspend user (updates both Auth metadata and profile status)
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
          status: User.STATUS.SUSPENDED,
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
          status: User.STATUS.SUSPENDED,
          updated_at: suspendedAt 
        })
        .eq('user_id', userId);

      if (profileError) {
        console.warn('Failed to update profile status:', profileError);
        // Don't throw error - auth update is primary
      }

      // Log admin action
      await this.logAdminAction(adminId, 'SUSPEND_USER', userId, { reason });

      // Return updated user
      return await this.getUserById(userId);
    } catch (error) {
      throw error;
    }
  }

  // Deactivate user (updates both Auth metadata and profile status)
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
          status: User.STATUS.DEACTIVATED,
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
          status: User.STATUS.DEACTIVATED,
          updated_at: deactivatedAt 
        })
        .eq('user_id', userId);

      if (profileError) {
        console.warn('Failed to update profile status:', profileError);
        // Don't throw error - auth update is primary
      }

      // Log admin action
      await this.logAdminAction(adminId, 'DEACTIVATE_USER', userId, { reason });

      // Return updated user
      return await this.getUserById(userId);
    } catch (error) {
      throw error;
    }
  }

  // Reactivate user (manual admin reactivation for deactivated accounts)
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
          status: User.STATUS.ACTIVE,
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
          status: User.STATUS.ACTIVE,
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

  // Unsuspend user (automatic unsuspension when duration expires)
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
          status: User.STATUS.ACTIVE,
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
          status: User.STATUS.ACTIVE,
          updated_at: unsuspendedAt 
        })
        .eq('user_id', userId);

      if (profileError) {
        console.warn('Failed to update profile status:', profileError);
        // Don't throw error - auth update is primary
      }

      // Log system action (no adminId for automatic actions)
      await this.logAdminAction('SYSTEM', 'AUTO_UNSUSPEND_USER', userId, { reason });

      // Return updated user
      return await this.getUserById(userId);
    } catch (error) {
      throw error;
    }
  }

  // Get all help requests with pagination
  async getAllRequests(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let query = supabaseAdmin
        .from('help_requests')
        .select(`
          *,
          elderly:elderly_id(id, profile),
          volunteer:volunteer_id(id, profile)
        `, { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch requests: ${error.message}`);
      }

      return {
        requests: data,
        total: count,
        page,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Reassign volunteer to a request
  async reassignVolunteer(requestId, newVolunteerId, adminId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('help_requests')
        .update({
          volunteer_id: newVolunteerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to reassign volunteer: ${error.message}`);
      }

      // Log admin action
      await this.logAdminAction(adminId, 'REASSIGN_VOLUNTEER', requestId, { 
        newVolunteerId 
      });

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Log admin actions for audit trail (uses admin client to bypass RLS)
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

  // Get admin activity logs
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