import { supabase, handleSupabaseError, createSuccessResponse } from '../lib/supabase.js';

export class PatientService {
  // Get all patients with pagination and search
  static async getAllPatients(page = 1, limit = 50, search = '') {
    try {
      let query = supabase.from('patients').select('*');
      
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return createSuccessResponse(data, 'Patients retrieved successfully');
    } catch (error) {
      console.error('Get all patients error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Get single patient
  static async getPatientById(id) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      if (!data) {
        return { success: false, error: 'Patient not found' };
      }

      return createSuccessResponse(data, 'Patient retrieved successfully');
    } catch (error) {
      console.error('Get patient by ID error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Create new patient with auto-numbering
  static async createPatient(patientData) {
    try {
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
          ...patientData
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return createSuccessResponse(data, 'Patient created successfully');
    } catch (error) {
      console.error('Create patient error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Update patient
  static async updatePatient(id, updateData) {
    try {
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
        return { success: false, error: handleSupabaseError(error) };
      }

      if (!data) {
        return { success: false, error: 'Patient not found' };
      }

      return createSuccessResponse(data, 'Patient updated successfully');
    } catch (error) {
      console.error('Update patient error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Delete patient
  static async deletePatient(id) {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return createSuccessResponse(null, 'Patient deleted successfully');
    } catch (error) {
      console.error('Delete patient error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Get patient statistics
  static async getPatientStats() {
    try {
      const { data: totalPatients, error: countError } = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true });

      if (countError) {
        return { success: false, error: handleSupabaseError(countError) };
      }

      const { data: newPatients, error: newError } = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (newError) {
        return { success: false, error: handleSupabaseError(newError) };
      }

      return createSuccessResponse({
        totalPatients: totalPatients || 0,
        newPatientsThisMonth: newPatients || 0
      }, 'Patient statistics retrieved successfully');
    } catch (error) {
      console.error('Get patient stats error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}
