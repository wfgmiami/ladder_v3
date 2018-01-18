'use strict';

const server = require('http').createServer();

const createApplication = () => {

	const app = require('./app');
	server.on("request", app);
	const socketio = require('socket.io');
	const io = socketio(server);

	let messages = {};
	let room;
	let clientIP;

	io.on( 'connection', (socket) => {
		clientIP = socket.handshake.address.substring(7);
		setInterval( () => {
			socket.emit('sendData');
		},1000)
		socket.emit('ip', clientIP);

		socket.on('joinRoom', (roomName) => {
			room = roomName;
			socket.join(roomName);
			if( !messages[roomName] ) messages[roomName] = [];
			else socket.emit('messageHistory', messages[roomName]);
		})

		socket.on('message',( msgs ) => {

			messages[room].push( msgs );
			socket.broadcast.emit('message', msgs );
		})

		socket.on('disconnect', () => {
			console.log('Client has disconnected');
		})

	})
}

const startServer = () => {
	const PORT = process.env.PORT || 3000;

	server.listen( PORT, () => {
		console.log( `server listening on port ${ PORT }`);
	})
}


createApplication()
startServer()





