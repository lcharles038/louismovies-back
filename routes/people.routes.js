module.exports = app => {
    const bearerTokenInterceptor = require('../middleware/bearerTokenInterceptor');
    const peopleController = require('../controllers/people.controller');
    let router = require("express").Router();

    // Secured urls
    router.get("/:id", bearerTokenInterceptor.intercept, peopleController.findById);

    app.use('/people', router);
}