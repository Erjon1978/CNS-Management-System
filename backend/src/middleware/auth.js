const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id)
        .select('-password')
        .populate('group');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      if (!req.user.isActive) {
        return res.status(401).json({ message: 'Account is disabled' });
      }
      
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

const manager = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    next();
  } else {
    res.status(403).json({ message: 'Manager access required' });
  }
};

const hasCertification = (requiredCertification) => {
  return (req, res, next) => {
    if (req.user && req.user.certifications && 
        req.user.certifications.includes(requiredCertification)) {
      next();
    } else {
      res.status(403).json({ 
        message: `Required certification: ${requiredCertification}` 
      });
    }
  };
};

module.exports = { protect, admin, manager, hasCertification };