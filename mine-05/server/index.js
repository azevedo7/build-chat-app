import express from 'express'
import { Server } from "socket.io"

const PORT = process.env.PORT || 3500
const ADMIN = "Admin"

const app = express()
app.use(express.static("public"))

const expressServer = app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`)
})

// state
const UsersState = {
    users: [],
    setUsers: function(newUsersArray) {
        this.users = newUsersArray
    }
}

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://127.0.0.1:5500", "http://localhost:5500", "http://192.168.1.4:3500", "http://192.168.1.4:5500"]
    }
})

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`)

    // Upon ocnnection - only to the user
    socket.emit('message', buildMsg(ADMIN, "Welcome to Chat App!"))

    socket.on('enterRoom', ({ name, room}) => {
        // leave a previous room
        const prevRoom = getUser(socket.id)?.room

        if(prevRoom){
            socket.leave(room)
            io.to(prevRoom).emit('message', buildMsg(ADMIN, `${name} has left the room`))
        }

        const user = activateUser(socket.id, name, room)

        if(prevRoom){
            io.to(prevRoom).emit('userList', {
                users: getUsersInRoom(prevRoom)
            })
        }

        // Join room
        socket.join(user.room)

        // To user who joined
        socket.emit('message', buildMsg(ADMIN, `You have joined the ${user.room} chat room`))

        // to everyone else
        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has joined the room`))

        // update user list or room
        io.to(user.room).emit('userList', {
            users: getUsersInRoom(user.room)
        })

        // update rooms list for everyone
        io.emit('roomList', {
            rooms: getAllActiveRooms()
        })
    })

    // When user disconnects - go to all others
    socket.on('disconnect', () => {
        const user = getUser(socket.id)
        userLeavesApp(socket.id)

        if(user){
            console.log(user)
            io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left the room`))

            io.to(user.room).emit('userList', {
                users: getUsersInRoom(user.room)
            })
        }

        io.emit('roomList', {
            rooms: getAllActiveRooms()
        })
    })

    socket.on('message', ({ name, text })=> {
        const room = getUser(socket.id)?.room
        if(room){
            io.to(room).emit('message', buildMsg(name, text))
        }
    })

    // Listen for activity
    socket.on('activity', (name) => {
        const room = getUser(socket.id)?.room
        if(room){
            io.to(room).emit('activity', name)
        }
    })
})

function buildMsg(name, text) {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }).format(new Date())
    }
}

// User functions
function activateUser(id, name, room) {
    const user = { id, name, room }
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id),
        user
    ])
    return user
}

function userLeavesApp(id){
    UsersState.setUsers(UsersState.users.filter(user=>user.id!==id))
}

function getUser(id){
    return UsersState.users.find(user => user.id === id)
}

function getUsersInRoom(room){
    return UsersState.users.filter(user => user.room === room)
}

function getAllActiveRooms() {
     return Array.from(new Set(UsersState.users.map(user => user.room)))
}