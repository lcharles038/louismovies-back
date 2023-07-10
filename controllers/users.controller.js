const usersService = require('../services/usersService');
const dateHelper = require('../services/dateHelper')

exports.register = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
        res.status(400).send({
            error: true, message: "Request body incomplete, both email and password are required."
        })
    } else {
        usersService.register(email, password)
            .then((id) =>
                res.status(201).send({
                    message: `user created with id ${id.id[0]}`
                })
            )
            .catch(err => {
                if (err.name === 'conflict') {
                    res.status(409).send({
                        error: true, message: err.message
                    })
                }
                else {
                    if (err.name = "unauthorized") {
                        res.status(401).send(err);
                    }
                    else {
                        res.status(500).send({
                            error: true, message: err.message
                        })
                    }
                }
            }
            )
    }
}

exports.login = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const longExpiry = req.body.longExpiry;
    const refreshExpiresInSeconds = req.body.refreshExpiresInSeconds;
    const bearerExpiresInSeconds = req.body.bearerExpiresInSeconds;
    if (!email || !password) {
        res.status(400).send({
            error: true, message: "Request body incomplete, both email and password are required."
        })
    }
    else {
        usersService.login(email, password, longExpiry, refreshExpiresInSeconds, bearerExpiresInSeconds)
            .then((tokens) => {
                res.status(200).send(tokens)
            })
            .catch(err => {
                if (err.name === 'unauthorized') {
                    res.status(401).send({
                        error: true, message: err.message
                    })
                }
                else {
                    res.status(500).send({
                        error: true, message: err.message
                    })
                }
            })
    }
}


exports.refresh = (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        res.status(400).send({
            error: true, message: "Request body incomplete, refresh token required"
        })
    }
    else {
        usersService.refresh(refreshToken)
            .then((tokens) => {
                res.status(200).send(tokens)
            })
            .catch(err => {
                switch (err.name) {
                    case ('TokenExpiredError'):
                        res.status(401).send({
                            error: true, message: "JWT token has expired"
                        });
                        break;
                    case ('not_found'):
                        res.status(404).send({
                            error: true, message: "User not found"
                        });
                        break;
                    case ('JsonWebTokenError'):
                        res.status(401).send({
                            error: true, message: "Invalid JWT token"
                        })
                        break;
                    default:
                        res.status(500).send({
                            error: true, message: err.message
                        })
                }
            }
            )
    }
}


exports.logout = (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        res.status(400).send({
            error: true, message: "Request body incomplete, refresh token required"
        })
    }
    else {
        usersService.logout(refreshToken)
            .then((success) => {
                res.status(200).send(success)
            })
            .catch(err => {
                if (err.name === 'TokenExpiredError') {
                    res.status(401).send({
                        error: true, message: "JWT token has expired"
                    })
                }
                else {
                    if (err.name === 'JsonWebTokenError') {
                        res.status(401).send({
                            error: true, message: "Invalid JWT token"
                        })
                    }
                    else {
                        res.status(500).send({
                            error: true, message: err.message
                        })
                    }
                }
            })
    }
}


exports.profile = (req, res) => {
    const email = req.params.email;
    const authenticatedUser = req.accessToken ? req.accessToken.email : null;

    usersService.getProfile(email, authenticatedUser)
        .then(profile => {
            res.status(200).send(profile);
        })
        .catch(err => {
            if (err.name === 'not_found') {
                res.status(404).send({
                    error: true, message: err.message
                })
            }
            else {
                res.status(500).send({
                    error: true, message: err.message
                })
            }
        })
}

exports.putProfile = (req, res) => {
    const email = req.params.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const dob = req.body.dob;
    const address = req.body.address;
    const connectedEmail = req.accessToken.email;

    if (!firstName || !lastName || !dob || !address) {
        res.status(400).send({
            error: true, message: "Request body incomplete: firstName, lastName, dob and address are required."
        })
    }
    else {
        if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof dob !== 'string' || typeof address !== 'string') {
            res.status(400).send({
                error: true, message: "Request body invalid: firstName, lastName, dob and address must be strings only."
            })
        }
        else {
            if (!dateHelper.checkDate(dob)) {
                res.status(400).send({
                    error: true, message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
                })
            }
            else {
                usersService.putProfile(connectedEmail, email, firstName, lastName, dob, address)
                    .then(profile => {
                        res.status(200).send(profile);
                    })
                    .catch(err => {
                        switch (err.name) {
                            case 'not_found':
                                res.status(404).send({
                                    error: true, message: err.message
                                })
                                break;
                            case 'forbidden':
                                res.status(403).send({
                                    error: true, message: err.message
                                })
                                break;
                            case 'invalid_input':
                                res.status(400).send({
                                    error: true, message: err.message
                                })
                                break;
                            default:
                                res.status(500).send({
                                    error: true, message: err.message
                                })
                        }
                    }
                    )
            }
        }
    }
}