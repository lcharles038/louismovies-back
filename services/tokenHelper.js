const jwt = require('jsonwebtoken');
const { token } = require("morgan");
const TokenHelper = () => { };

TokenHelper.createTokens = (email, longExpiry, refreshExpiresInSeconds, bearerExpiresInSeconds) => {
    const maxAccessTokenTtl = longExpiry ? process.env.ACCESS_TOKEN_LONG_TTL : process.env.ACCESS_TOKEN_TTL;
    const accessTokenTtl = (bearerExpiresInSeconds && bearerExpiresInSeconds < maxAccessTokenTtl) ? bearerExpiresInSeconds : maxAccessTokenTtl;
    const refreshTokenTtl = (refreshExpiresInSeconds && refreshExpiresInSeconds <  process.env.REFRESH_TOKEN_TTL) ? refreshExpiresInSeconds :  process.env.REFRESH_TOKEN_TTL;
    const accessToken = jwt.sign(
        { email: email },
        process.env.JWT_TOKEN_SECRET,
        { expiresIn: `${accessTokenTtl}s` }
    );

    const refreshToken = jwt.sign(
        { email: email },
        process.env.JWT_TOKEN_SECRET,
        { expiresIn: `${refreshTokenTtl}s` }
    );

    return {
        bearerToken: {
            token: accessToken,
            "token_type": "Bearer",
            expires_in: parseInt(accessTokenTtl)
        },
        refreshToken: {
            token: refreshToken,
            "token_type": "Refresh",
            expires_in: parseInt(refreshTokenTtl)
        }
    }
}

TokenHelper.validateToken = (authHeader) => {
    if (!authHeader.match(/^Bearer /)) {
        err = new Error('no bearer token')
        err.name = 'noBearerToken'
        throw err
    } else {
        try {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET)
            return decoded;
        }
        catch (err) {
            throw err
        }
    }
}

TokenHelper.validateRefreshToken = (refreshToken) => {
    if (!refreshToken) {
        err = new Error('no refresh token');
        err.name = "noRefreshToken";
        throw err
    }
    else {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_TOKEN_SECRET)
            return decoded;
        }
        catch (err) {
            throw err
        }
    }

}

module.exports = TokenHelper;