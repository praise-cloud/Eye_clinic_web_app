import express from 'express';
import { supabase, handleSupabaseError, createSuccessResponse } from '../lib/supabase.js';

const router = express.Router();

// Generate receipt number
const generateReceiptNumber = async () => {
  try {
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('receipt_number')
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = existingPayments?.[0]?.receipt_number || 'RCP-00000';
    const numericPart = parseInt(lastNumber.split('-')[1]) + 1;
    return `RCP-${numericPart.toString().padStart(5, '0')}`;
  } catch (error) {
    return 'RCP-00001';
  }
};

// Get all payments
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, patient_id, payment_type, date } = req.query;
    
    let query = supabase.from('payments')
      .select(`
        *,
        patients!payments_patient_id_fkey (
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email
        )
      `);

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    if (payment_type) {
      query = query.eq('payment_type', payment_type);
    }

    if (date) {
      query = query.gte('paid_at', `${date}T00:00:00`)
                   .lte('paid_at', `${date}T23:59:59`);
    }
    
    const { data, error } = await query
      .order('paid_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.json(createSuccessResponse(data, 'Payments retrieved successfully'));

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get single payment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        patients!payments_patient_id_fkey (
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email
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
        error: 'Payment not found'
      });
    }

    res.json(createSuccessResponse(data, 'Payment retrieved successfully'));

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new payment
router.post('/', async (req, res) => {
  try {
    const {
      patient_id,
      payment_type,
      amount,
      payment_method,
      notes,
      received_by
    } = req.body;

    if (!patient_id || !payment_type || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID, payment type, and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    const receipt_number = await generateReceiptNumber();

    const { data, error } = await supabase
      .from('payments')
      .insert({
        receipt_number,
        patient_id,
        payment_type,
        amount,
        payment_method,
        notes,
        received_by,
        paid_at: new Date().toISOString()
      })
      .select(`
        *,
        patients!payments_patient_id_fkey (
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .single();

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.status(201).json(createSuccessResponse(data, 'Payment recorded successfully'));

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update payment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('payments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        patients!payments_patient_id_fkey (
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .single();

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json(createSuccessResponse(data, 'Payment updated successfully'));

  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.json(createSuccessResponse(null, 'Payment deleted successfully'));

  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get payment statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { date } = req.query;
    
    let query = supabase.from('payments').select('payment_type, amount, paid_at');
    
    if (date) {
      query = query.gte('paid_at', `${date}T00:00:00`)
                   .lte('paid_at', `${date}T23:59:59`);
    } else {
      query = query.gte('paid_at', new Date().toDateString());
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    const stats = {
      totalRevenue: data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      totalPayments: data?.length || 0,
      consultationRevenue: data?.filter(p => p.payment_type === 'consultation').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      drugRevenue: data?.filter(p => p.payment_type === 'drug').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      glassesRevenue: data?.filter(p => p.payment_type === 'glasses_deposit' || p.payment_type === 'glasses_balance').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      subscriptionRevenue: data?.filter(p => p.payment_type === 'subscription').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      otherRevenue: data?.filter(p => p.payment_type === 'other').reduce((sum, p) => sum + Number(p.amount), 0) || 0
    };

    res.json(createSuccessResponse(stats, 'Payment statistics retrieved successfully'));

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
