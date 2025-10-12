const { supabaseAdmin } = require('../config/supabase');

class User {
    static async getAll() {
      try {
        const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*');
        
        if (error) {
          throw error;
        }
        
        return data;
        
      } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
      }
    }
    
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
  
  static async update(id, userData) {
    try {
      const { email, name, avatar } = userData;
      
      // get current user data
      const { data:currentUser }= await supabaseAdmin.auth.admin.getUserById(id);

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        id, {
          email,
          user_metadata: {
            ...currentUser.user.user_metadata,
            name,
            avatar_url: avatar,
            full_name: name
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