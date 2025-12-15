import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

/**
 * Middleware to verify JWT token and attach user info to request
 * Expects Authorization header with Bearer token
 */
export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user profile to fetch role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user'
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user has required role(s)
 * Use after authenticateUser middleware
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role || '')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that work for both authenticated and non-authenticated users
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (!authError && user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      req.user = {
        id: user.id,
        email: user.email,
        role: profile?.role || 'user'
      };
    }

    next();
  } catch (error) {
    // Ignore errors in optional auth
    next();
  }
};
