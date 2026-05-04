import express from 'express';
import { supabase, handleSupabaseError, createSuccessResponse } from '../lib/supabase.js';

const router = express.Router();

// Get all drugs
router.get('/drugs', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category } = req.query;
    
    let query = supabase.from('drugs').select('*');
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,generic_name.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query
      .order('name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.json(createSuccessResponse(data, 'Drugs retrieved successfully'));

  } catch (error) {
    console.error('Get drugs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all glasses inventory
router.get('/glasses', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, brand, gender } = req.query;
    
    let query = supabase.from('glasses_inventory').select('*');
    
    if (search) {
      query = query.or(`frame_name.ilike.%${search}%,frame_brand.ilike.%${search}%`);
    }

    if (brand) {
      query = query.eq('frame_brand', brand);
    }

    if (gender) {
      query = query.eq('gender', gender);
    }
    
    const { data, error } = await query
      .order('frame_name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.json(createSuccessResponse(data, 'Glasses inventory retrieved successfully'));

  } catch (error) {
    console.error('Get glasses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all other inventory items
router.get('/others', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category } = req.query;
    
    let query = supabase.from('inventory_others').select('*');
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query
      .order('name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.json(createSuccessResponse(data, 'Other inventory items retrieved successfully'));

  } catch (error) {
    console.error('Get other inventory error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add new drug
router.post('/drugs', async (req, res) => {
  try {
    const {
      name,
      generic_name,
      category,
      unit,
      quantity,
      reorder_level,
      purchase_price,
      selling_price,
      supplier,
      expiry_date,
      batch_number,
      storage_location
    } = req.body;

    if (!name || !unit || !selling_price) {
      return res.status(400).json({
        success: false,
        error: 'Name, unit, and selling price are required'
      });
    }

    const { data, error } = await supabase
      .from('drugs')
      .insert({
        name,
        generic_name,
        category,
        unit,
        quantity: quantity || 0,
        reorder_level: reorder_level || 10,
        purchase_price,
        selling_price,
        supplier,
        expiry_date,
        batch_number,
        storage_location,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.status(201).json(createSuccessResponse(data, 'Drug added successfully'));

  } catch (error) {
    console.error('Add drug error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add new glasses frame
router.post('/glasses', async (req, res) => {
  try {
    const {
      frame_name,
      frame_brand,
      frame_code,
      color,
      material,
      gender,
      frame_type,
      size,
      quantity,
      reorder_level,
      purchase_price,
      selling_price,
      supplier
    } = req.body;

    if (!frame_name || !selling_price) {
      return res.status(400).json({
        success: false,
        error: 'Frame name and selling price are required'
      });
    }

    const { data, error } = await supabase
      .from('glasses_inventory')
      .insert({
        frame_name,
        frame_brand,
        frame_code,
        color,
        material,
        gender,
        frame_type,
        size,
        quantity: quantity || 0,
        reorder_level: reorder_level || 3,
        purchase_price,
        selling_price,
        supplier,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.status(201).json(createSuccessResponse(data, 'Glasses frame added successfully'));

  } catch (error) {
    console.error('Add glasses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add other inventory item
router.post('/others', async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      unit,
      quantity,
      reorder_level,
      purchase_price,
      selling_price,
      supplier,
      storage_location
    } = req.body;

    if (!name || !unit || !selling_price) {
      return res.status(400).json({
        success: false,
        error: 'Name, unit, and selling price are required'
      });
    }

    const { data, error } = await supabase
      .from('inventory_others')
      .insert({
        name,
        category,
        description,
        unit,
        quantity: quantity || 0,
        reorder_level: reorder_level || 5,
        purchase_price,
        selling_price,
        supplier,
        storage_location,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json(handleSupabaseError(error));
    }

    res.status(201).json(createSuccessResponse(data, 'Inventory item added successfully'));

  } catch (error) {
    console.error('Add inventory item error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update drug
router.put('/drugs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('drugs')
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
        error: 'Drug not found'
      });
    }

    res.json(createSuccessResponse(data, 'Drug updated successfully'));

  } catch (error) {
    console.error('Update drug error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update glasses
router.put('/glasses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('glasses_inventory')
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
        error: 'Glasses frame not found'
      });
    }

    res.json(createSuccessResponse(data, 'Glasses frame updated successfully'));

  } catch (error) {
    console.error('Update glasses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update other inventory item
router.put('/others/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('inventory_others')
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
        error: 'Inventory item not found'
      });
    }

    res.json(createSuccessResponse(data, 'Inventory item updated successfully'));

  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const [drugs, glasses, others] = await Promise.all([
      supabase.from('drugs').select('*').lt('quantity', 'reorder_level').eq('is_active', true),
      supabase.from('glasses_inventory').select('*').lt('quantity', 'reorder_level').eq('is_active', true),
      supabase.from('inventory_others').select('*').lt('quantity', 'reorder_level').eq('is_active', true)
    ]);

    const lowStockItems = {
      drugs: drugs.data || [],
      glasses: glasses.data || [],
      others: others.data || [],
      total: (drugs.data?.length || 0) + (glasses.data?.length || 0) + (others.data?.length || 0)
    };

    res.json(createSuccessResponse(lowStockItems, 'Low stock items retrieved successfully'));

  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
