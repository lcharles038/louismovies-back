const peopleService = require('../services/peopleService');

exports.findById = (req, res) => {
    if (Object.keys(req.query).length !== 0) {
        const param = Object.keys(req.query)[0];
        res.status(400).send({
            error: true,
            message: `Invalid query parameters: ${param}. Query parameters are not permitted.`
        })
    } else {
        const id = req.params.id;
        peopleService.findById(id).then(person => {
            res.status(200).send(person);
        })
            .catch(err => {
                if (err.name === "not_found") {
                    res.status(404).send({
                        error: true,
                        message: "No record exists of a person with this ID"
                    })
                }
                else {
                    res.status(500).send({
                        error: true,
                        message: err.message || "Some error occurred while retrieving person."
                    })
                }
            })
    }

}

