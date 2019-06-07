
const express = require('express')

const cors = require('cors')
const axios = require('axios')
const robot = require("robotjs")

// require the dispatcher module
const HttpDispatcher = require('httpdispatcher')
const dispatcher = new HttpDispatcher()

// We need a function which handles requests and send response
function handleRequest(request, response){
    try {
        // Dispatch
        dispatcher.dispatch(request, response)
    } catch(err) {
        console.log(err)
    }
}

const server = require('http').createServer(handleRequest)
const io = require('socket.io')(server)

const PORT = 5050


const STATUS = {
	CONNECTING: 'CONNECTING',
	IN_GAME: 'IN_GAME',
	READY: 'READY',
	DEAD: 'DEAD'
}


var status = STATUS.CONNECTING

//
// Sockets
//

let SOCKET_CLIENT

io.on('connection', client => {
	console.log(`Client connected`)

	SOCKET_CLIENT = client

	changeStatus(STATUS.READY)

	client.on('event', data => {
		console.log(`event = ${JSON.stringify(data)}`)

		console.log(`event = ${data.type}`)

		if (data && data.type === "left") {
			console.log('LEFT')

			robot.keyTap("a")

			client.emit('light', { type: 'left', value: true })

			setTimeout(()=> {
				client.emit('light', { type: 'left', value: false })
			}, 100)
		} else if (data && data.type === "right") {
			console.log('RIGHT')

			robot.keyTap("s")

			client.emit('light', { type: 'right', value: true })

			setTimeout(()=> {
				client.emit('light', { type: 'right', value: false })
			}, 100)
		}
	})

 	client.on('disconnect', () => {
		console.log(`Client disconnected!`)
	})
})


//
// HTTP
//

server.listen(PORT, function(){
  console.log(`listening on port ${PORT}`)
})

//

dispatcher.onGet("/", (req, res) => {
	console.log('MORDO FEFAUL')
    res.writeHead(200, {'Content-Type': 'application/jsson'})
	res.end('')
})

//

dispatcher.onGet("/ready", (req, res) => {
	changeStatus(STATUS.READY)

	res.writeHead(200, {'Content-Type': 'application/json'})
	res.end('')
})

dispatcher.onGet("/dead", (req, res) => {
	changeStatus(STATUS.DEAD)

	res.writeHead(200, {'Content-Type': 'application/json'})
	res.end('')
})

dispatcher.onGet("/in_game", (req, res) => {
	changeStatus(STATUS.IN_GAME)

	res.writeHead(200, {'Content-Type': 'application/json'})
	res.end('')
})

//

function changeStatus(newStatus) {
	status = newStatus

	if (!SOCKET_CLIENT) { return }

	switch(status) {
		case STATUS.READY:
			waitForGameLights()
		break

		case STATUS.DEAD:
			deadLights()
		break

		case STATUS.IN_GAME:
			inGameLights()
		break
	}

}


//

function waitForGameLights() {
	if (status !== STATUS.READY) { return }

	SOCKET_CLIENT.emit('light', { type: 'right', value: true })
	SOCKET_CLIENT.emit('light', { type: 'left', value: false })

	setTimeout(()=>{
		SOCKET_CLIENT.emit('light', { type: 'right', value: false })
		SOCKET_CLIENT.emit('light', { type: 'left', value: true })

		setTimeout(()=>{
			waitForGameLights()
		}, 500)
	}, 500)
}


function deadLights() {
	if (status !== STATUS.DEAD) { return }

	SOCKET_CLIENT.emit('light', { type: 'right', value: true })
	SOCKET_CLIENT.emit('light', { type: 'left', value: true })

	setTimeout(()=>{
		SOCKET_CLIENT.emit('light', { type: 'right', value: false })
		SOCKET_CLIENT.emit('light', { type: 'left', value: false })

		setTimeout(()=>{
			SOCKET_CLIENT.emit('light', { type: 'right', value: true })
			SOCKET_CLIENT.emit('light', { type: 'left', value: true })

			setTimeout(()=>{
				SOCKET_CLIENT.emit('light', { type: 'left', value: false })
			}, 500)
		}, 500)
	}, 500)
}

function inGameLights() {
	if (status !== STATUS.IN_GAME) { return }

	SOCKET_CLIENT.emit('light', { type: 'right', value: false })
	SOCKET_CLIENT.emit('light', { type: 'left', value: false })
}

//
