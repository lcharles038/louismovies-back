const options = require("../knexfile");
const knex = require('knex')(options);
const tokenHelper = require("./tokenHelper")
const bcrypt = require('bcrypt')
const dateFormat = require('date-format');

const UserService = () => { };

UserService.register = (email, password) => {
    // controller checked that the three parameters are defined
    return new Promise((resolve, reject) => {
        knex.from('users').select('email')
            .whereRaw('LOWER(email)=?', [email.toLowerCase()])
            .then(rows => {
                if (rows.length > 0) {
                    reject({ name: 'conflict', message: "User already exists" })
                }
                else {
                    const pwdHash = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_SALTROUNDS));
                    knex.insert(
                        { email: email, hash: pwdHash }
                    )
                        .into('users')
                        .then(row => {
                            if (row > 0) {
                                resolve({ id: row })
                            }
                            else {
                                reject({ name: "internal", message: "Internal Server Error while creating user" })
                            }
                        })
                }
            })
            .catch((err) => {
                reject(err)
            });
    })

}

UserService.login = (email, password, longExpiry, refreshExpiresInSeconds, bearerExpiresInSeconds) => {
    return new Promise((resolve, reject) => {
        knex.from('users').select('email', 'hash')
            .whereRaw('LOWER(email)=?', [email.toLowerCase()])
            .then(rows => {
                if (rows.length === 0) {
                    reject({ name: 'unauthorized', message: "Incorrect email or password" })
                }
                else {
                    const user = rows[0];
                    bcrypt.compare(password, user.hash, (err, match) => {
                        if (!match) {
                            reject({ name: "unauthorized", message: "Incorrect email or password" })
                        }
                        else {
                            const tokens = tokenHelper.createTokens(
                                email, longExpiry, refreshExpiresInSeconds, bearerExpiresInSeconds);
                            knex('users')
                                .whereRaw('LOWER(email)=?', [email.toLowerCase()])
                                .update({ 'refreshToken': tokens.refreshToken.token })
                                .then(rows => {
                                    resolve(tokens);
                                })
                        }
                    }
                    )

                }
            }
            )
            .catch(err => {
                reject(err)
            })
    }
    )
}


UserService.refresh = (refreshToken) => {
    return new Promise((resolve, reject) => {
        const decodedToken = tokenHelper.validateRefreshToken(refreshToken);
        const email = decodedToken.email;
        knex.from('users').select('email', 'refreshToken')
            .whereRaw('LOWER(email)=?', [email.toLowerCase()])
            .then(rows => {
                if (rows.length === 0) {
                    reject({ name: 'not_found', message: "User not found." })
                }
                else {
                    const user = rows[0];
                    const previousRefreshToken = user.refreshToken;
                    if (refreshToken === previousRefreshToken) {
                        const tokens = tokenHelper.createTokens(email, false);
                        knex('users')
                            .whereRaw('LOWER(email)=?', [email.toLowerCase()])
                            .update({ 'refreshToken': tokens.refreshToken.token })
                            .then(rows => {
                                resolve(tokens);
                            })
                    }
                    else {
                        reject({ name: 'TokenExpiredError' })
                    }
                }

            })
            .catch(err => {
                reject(err)
            })
    }
    )
}


UserService.logout = (refreshToken) => {
    return new Promise((resolve, reject) => {
        const decodedToken = tokenHelper.validateRefreshToken(refreshToken);
        const email = decodedToken.email;
        knex.from('users').select('email', 'refreshToken')
            .whereRaw('LOWER(email)=?', [email.toLowerCase()])
            .then(rows => {
                if (rows.length === 0) {
                    reject({ name: 'no email found', message: "Error in retrieving email from refreshToken" })
                }
                else {
                    const user = rows[0];
                    const previousRefreshToken = user.refreshToken;
                    if (refreshToken === previousRefreshToken) {
                        knex('users')
                            .whereRaw('LOWER(email)=?', [email.toLowerCase()])
                            .update({ 'refreshToken': null })
                            .then(rows => {
                                resolve({ error: false, message: "Token successfully invalidated" });
                            })
                    }
                    else {
                        reject({ name: 'TokenExpiredError' })
                    }
                }

            })
            .catch(err => {
                reject(err)
            })
    }
    )
}



UserService.getProfile = (email, userAuthenticated) => {
    // userAuthenticated contains authenticated user email or null if no auth
    return new Promise((resolve, reject) => {
        knex.from('users')
            .select('email', 'name', 'firstName', 'dob', 'address')
            .whereRaw('LOWER(email)=?', [email.toLowerCase()])
            .then(rows => {
                if (rows.length === 0) {
                    reject({ name: 'not_found', message: "User not found" });
                }
                else {
                    const user = rows[0];
                    let profile = {
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.name
                    }
                    if (userAuthenticated) {
                        profile = {
                            ...profile,
                            dob: user.dob ? dateFormat('yyyy-MM-dd',user.dob) : null,
                            address: user.address
                        }
                    }
                    resolve(profile);

                }
            }
            )
            .catch(err => {
                reject(err)
            });
    })
}



UserService.putProfile = (connectedEmail, email, firstName, lastName, dob, address) => {
    return new Promise((resolve, reject) => {
        if (new Date(dob) > new Date()) {
            reject({name : "invalid_input", message:"Invalid input: dob must be a date in the past."})
        }
        knex.from('users')
            .select('email', 'name', 'firstName', 'dob', 'address')
            .whereRaw('LOWER(email)=?', [email.toLowerCase()])
            .then(rows => {
                if (rows.length === 0) {
                    reject({ name: 'not_found', message: "User not found" });
                }
                else {
                    if (connectedEmail !== email) {
                        reject({ name: 'forbidden', message: 'Forbidden.' })
                    }
                    else {
                        const user = rows[0];
                        knex('users')
                            .whereRaw('LOWER(email)=?', [email.toLowerCase()])
                            .update({ 'firstName': firstName, 'name': lastName, 'dob': dob, 'address': address })
                            .then(rows => {
                                let profile = {
                                    email: email,
                                    firstName: firstName,
                                    lastName: lastName,
                                    dob: dob,
                                    address: address
                                };
                                resolve(profile)
                            });

                    }


                }
            }
            )
            .catch(err => {
                reject(err)
            });

    }
    )
}


module.exports = UserService;