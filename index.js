const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
var bodyParser = require('body-parser');
const middleware = require('./db/middleware');
var cors = require('cors');
app.use(cors());
// Rutes
const AuthRuter = require('./routes/auth')
const gameRouter = require('./routes/game')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const db = require('./db');

//  Save the users 
const users = {};
const usernames = { users: {} };
// Chat rooms
const rooms = {};

app.get('/', (req, res) => {
  res.send('<h1>Hey Socket.io</h1>');
});
io.on('connection', (socket) => {
  // run every time user connects
  console.log('a user connected');
  // user disconnected
  socket.on('disconnect', () => {
    console.log('user disconnected');
    // get the user room
    getUserRooms(socket)
      .forEach(room => {
        delete rooms[room].users[socket.id];
        delete usernames[room].users[socket.id];
        socket.to(room).broadcast.emit('user-connected',  usernames[room]);
        // if want to broadcast it should be also here.
      });
  });


  function getUserRooms(socket) {
    return Object.entries(rooms).reduce((names, [name, room]) => {
      if (room.users[socket.id] != null) {
        names.push(name);
      }
      return names;
    }, [])
  }

  // When Catch an event with  'layout'
  socket.on('layout', (msg) => {
    // send message to socket users

    // 1st way send to all clients
    // io.emit('layoutBroadCast', `${msg}`);

    // 2nd way send to clients expect sender
    socket.broadcast.emit('layoutBroadCast', `${users[socket.id]} -  ${msg}`);
  });

  // When new user entered
  socket.on('newUser', (id, username, room) => {
    if (rooms[room]) {
      rooms[room].users[socket.id] = id;
      usernames[room].users[socket.id] = username ;
      // add users to the room
      socket.join(room);
      const players = [];
      // Broadcast to other users in the room that user is connected
      socket.to(room).broadcast.emit('user-connected',  usernames[room]);
    }


  });
  // game started
  socket.on('startTheGame', async (room) => {
    // send message to socket users
    try { 
      let results = await db.startPlayingGame(room);
      if (results) {
        io.to(room).emit('gameStarted', `started`);
      }
    } catch {
      io.to(room).emit('gameStarted', `error`);
    }
    
  });

   // select song
   socket.on('select_song', async (song_id,game_url) => {
    // send message to socket users
    try { 
      let results = await db.selectSong(song_id, game_url);
      if (results['success']) {
        io.to(game_url).emit('get_user_state', true);
      }
    } catch {
      io.to(game_url).emit('get_user_state', false);
    }
    
  });

  // ask questions
  socket.on('sendQuestion', async (sender_id, question, game_url) => {
    // send message to socket users
    try { 
      let results = await db.saveMessage(sender_id, question, game_url);
      if (results['success']) {
        io.to(game_url).emit('refresh_messages', true);
      }
    } catch {
      io.to(game_url).emit('refresh_messages', false);
    }
    
  });

});

app.get('/index', middleware.checkToken, (req, res) => {
  res.send('Hello there !');
  res.end();
});

app.post('/subscriptions/createGame', (req, res) => {
  rooms[req.body.room] = { users: {} };
  usernames[req.body.room] = { users: {} };
  res.json({
    success: true,
  });

})

app.use('/auth', AuthRuter);
app.use('/game', gameRouter);

http.listen(3000, () => {
  console.log('listening on *:3000');
});