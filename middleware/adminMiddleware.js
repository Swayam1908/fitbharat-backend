const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Authorization error: ' + err.message,
    });
  }
};

module.exports = adminMiddleware;
