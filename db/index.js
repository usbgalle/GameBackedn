const mysql = require('mysql');
bcrypt = require('bcrypt');
const config = require('../key');
let jwt = require('jsonwebtoken');
const saltRounds = 10;

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gamedb'
});

let GameDb = {};

////////////////////////////////// LOGIN SERVICES ///////////////////////////////////////////////////////
GameDb.userLogin = (email, password) => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM accounts WHERE email = ?', [email], (err, results, fields) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            if (results.length > 0) {
                var resultJson = JSON.parse(JSON.stringify(results[0]));
                bcrypt.compare(password, resultJson['password'], function (err, result) {
                    if (result === true) {
                        return resolve({ login_sucess: true, message: 'login successful', username: resultJson['username'], user_state: resultJson['user_state'], id: resultJson['id'] });
                    } else {
                        return resolve({ login_sucess: false, message: 'password does not match' });
                    }

                });
            } else {
                return resolve({ login_sucess: false, message: 'username invalid' });
            }

        })
    })
};

GameDb.signUp = (username, password, email) => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM accounts WHERE email = ?', [email], (err, results, fields) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            if (results.length > 0) {
                return resolve({ success: false, message: 'email ready exisits' });
            } else {
                bcrypt.hash(password, saltRounds, function (err, hash) {
                    connection.query('INSERT INTO accounts(username, password,email,user_state) VALUES (?,?,?,?)', [username, hash, email, 'INITIAL'],
                        (err, results, fields) => {
                            if (err) {
                                console.log(err);
                                return reject(err);
                            }
                            connection.query('SELECT * FROM accounts WHERE email = ?', [email], (err, results, fields) => {
                                if (err) {
                                    console.log(err);
                                    return reject(err);
                                }
                                var resultJson = JSON.parse(JSON.stringify(results[0]));
                                return resolve({ success: true, message: 'account created', id: resultJson['id'] });
                            });

                        });
                });
            }
        });

    });
}
GameDb.userValidate = (id, token) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM accounts WHERE id = ${id}`, (err, results, fields) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            if (results.length > 0) {
                const data = jwt.verify(token, config.secret);
                var resultJson = JSON.parse(JSON.stringify(results[0]));
                if (data.id === id) {
                    return resolve({ success: true, message: "successfull", username: resultJson['username'], email: resultJson['email'], user_state: resultJson['user_state'], id: resultJson['id'] });
                } else {
                    return resolve({ success: false, message: "token does not match" });
                }
            } else {
                return resolve({ success: false, message: "user does not exists" });
            }
        });
    });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// /                                GAME SERVICES                                       //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
GameDb.startGame = (id, game_type) => { // create game
    return new Promise((resolve, reject) => {
        const gameUrl = makeGameCode();
        // check whether is an exisiting game url
        connection.query(`SELECT * FROM games WHERE game_url = '${gameUrl}'`, (err, results, fields) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            if (results.length > 0) {
                return GameDb.startGame(id, game_type);
            } else {
                // insert to game tabele
                connection.query('INSERT INTO games(game_type, players, game_url, game_owner, remaining_rounds, current_player,asking_player) VALUES (?,?,?,?,?,?,?)',
                    [game_type, id, gameUrl, id, 50, id, id],
                    (err, results, fields) => {
                        if (err) {
                            console.log(err);
                            return reject(err);
                        }
                        // edit accounts table
                        connection.query(`UPDATE accounts SET user_state = 'START_GAME', game_url = '${gameUrl}' WHERE id = '${id}'`,
                            (err, results, fields) => {
                                if (err) {
                                    console.log(err);
                                    return reject(err);
                                }
                                return resolve({ success: true, message: 'game created', game_url: gameUrl });
                            });
                    });
            }
        });

    });
}


GameDb.joinGame = (id, game_url) => {
    return new Promise((resolve, reject) => {
        // check whether is an exisiting game url
        connection.query(`SELECT * FROM games WHERE game_url = '${game_url}'`, (err, results, fields) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            if (results.length > 0) {
                var resultJson = JSON.parse(JSON.stringify(results[0]));
                var playerList = resultJson['players'];
                var playerListArray = playerList.split(',');
                var idFound = false;
                playerListArray.forEach(element => {
                    if (element.toString() === id.toString()) {
                        idFound = true;
                        return resolve({ success: true, cause: 'already_in_game', message: 'you are already in the game', owner: resultJson['game_owner'], isStarted: resultJson['is_started'] });
                    }
                });
                if (!idFound) {
                    var playerList = resultJson['players'] + ',' + id;
                    if (resultJson['is_started'] === 0) {
                        connection.query(`UPDATE games SET players = '${playerList}' WHERE game_url = '${game_url}'`,
                            (err, results, fields) => {
                                if (err) {
                                    console.log(err);
                                    return reject(err);
                                }
                                connection.query(`UPDATE accounts SET user_state = 'JOIN_GAME', game_url = '${game_url}' WHERE id = '${id}'`,
                                    (err, results, fields) => {
                                        if (err) {
                                            console.log(err);
                                            return reject(err);
                                        }
                                        return resolve({ success: true, cause: 'successfull', message: 'game_joined', owner: resultJson['game_owner'], isStarted: resultJson['is_started'] });
                                    });
                            });
                    } else {
                        return resolve({ success: false, cause: 'already_started', message: 'game already started' });
                    }
                }
            } else {
                return resolve({ success: false, cause: 'invalid_url', message: 'invalid game url' });
            }
        });

    });
}


makeGameCode = () => {
    var result = '';
    var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 10; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Game
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
GameDb.startPlayingGame = (game_url) => {
    return new Promise((resolve, reject) => {
        // check whether is an exisiting game url
        connection.query(`UPDATE games SET is_started = 1 WHERE game_url = '${game_url}'`, (err, results, fields) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            connection.query(`UPDATE accounts SET user_state = 'SELECT_OPTION' WHERE game_url = '${game_url}'`, (err, results, fields) => {
                if (err) {
                    console.log(err);
                    return reject(err);
                }
                // update the players
                return resolve({ success: true, cause: 'updated' });
            });
        });

    });
}


GameDb.gameData = (game_url) => {
    return new Promise((resolve, reject) => {
        // check whether is an exisiting game url
        connection.query(`UPDATE games SET is_started = 1 WHERE game_url = '${game_url}'`, (err, results, fields) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            connection.query(`UPDATE accounts SET user_state = 'SELECT_OPTION' WHERE game_url = '${game_url}'`, (err, results, fields) => {
                if (err) {
                    console.log(err);
                    return reject(err);
                }
                // update the players
                return resolve({ success: true, cause: 'updated', asking_player: '5146', score: 11, time_statred: '8512156', selected_option: '156' });
            });
        });

    });
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Songs
////////////////////////////////////////////////////////////////////////////////////////////////////////

GameDb.getSongs = () => {
    return new Promise((resolve, reject) => {
        // check whether is an exisiting game url
        connection.query(`SELECT * FROM songs`, (err, results, fields) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            // update the players
            if (results.length > 0) {
                return resolve({ success: true, songs: results });
            }
            else {
                return resolve({ success: false, message: 'error occured' });
            }
        });

    });
}

GameDb.selectSong = (song_id, game_url) => {
    return new Promise((resolve, reject) => {
        // check whether is an exisiting game url
        connection.query(`UPDATE games SET selected_value = ${song_id} WHERE game_url = '${game_url}'`, (err, results, fields) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            connection.query(`UPDATE accounts SET user_state = 'PLAYING' WHERE game_url = '${game_url}'`, (err, results, fields) => {
                if (err) {
                    console.log(err);
                    return reject(err);
                }
                // update the players
                return resolve({ success: true, message: 'updated' });
            });

        });

    });
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Messages
////////////////////////////////////////////////////////////////////////////////////////////////////////

GameDb.saveMessage = (sender, message, game_url) => {
    return new Promise((resolve, reject) => {
        // check whether is an exisiting game url
        connection.query('INSERT INTO messages(user, body, game_url, answer) VALUES (?,?,?,?)', [sender, message, game_url, 'PENDING'], (err, results, fields) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            return resolve({ success: true, message: 'updated' });
        });

    });
}
// to be implemented
GameDb.getMessages = ( game_url) => {
    return new Promise((resolve, reject) => {
        // check whether is an exisiting game url
        connection.query(`SELECT * FROM messages WHERE game_url = '${game_url}'`, (err, results, fields) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            return resolve({ success: true, message: 'sucessful', messages: results });
        });

    });
}




////////////////////////////////////////////////////////////////////////////////////////////////////////////


module.exports = GameDb;