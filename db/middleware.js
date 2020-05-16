let jwt = require('jsonwebtoken');
const config = require('../key');


let checkToken = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
    if (token && token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length);
    }

    if (token) {
        jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Token is not valid'
                });
            } else {
                req.decoded = decoded;
                next();
                const data = jwt.verify(token, config.secret);
            }
        });
    } else {
        return res.json({
            success: false,
            message: 'Auth token is not supplied'
        });
    }
};

let checkEmailandToken = (id, token) => {
    const data = jwt.verify(token, config.secret);
    if (data.id === id) {
        return true;
    } else {
        return false;
    }
}

module.exports = {
    checkToken: checkToken,
    checkEmailandToken: checkEmailandToken
}