function verifyAdminPassword(password) {
  return password === process.env.ADMIN_PASSWORD;
}

function requireAdminPassword(req, res, next) {
  const password = req.body.admin_password;

  if (!verifyAdminPassword(password)) {
    return res.status(403).render("error", {
      title: "Access Denied",
      message: "Incorrect admin password. The action was not performed.",
      statusCode: 403,
    });
  }

  next();
}

module.exports = { verifyAdminPassword, requireAdminPassword };
