module.exports = app => {
  const bearerTokenInterceptor = require('../middleware/bearerTokenInterceptor');
  const usersController = require('../controllers/users.controller');
  let router = require("express").Router();

  router.post("/register", usersController.register);
  router.post("/login", usersController.login);
  router.post("/refresh", usersController.refresh);
  router.post("/logout", usersController.logout);

  // Secured urls
  router.get("/:email/profile", bearerTokenInterceptor.interceptOptional, usersController.profile);
  router.put("/:email/profile", bearerTokenInterceptor.intercept, usersController.putProfile);

  app.use('/user', router);
}
