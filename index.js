
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

//
// Sockets
//

let SOCKET_CLIENT

io.on('connection', client => {
	console.log(`Client connected`)

	SOCKET_CLIENT = client

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

dispatcher.onGet("/end_game", (req, res) => {
	SOCKET_CLIENT.emit('light', { type: 'right', value: true })

	setTimeout(()=> {
		SOCKET_CLIENT.emit('light', { type: 'right', value: false })
	}, 1000)

	res.writeHead(200, {'Content-Type': 'application/json'})
	res.end('')
})
