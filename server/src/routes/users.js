import express from 'express';
import { supabase, handleSupabaseError, createSuccessResponse } from '../lib/supabase.js';

const router = express.Router();

// Get all users (admin/manager only)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.json(createSuccessResponse(data, 'Users retrieved successfully'));

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new user (admin/manager only)
router.post('/', async (req, res) => {
  try {
    const { email, password, full_name, role, phone } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, full name, and role are required'
      });
    }

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
      return res.status(400).json({
        success: false,
        error: authError.message
      });
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

    res.status(201).json(createSuccessResponse({
      user: profile || {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        role,
        phone,
        is_active: true
      }
    }, 'User created successfully'));

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update user (admin/manager only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, phone, is_active } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        role,
        phone,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json(createSuccessResponse(data, 'User updated successfully'));

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete user (admin only - permanent deletion)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // First delete from Supabase Auth (this will cascade to profile)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      // If auth deletion fails, try to just deactivate
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id);

      if (updateError) {
        return res.status(500).json(handleSupabaseError(updateError));
      }

      return res.json(createSuccessResponse(null, 'User deactivated (could not delete permanently)'));
    }

    res.json(createSuccessResponse(null, 'User deleted permanently'));

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Toggle user active status
router.patch('/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;

    // Get current status first
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError || !currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Toggle status
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: !currentUser.is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.json(createSuccessResponse(data, `User ${data.is_active ? 'activated' : 'deactivated'} successfully`));

  } catch (error) {
    console.error('Toggle active status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
