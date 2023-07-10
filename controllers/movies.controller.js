const moviesService = require('../services/moviesService');

exports.search = (req, res) => {
    const title = req.query.title;
    const year = req.query.year;
    const page = req.query.page;
    const yearRegex = /^[0-9]{4}$/;
    if (year && !yearRegex.test(year)) {
        res.status(400).send({
            error: true,
            message: "Invalid year format. Format must be yyyy."
        })
    } else {
        if (page && isNaN(page)) {
            res.status(400).send({
                error: true,
                message: "Invalid page format. page must be a number."
            })
        }
        else
        {
            moviesService.search(title, year, page).then(
                movies => res.status(200).send(movies)
            )
                .catch(err => {
                    res.status(500).send({
                        error: true,
                        message:
                            err.message || "Some error occurred while retrieving movies."
                    });
                })
        }
    }
}

exports.findById = (req, res) => {
    if (JSON.stringify(req.query) !== "{}") {
        const param = req.query[0];
        res.status(400).send({
            error: true,
            message: `Invalid query parameters: ${param}. Query parameters are not permitted.`
        })
    } else {
        const id = req.params.id;
        moviesService.findById(id).then(movie => {
            res.status(200).send(movie);
        })
            .catch(err => {
                if (err.name === "not_found") {
                    res.status(404).send({
                        error: true,
                        message: "No record exists of a movie with this ID"
                    })
                }
                else {
                    res.status(500).send({
                        error: true,
                        message: err.message || "Some error occurred while retrieving movie."
                    })
                }
            })
    }

}



// router.get("/movies/search", function (req, res, next) {
//     req.db.from('basics').select('primaryTitle', 'year', 'id', 'imdbRating', 'rottentomatoesRating', 'metacriticRating', 'rated').where('primaryTitle', '=', req.query.title)
//       .then((rows) => {
//         res.json({ "Error": false, "Message": "Success", "Movies": rows })
//       })
//       .catch((err) => {
//         console.log(err);
//         res.json({ "Error": true, "Message": "Error executing MySQL query" })
//       })
//   });