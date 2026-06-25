const {Server} = require("socket.io")
const cookie = require("cookie")
const jwt = require("jsonwebtoken")
const userModel = require("../models/user.model")
const aiService = require("../services/ai.service")

function initSocketServer(httpServer){

    const io = new Server(httpServer,{})

    io.use(async(socket, next) => {
        const Cookies = cookie.parse(socket.handshake.headers?.cookie || "")
        if (!Cookies.token) {
            next(new Error("Authentication error: No token provided"))
        }



        try {
            const decoded = jwt.verify(Cookies.token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id);
            socket.user = user;
            next()
         
        }  catch (err) {
            
            next(new Error("Authentication error: Invalid token"))
        }  

    })


io.on("connection",(socket) =>{

    socket.on("ai-message", async (messagePayload) =>{

        console.log(messagePayload)

        const response = await aiService.generateResponse(messagePayload.content)

        socket.emit('ai-response', {
            content: response,
            chat: messagePayload.chat
        })

    })
   
})

}

module.exports =  initSocketServer
