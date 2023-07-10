const options = require("../knexfile");
const knex = require('knex')(options);

const MovieService = () => { };

MovieService.search = (title, year, page = 1) => {
    return new Promise((resolve, reject) => {
        const model = knex.from('basics')
            .modify((queryBuilder) => {
                if (title) queryBuilder.whereILike('primaryTitle', `%${title}%`);
                if (year) queryBuilder.where('year', year);
            })
        let totalCount = 0;
        model.clone()
            .count('id as cnt')
            .then(c => {
                totalCount = c[0].cnt;
                return model.clone()
                    .select('primaryTitle as title', 'year', 'tconst as imdbID', 'imdbRating', 'rottenTomatoesRating', 'metacriticRating', 'rated as classification')
                    .orderBy('imdbID')
                    .modify((queryBuilder) => {
                        const offset = (page - 1) * 100;
                        queryBuilder.offset(offset);
                    })
                    .limit(100)
            })
            .then((rows) => {
                const iPage = parseInt(page);
                const nbRows = rows.length;
                const lastPage = totalCount>0 ? Math.floor(totalCount / 100) + 1 : 0
                resolve({
                    "data": rows, "pagination": {
                        "total": totalCount,
                        "lastPage": lastPage,
                        "prevPage" : iPage === 1 ? null : iPage - 1,
                        "nextPage" : iPage >= lastPage ? null : iPage + 1,
                        "perPage": 100,
                        "currentPage": iPage,
                        "from": totalCount > 0 ? (iPage- 1) * 100 + 1 : 0,
                        "to": totalCount > 0 ? (iPage- 1) * 100 + (nbRows > 0 ? nbRows : 1)  : 0  //- 1
                    }
                })
            })
            .catch((err) => {
                reject(err)
            });
    })
}

MovieService.findById = (id) => {
    return new Promise((resolve, reject) => {
        knex.from('basics').select(
            'primaryTitle as title', 'year', 'runtimeMinutes as runtime', 'genres', 'country', 'imdbRating', 'rottentomatoesRating',
            'metacriticRating', 'boxoffice', 'poster', 'plot')
            .where('basics.tconst', '=', id)
            .then(row => {
                if (row.length > 0) {
                    const movie = row[0];
                    knex.from('principals')
                        .select('nconst as id', 'category', 'name', 'characters')
                        .where('tconst', id)
                        .then(principals => {
                            const pr = principals.map(p => {
                                return {
                                    "id": p.id,
                                    "category": p.category,
                                    "name": p.name,
                                    "characters": p.characters.length > 0 ? p.characters.substring(1, p.characters.length - 1)
                                        .replace(/"/g, '').split(",") : []
                                }
                            })

                            const ratings = [];
                            if (movie.imdbRating) ratings.push({
                                source: "Internet Movie Database",
                                value: movie.imdbRating
                            })
                            if (movie.rottentomatoesRating) ratings.push({
                                source: "Rotten Tomatoes",
                                value: movie.rottentomatoesRating
                            })
                            if (movie.metacriticRating) ratings.push({
                                source: "Metacritic",
                                value: movie.metacriticRating
                            })

                            resolve(
                                {
                                    "title": movie.title,
                                    "year": movie.year,
                                    "runtime": movie.runtime,
                                    "genres": movie.genres.split(','),
                                    "country": movie.country,
                                    "principals": pr,
                                    "ratings": ratings,
                                    "boxoffice": movie.boxoffice,
                                    "poster": movie.poster,
                                    "plot": movie.plot
                                });

                        })
                }
                else {
                    reject({ name: "not_found", message: "No record exists of a movie with this ID" });
                }
            }
            )
            .catch((err) => {
                reject(err);
            });
    })
}

module.exports = MovieService