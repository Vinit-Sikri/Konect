// src/middleware/authMiddleware.js
const { verifyToken } = require('../../utils/jwtUtils');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ❌ No header
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // ❌ Wrong format
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
  }

  try {
    // ✅ Extract token properly
    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    req.userId = decoded.userId;
    req.userMail = decoded.userMail;

    next();
  } catch (error) {
    console.error("Failed to verify token:", error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = { authenticate };