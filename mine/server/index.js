import { WebSocketServer } from "ws"
const server = new WebSocketServer({ port: '3000'})

if(server){
    console.log('Running on port 3000')
}

server.on('connection', socket => {
    socket.on('message', message => {
        const b = Buffer.from(message)
        console.log(b.toString())
        socket.send(`${message}`)
    })
})