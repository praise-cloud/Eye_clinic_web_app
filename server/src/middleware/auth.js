import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !profile) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token or user not found'
      });
    }

    if (!profile.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Attach user to request
    req.user = profile;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Role-based access control
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Admin only middleware
const requireAdmin = requireRole(['admin']);

// Admin or Manager middleware
const requireAdminOrManager = requireRole(['admin', 'manager']);

// Admin or Frontdesk middleware
const requireAdminOrFrontdesk = requireRole(['admin', 'frontdesk']);

// Doctor only middleware
const requireDoctor = requireRole(['doctor']);

// Any authenticated user middleware
const requireAuth = requireRole(['admin', 'manager', 'doctor', 'frontdesk']);

export {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireAdminOrManager,
  requireAdminOrFrontdesk,
  requireDoctor,
  requireAuth
};
