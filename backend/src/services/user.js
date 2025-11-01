const { supabaseAdmin } = require('../config/supabase');

/**
 * User Service
 * Handles user data operations using Supabase Auth and user_profiles table
 * Provides CRUD operations for user management
 * 
 * @class User
 * @static
 * @example
 * // Get all users
 * const users = await User.getAll();
 * 
 * // Find user by ID
 * const user = await User.findById('user-123');
 */
class User {
    /**
     * Get all users from Supabase Auth
     * Merges data from Supabase Auth with user_profiles table
     * 
     * @static
     * @returns {Promise<Array>} Array of user objects with merged profile data
     * @throws {Error} If user retrieval fails
     * 
     * @example
     * const users = await User.getAll();
     * console.log(`Total users: ${users.length}`);
     */
    static async getAll() {
      try {
        // Get all users from Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (authError) {
          throw authError;
        }
        
        // Get user profiles from database
        const { data: profilesData, error: profilesError } = await supabaseAdmin
          .from('user_profiles')
          .select('*');
        
        if (profilesError) {
          console.warn('Error fetching user profiles:', profilesError);
        }
        
        // Merge auth data with profile data
        const users = authData.users.map(user => {
          const profile = profilesData?.find(p => p.user_id === user.id);
          
          return {
            ...user,
            // Merge profile data if it exists, otherwise use user_metadata
            user_metadata: {
              ...user.user_metadata,
              role: profile?.role || user.user_metadata?.role,
              phone: profile?.phone_number || user.user_metadata?.phone_number,
              status: profile?.status || user.user_metadata?.status || 'active',
              online: profile?.online || false,
              linking_pin: profile?.linking_pin
            }
          };
        });
        
        return users;
        
      } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
      }
    }
    
    /**
     * Find user by ID
     * Retrieves user from Supabase Auth by user ID
     * 
     * @static
     * @param {string} id - User ID to find
     * @returns {Promise<Object>} User object from Supabase Auth
     * @throws {Error} If user not found or retrieval fails
     * 
     * @example
     * const user = await User.findById('user-123');
     * console.log(user.email);
     */
    static async findById(id){
        try {
            const {data, error} = await supabaseAdmin.auth.admin.getUserById(id);

            if (error){
                throw error;
            }
            return data.user;
        }   catch (error){
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }

    static async findByProviderId(provider, providerId){
            try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        throw error;
      }
      
      const user =data.users.find(u =>
        u.user_metadata?.provider === provider &&
        u.user_metadata?.provider_id === providerId
      )

      return user || null;
    } catch (error) {
      console.error('Error finding user by provider ID:', error);
      throw error;
    }
  }
    
    static async findByEmail(email) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        throw error;
      }
      
      const user = data.users.find(u => u.email=email);
      return user || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }
  
  static async create(userData) {
    try {
      const { provider, providerId, email, name, avatar } = userData;
      
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          provider,
          provider_id: providerId,
          name,
          avatar: avatar,
          full_name: name
        }
      });
      
      if (error) {
        throw error;
      }
      
      return data.user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
    /**
     * Update user data
     * Updates user information in Supabase Auth and user_metadata
     * 
     * @static
     * @param {string} id - User ID to update
     * @param {Object} userData - User data to update
     * @param {string} [userData.email] - User email
     * @param {string} [userData.name] - User name
     * @param {string} [userData.avatar] - Avatar URL
     * @param {string} [userData.phone_number] - Phone number
     * @returns {Promise<Object>} Updated user object
     * @throws {Error} If update fails
     * 
     * @example
     * const updated = await User.update('user-123', {
     *   name: 'John Doe',
     *   email: 'john@example.com'
     * });
     */
    static async update(id, userData) {
    try {
      const { email, name, avatar, phone_number } = userData;
      
      // get current user data
      const { data:currentUser }= await supabaseAdmin.auth.admin.getUserById(id);

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        id, {
          email,
          user_metadata: {
            ...currentUser.user.user_metadata,
            name,
            avatar_url: avatar,
            full_name: name,
            phone_number
          }
      });
      
      if (error) {
        throw error;
      }
      
      return data.user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  static async delete(id) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.deleteUser(id);
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
  
  
}

module.exports=User;