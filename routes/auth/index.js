const express = require('express');
const router = express.Router();
const db = require('../../db');
const config = require('../../key');
let jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');

router.get('/', async (req, res, next) => {
    res.send('hello there :D');
    res.end();
})

// Sign up
router.post('/login', async (request, response) => {
    var email = request.body.email;
    var password = request.body.password;
    if (email && password) {
        try {
            let results = await db.userLogin(email, password);
            if (results['login_sucess']) {
                // create json web token
                let token = jwt.sign({ id:  results['id'] },
                    config.secret,
                    {
                        expiresIn: '24h'
                    }
                );
                response.json({
                    success: true,
                    message: 'Authentication successful!',
                    token: token,
                    email: email,
                    username: results['username'],
                    user_state:  results['user_state'],
                    id:  results['id']
                });
            }
            else {
                response.json({
                    success: false,
                    message: 'Incorrect Username and/or Password',
                });
            }
        }
        catch {
            response.sendStatus(500);
        }
    }
    else {
        response.json({
            success: false,
            message: 'Please enter Username and Password!',
        });
    }
});

router.post('/signup', async (request, response) => {
    var username = request.body.username;
    var password = request.body.password;
    var email = request.body.email;
    if (username && password && email) {
        try {
            let results = await db.signUp(username, password, email);
            if (results['success']) {
                // create json web token
                let token = jwt.sign({ id: results['id'] },
                    config.secret,
                    {
                        expiresIn: '24000h'
                    }
                );
                response.json({
                    success: true,
                    message: results['message'],
                    token: token,
                    email: email,
                    username: username,
                    user_state: 'INITIAL',
                    id:  results['id']
                });

            } else {
                response.json({
                    success: false,
                    message: results['message']
                });
            }
        } catch {
            response.sendStatus(500);
        }
    } else {
        response.json({
            success: false,
            message: "Please fill alll feilds"
        });
    }

});

router.post('/validate', async (request, response) => {
    var id = request.body.id;
    var token = request.body.token;
    if (id && token) {
        try {
            let results = await db.userValidate(id, token);
            if (results['success']) {
                let token = jwt.sign({ id:  results['id'] },
                    config.secret,
                    {
                        expiresIn: '24000h'
                    }
                );
                response.json({
                    success: true,
                    message: results['message'],
                    token: token,
                    email:  results['email'],
                    username: results['username'],
                    user_state:  results['user_state'],
                    id:  results['id']
                });
            }
            else {
                response.json({
                    success: false,
                    message: results['message']
                });
            }
        }

        catch {
            // console.log(response._destroyY);
            response.sendStatus(500);
        }

    } else {
        response.json({
            success: false,
            message: "Please fill alll feilds"
        });
    }
});

// To get user without token
router.post('/get-player-data', async (request, response) => {
    var id = request.body.id;
    var token = request.body.token;
    if (id && token) {
        try {
            let results = await db.userValidate(id, token);
            if (results['success']) {
                response.json({
                    success: true,
                    message: results['message'],
                    email:  results['email'],
                    username: results['username'],
                    user_state:  results['user_state'],
                    id:  results['id']
                });
            }
            else {
                response.json({
                    success: false,
                    message: results['message']
                });
            }
        }

        catch {
            // console.log(response._destroyY);
            response.sendStatus(500);
        }

    } else {
        response.json({
            success: false,
            message: "Please fill alll feilds"
        });
    }
});


module.exports = router;