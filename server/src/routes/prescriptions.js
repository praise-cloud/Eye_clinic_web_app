import express from 'express';
import { supabase, handleSupabaseError, createSuccessResponse } from '../lib/supabase.js';

const router = express.Router();

// Get all prescriptions
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, patient_id, doctor_id, status } = req.query;
    
    let query = supabase.from('prescriptions')
      .select(`
        *,
        patients!prescriptions_patient_id_fkey (
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email
        ),
        profiles!prescriptions_doctor_id_fkey (
          id,
          full_name,
          role
        )
      `);

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    if (doctor_id) {
      query = query.eq('doctor_id', doctor_id);
    }

    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.json(createSuccessResponse(data, 'Prescriptions retrieved successfully'));

  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get single prescription
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        patients!prescriptions_patient_id_fkey (
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email
        ),
        profiles!prescriptions_doctor_id_fkey (
          id,
          full_name,
          role
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
    }

    res.json(createSuccessResponse(data, 'Prescription retrieved successfully'));

  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new prescription
router.post('/', async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      case_note_id,
      re_sphere,
      re_cylinder,
      re_axis,
      re_add,
      re_va,
      le_sphere,
      le_cylinder,
      le_axis,
      le_add,
      le_va,
      pd,
      lens_type,
      notes
    } = req.body;

    if (!patient_id || !doctor_id) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID and Doctor ID are required'
      });
    }

    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        patient_id,
        doctor_id,
        case_note_id,
        re_sphere,
        re_cylinder,
        re_axis,
        re_add,
        re_va,
        le_sphere,
        le_cylinder,
        le_axis,
        le_add,
        le_va,
        pd,
        lens_type,
        notes,
        status: 'pending'
      })
      .select(`
        *,
        patients!prescriptions_patient_id_fkey (
          id,
          patient_number,
          first_name,
          last_name
        ),
        profiles!prescriptions_doctor_id_fkey (
          id,
          full_name,
          role
        )
      `)
      .single();

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.status(201).json(createSuccessResponse(data, 'Prescription created successfully'));

  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update prescription
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('prescriptions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        patients!prescriptions_patient_id_fkey (
          id,
          patient_number,
          first_name,
          last_name
        ),
        profiles!prescriptions_doctor_id_fkey (
          id,
          full_name,
          role
        )
      `)
      .single();

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
    }

    res.json(createSuccessResponse(data, 'Prescription updated successfully'));

  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update prescription status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'dispensed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const { data, error } = await supabase
      .from('prescriptions')
      .update({ 
        status,
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
        error: 'Prescription not found'
      });
    }

    res.json(createSuccessResponse(data, `Prescription status updated to ${status}`));

  } catch (error) {
    console.error('Update prescription status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete prescription
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.json(createSuccessResponse(null, 'Prescription deleted successfully'));

  } catch (error) {
    console.error('Delete prescription error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
