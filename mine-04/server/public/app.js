const socket = io('ws://192.168.1.4:3500')

const activity = document.querySelector('.activity')
const msgInput = document.querySelector('input')

function sendMessage(e) {
    e.preventDefault()

    if(msgInput.value){
        socket.emit('message', msgInput.value)
        msgInput.value = ""
    }
    msgInput.focus()
}

document.querySelector('form')
    .addEventListener('submit', sendMessage)

// Listen for messages
socket.on("message", (data) => {
    activity.textContent = ''
    const li = document.createElement('li')
    li.textContent = data
    document.querySelector('ul').appendChild(li)
})

let activityTimer;
socket.on('activity', (name) => {
    activity.textContent = `${name} is typing...`

    // Clear after 2 seconds
    clearTimeout(activityTimer)
    activityTimer = setTimeout(() => {
        activity.textContent = ""
    }, 2000)
})


msgInput.addEventListener('keypress', () => {
    socket.emit('activity', socket.id.substring(0, 5))
})