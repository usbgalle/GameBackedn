const express = require('express');
const router = express.Router();
const db = require('../../db');
const middleware = require('../../db/middleware');

router.get('/', async (req, res, next) => {
    res.send('hello there :D');
    res.end();
})


router.post('/start', middleware.checkToken, async (request, response) => {
    var id = request.body.id;
    var game_type = request.body.game_type;
    if (id && game_type) {
        try {
            let results = await db.startGame(id, game_type);
            if (results['success']) {
                response.json({
                    success: true,
                    message: results['message'],
                    game_url: results['game_url'],
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
            message: "incomplete request"
        });
    }

});

router.post('/details', middleware.checkToken, async (request, response) => {
    var game_url = request.body.game_url;
    var email = request.body.email;
    
    if (game_url && email) {
        try {
            // console.log(middleware.checkEmailandToken(email,token));

            let results = await db.startGame(email, game_type);
            if (results['success']) {
                response.json({
                    success: true,
                    message: results['message'],
                    game_url: results['game_url'],
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
            message: "incomplete request"
        });
    }

});

router.post('/joingame', middleware.checkToken, async (request, response) => {
    var game_url = request.body.game_url;
    var id = request.body.id;
    
    if (game_url && id) {
        try {
            let results = await db.joinGame(id, game_url);
            if (results['success']) {
                response.json({
                    success: true,
                    message: results['message'],
                    cause:  results['cause'],
                    owner: results['owner'],
                    isStarted: results['isStarted']
                });

            } else {
                response.json({
                    success: false,
                    message: results['message'],
                    cause:  results['cause']
                    
                });
            }
        } catch {
            response.sendStatus(500);
        }
    } else {
        response.json({
            success: false,
            cause:  'request_incomplete',
            message: "incomplete request"
        });
    }

});

router.get('/get_songs', async (request, response) => {
        try {
            let results = await db.getSongs();
            if (results['success']) {
                response.json({
                    success: true,
                    results: results['songs'],
                });

            } else {
                response.json({
                    success: false,
                    message: results['message'],                    
                });
            }
        } catch {
            response.sendStatus(500);
        }
});

router.post('/select_song', middleware.checkToken, async (request, response) => {
    var song_id = request.body.song_id;
    var game_url = request.body.game_url;
    if (song_id && game_url) {
        try {
            let results = await db.selectSong(song_id, game_url);
            if (results['success']) {
                response.json({
                    success: true,
                    message: results['message'],
                });

            } else {
                response.json({
                    success: false,            
                });
            }
        } catch {
            response.sendStatus(500);
        }
    } else {
        response.json({
            success: false,
            cause:  'request_incomplete',
            message: "incomplete request"
        });
    }

});

router.post('/get_messages', async (request, response) => {
    var game_url = request.body.game_url;
    try {
        let results = await db.getMessages(game_url);
        if (results['success']) {
            console.log(results['messages'])
            response.json({
                success: true,
                results: results['messages'],
            });

        } else {
            response.json({
                success: false,      
            });
        }
    } catch {
        response.sendStatus(500);
    }
});


module.exports = router;