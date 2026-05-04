import express from 'express';
import { supabase, handleSupabaseError, createSuccessResponse } from '../lib/supabase.js';

const router = express.Router();

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, date, doctor_id, status } = req.query;
    
    let query = supabase.from('appointments')
      .select(`
        *,
        patients!appointments_patient_id_fkey (
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email
        ),
        profiles!appointments_doctor_id_fkey (
          id,
          full_name,
          role
        )
      `);

    if (date) {
      query = query.gte('scheduled_at', `${date}T00:00:00`)
                   .lte('scheduled_at', `${date}T23:59:59`);
    }

    if (doctor_id) {
      query = query.eq('doctor_id', doctor_id);
    }

    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query
      .order('scheduled_at', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.json(createSuccessResponse(data, 'Appointments retrieved successfully'));

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get single appointment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients!appointments_patient_id_fkey (
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email,
          date_of_birth,
          gender
        ),
        profiles!appointments_doctor_id_fkey (
          id,
          full_name,
          role,
          phone
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
        error: 'Appointment not found'
      });
    }

    res.json(createSuccessResponse(data, 'Appointment retrieved successfully'));

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new appointment
router.post('/', async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      scheduled_at,
      appointment_type,
      notes,
      requested_by
    } = req.body;

    if (!patient_id || !doctor_id || !scheduled_at || !appointment_type) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID, doctor ID, scheduled time, and appointment type are required'
      });
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id,
        doctor_id,
        scheduled_at,
        appointment_type,
        notes,
        requested_by
      })
      .select(`
        *,
        patients!appointments_patient_id_fkey (
          id,
          patient_number,
          first_name,
          last_name,
          phone
        ),
        profiles!appointments_doctor_id_fkey (
          id,
          full_name,
          role
        )
      `)
      .single();

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.status(201).json(createSuccessResponse(data, 'Appointment created successfully'));

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update appointment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('appointments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        patients!appointments_patient_id_fkey (
          id,
          patient_number,
          first_name,
          last_name,
          phone
        ),
        profiles!appointments_doctor_id_fkey (
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
        error: 'Appointment not found'
      });
    }

    res.json(createSuccessResponse(data, 'Appointment updated successfully'));

  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.json(createSuccessResponse(null, 'Appointment deleted successfully'));

  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update appointment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const { data, error } = await supabase
      .from('appointments')
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
        error: 'Appointment not found'
      });
    }

    res.json(createSuccessResponse(data, `Appointment status updated to ${status}`));

  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
