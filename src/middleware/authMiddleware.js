const jwt = require("jsonwebtoken");
const { findUserByPkWithRelations, serializeUser } = require("../services/userService");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await findUserByPkWithRelations(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = serializeUser(user);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = { protect, authorize };
