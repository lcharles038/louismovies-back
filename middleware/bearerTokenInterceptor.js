const tokenHelper = require('../services/tokenHelper')

const BearerTokenInterceptor = () => { }

const doIntercept = (req, res, next, optional) => {
    if (!("authorization" in req.headers)) {
        if (!optional) {
            res.status(401).json({ error: true, message: "Authorization header ('Bearer token') not found" });
            return
        }
        next();
    }
    else {
        const auth = req.headers.authorization;
        try {
            req.accessToken = tokenHelper.validateToken(auth);
            next()
        }
        catch (err) {
            switch (err.name) {
                case 'noBearerToken':
                    message = "Authorization header is malformed";
                    break;
                case 'JsonWebTokenError':
                    message = "Invalid JWT token"
                    //message = err.message;
                    break;
                case 'TokenExpiredError':
                    message = "JWT token has expired";
                    break;
                default:
                    message = err.message;
            }
            res.status(401).send({
                error: true,
                message: message
            })
        }
    }
}



BearerTokenInterceptor.intercept = (req, res, next) => doIntercept(req, res, next, false);
BearerTokenInterceptor.interceptOptional = (req, res, next) => doIntercept(req, res, next, true);

module.exports = BearerTokenInterceptor