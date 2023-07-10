module.exports = app => {
    const moviesController = require('../controllers/movies.controller');
    let router = require("express").Router();

    router.get("/search", moviesController.search);
    router.get("/data/:id", moviesController.findById);

    app.use('/movies', router);
}