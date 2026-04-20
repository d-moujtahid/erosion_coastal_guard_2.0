// middleware/rbac.js
const PERMISSIONS = {
  super_admin: ['read:all','write:all','delete:all','manage:users','view:audit'],
  scientist:   ['read:segments','read:mesures','write:mesures','export:data'],
  analyst:     ['read:segments','read:mesures','generate:reports'],
  operator:    ['read:segments','read:mesures','write:alertes'],
  viewer:      ['read:segments','read:alertes']
};

const authorize = (permission) => (req, res, next) => {
  const role  = req.user?.role;
  const perms = PERMISSIONS[role] || [];

  if (perms.includes(permission) || perms.includes('write:all')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: `Accès refusé. Rôle "${role}" → "${permission}" requis.`
  });
};

module.exports = { authorize };