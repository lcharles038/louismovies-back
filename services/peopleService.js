const options = require("../knexfile");
const knex = require('knex')(options);

const PeopleService = () => { };

PeopleService.findById = (id) => {
    return new Promise((resolve, reject) => {
        knex.from('names').select(
            'names.primaryName as name', 'names.birthYear as birthYear', 'names.deathYear as deathYear')
            .where('names.nconst', id)
            .then(row => {
                if (row.length > 0) {
                    const person = row[0];
                    knex.from('principals')
                        .select('principals.category as category', 'principals.characters as characters',
                            'basics.primaryTitle as movieName', 'basics.tconst as movieId', 'basics.imdbRating as imdbRating')
                        .leftOuterJoin('basics', 'principals.tconst', 'basics.tconst')
                        .where('principals.nconst', id)
                        .then(roles => {
                            const r = roles.map(role => {
                                return {
                                    "movieName": role.movieName,
                                    "movieId": role.movieId,
                                    "category": role.category,
                                    "characters": role.characters.length > 0 ? role.characters.substring(1, role.characters.length - 1)
                                        .replace(/"/g, '').split(",") : [],
                                    "imdbRating": parseFloat(role.imdbRating)
                                }
                            })

                            resolve(
                                {
                                    "name": person.name,
                                    "birthYear": person.birthYear,
                                    "deathYear": person.deathYear,
                                    "roles": r
                                });

                        })
                }
                else {
                    reject({ name: "not_found", message: "No record exists of a person with this ID" });
                }
            }
            )
            .catch((err) => {
                reject(err);
            });
    })
}

module.exports = PeopleService