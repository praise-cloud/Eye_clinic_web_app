import express from 'express';
import { supabase, handleSupabaseError, createSuccessResponse } from '../lib/supabase.js';

const router = express.Router();

// Get all patients
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    
    let query = supabase.from('patients').select('*');
    
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.json(createSuccessResponse(data, 'Patients retrieved successfully'));

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get single patient
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    res.json(createSuccessResponse(data, 'Patient retrieved successfully'));

  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new patient
router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      occupation,
      next_of_kin_name,
      next_of_kin_phone,
      allergies
    } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required'
      });
    }

    // Generate patient number
    const { data: existingPatients } = await supabase
      .from('patients')
      .select('patient_number')
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = existingPatients?.[0]?.patient_number || 'PAT-00000';
    const numericPart = parseInt(lastNumber.split('-')[1]) + 1;
    const patient_number = `PAT-${numericPart.toString().padStart(5, '0')}`;

    const { data, error } = await supabase
      .from('patients')
      .insert({
        patient_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        occupation,
        next_of_kin_name,
        next_of_kin_phone,
        allergies,
        registered_by: req.user?.id // Will be set by auth middleware
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.status(201).json(createSuccessResponse(data, 'Patient created successfully'));

  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('patients')
      .update({
        ...updateData,
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
        error: 'Patient not found'
      });
    }

    res.json(createSuccessResponse(data, 'Patient updated successfully'));

  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete patient (admin/frontdesk only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.json(createSuccessResponse(null, 'Patient deleted successfully'));

  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
