import { supabase, handleSupabaseError, createSuccessResponse } from '../lib/supabase.js';

export class UserService {
  // Get all users
  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return createSuccessResponse(data, 'Users retrieved successfully');
    } catch (error) {
      console.error('Get all users error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Get user by ID
  static async getUserById(id) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      if (!data) {
        return { success: false, error: 'User not found' };
      }

      return createSuccessResponse(data, 'User retrieved successfully');
    } catch (error) {
      console.error('Get user by ID error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Create new user
  static async createUser(userData) {
    try {
      const { email, password, full_name, role, phone } = userData;

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            role
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      // Wait for profile to be created by trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile with additional info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({
          phone,
          is_active: true
        })
        .eq('id', authData.user.id)
        .select()
        .single();

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Still return success since user was created
      }

      return createSuccessResponse(
        profile || {
          id: authData.user.id,
          email: authData.user.email,
          full_name,
          role,
          phone,
          is_active: true
        },
        'User created successfully'
      );
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Update user
  static async updateUser(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      if (!data) {
        return { success: false, error: 'User not found' };
      }

      return createSuccessResponse(data, 'User updated successfully');
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Delete user (permanent deletion)
  static async deleteUser(id) {
    try {
      // First delete from Supabase Auth (this will cascade to profile)
      const { error: authError } = await supabase.auth.admin.deleteUser(id);

      if (authError) {
        // If auth deletion fails, try to just deactivate
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_active: false })
          .eq('id', id);

        if (updateError) {
          return { success: false, error: handleSupabaseError(updateError) };
        }

        return createSuccessResponse(null, 'User deactivated (could not delete permanently)');
      }

      return createSuccessResponse(null, 'User deleted permanently');
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Toggle user active status
  static async toggleUserStatus(id) {
    try {
      // Get current status first
      const { data: currentUser, error: fetchError } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError || !currentUser) {
        return { success: false, error: 'User not found' };
      }

      // Toggle status
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active: !currentUser.is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return createSuccessResponse(data, `User ${data.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Toggle user status error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}
