import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase, createSuccessResponse } from '../lib/supabase.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Set HTTP-only cookie
const setAuthCookie = (res, token) => {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Use Supabase Auth to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({
        success: false,
        error: 'User profile not found'
      });
    }

    if (!profile.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Generate JWT for our app (using Supabase session)
    const token = generateToken({
      id: authData.user.id,
      email: authData.user.email,
      role: profile.role
    });
    
    setAuthCookie(res, token);

    res.json(createSuccessResponse({
      token,
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        is_active: profile.is_active
      }
    }, 'Login successful'));

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role = 'frontdesk' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and full name are required'
      });
    }

    // Check if user already exists in profiles table
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser && !checkError) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user using Supabase Auth
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
      console.error('Auth creation error:', authError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user account'
      });
    }

    // Get the created profile (should be auto-created by trigger)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile retrieval error:', profileError);
      return res.status(500).json({
        success: false,
        error: 'User created but profile setup failed'
      });
    }

    res.status(201).json(createSuccessResponse({
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        is_active: profile.is_active
      }
    }, 'Registration successful'));

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify our custom JWT (do NOT pass this to supabase.auth.getUser)
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get fresh user profile data using the decoded user id
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !profile) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!profile.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    res.json(createSuccessResponse({
      user: profile
    }, 'Token valid'));

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // You could implement token blacklisting here
      // For now, just return success
    }

    res.json(createSuccessResponse(null, 'Logout successful'));

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
