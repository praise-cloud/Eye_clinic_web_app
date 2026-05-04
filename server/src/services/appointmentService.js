import { supabase, handleSupabaseError, createSuccessResponse } from '../lib/supabase.js';

export class AppointmentService {
  // Get all appointments with filters
  static async getAllAppointments(filters = {}) {
    try {
      const { page = 1, limit = 50, date, doctor_id, status } = filters;
      
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
        return { success: false, error: handleSupabaseError(error) };
      }

      return createSuccessResponse(data, 'Appointments retrieved successfully');
    } catch (error) {
      console.error('Get all appointments error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Get single appointment
  static async getAppointmentById(id) {
    try {
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
        return { success: false, error: handleSupabaseError(error) };
      }

      if (!data) {
        return { success: false, error: 'Appointment not found' };
      }

      return createSuccessResponse(data, 'Appointment retrieved successfully');
    } catch (error) {
      console.error('Get appointment by ID error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Create new appointment
  static async createAppointment(appointmentData) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
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
        return { success: false, error: handleSupabaseError(error) };
      }

      return createSuccessResponse(data, 'Appointment created successfully');
    } catch (error) {
      console.error('Create appointment error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Update appointment
  static async updateAppointment(id, updateData) {
    try {
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
        return { success: false, error: handleSupabaseError(error) };
      }

      if (!data) {
        return { success: false, error: 'Appointment not found' };
      }

      return createSuccessResponse(data, 'Appointment updated successfully');
    } catch (error) {
      console.error('Update appointment error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Update appointment status
  static async updateAppointmentStatus(id, status) {
    try {
      if (!['pending', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show'].includes(status)) {
        return { success: false, error: 'Invalid status' };
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
        return { success: false, error: handleSupabaseError(error) };
      }

      if (!data) {
        return { success: false, error: 'Appointment not found' };
      }

      return createSuccessResponse(data, `Appointment status updated to ${status}`);
    } catch (error) {
      console.error('Update appointment status error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Delete appointment
  static async deleteAppointment(id) {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return createSuccessResponse(null, 'Appointment deleted successfully');
    } catch (error) {
      console.error('Delete appointment error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Get appointment statistics
  static async getAppointmentStats(date = null) {
    try {
      let query = supabase.from('appointments').select('status, scheduled_at');
      
      if (date) {
        query = query.gte('scheduled_at', `${date}T00:00:00`)
                     .lte('scheduled_at', `${date}T23:59:59`);
      } else {
        query = query.gte('scheduled_at', new Date().toDateString());
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      const stats = {
        total: data?.length || 0,
        pending: data?.filter(a => a.status === 'pending').length || 0,
        confirmed: data?.filter(a => a.status === 'confirmed').length || 0,
        completed: data?.filter(a => a.status === 'completed').length || 0,
        cancelled: data?.filter(a => a.status === 'cancelled').length || 0,
        no_show: data?.filter(a => a.status === 'no_show').length || 0
      };

      return createSuccessResponse(stats, 'Appointment statistics retrieved successfully');
    } catch (error) {
      console.error('Get appointment stats error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}
