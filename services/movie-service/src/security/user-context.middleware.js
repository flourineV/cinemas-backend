function userContextMiddleware(req, res, next) {
  const userId = req.header("X-User-Id");
  const role = req.header("X-User-Role");
  const authenticatedHeader = req.header("X-Authenticated");

  const authenticated =
    typeof authenticatedHeader === "string" &&
    authenticatedHeader.toLowerCase() === "true";

  req.userContext = {
    userId: userId || null,
    role: role || null,
    authenticated,
  };

  console.log(
    `[Auth] Request from user=${userId || "-"}, role=${
      role || "-"
    }, authenticated=${authenticated}`
  );

  next();
}

module.exports = { userContextMiddleware };
