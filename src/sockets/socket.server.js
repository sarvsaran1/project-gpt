const {Server} = require("socket.io")
const cookie = require("cookie")
const jwt = require("jsonwebtoken")
const userModel = require("../models/user.model")
const aiService = require("../services/ai.service")
const messageModel = require("../models/message.model")

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

        await messageModel.create({
            chat: messagePayload.chat,
            user: socket.user._id,
            content: messagePayload.content,
            role: "user"
        })

        const chatHistory = await messageModel.find({
            chat: messagePayload.chat
        })
      
        // console.log("chat history", chatHistory.map (item =>{
        //     return{
        //         role: item.role,
        //         parts: [{ text: item.content}]
        //     }
        // }))

        const response = await aiService.generateResponse(chatHistory.map(item => {
            return{
                role: item.role,
                parts:[{text: item.content}]
            }
        }))

        await messageModel.create({
            chat: messagePayload.chat,
            user: socket.user._id,
            content: response,
            role: "model"
        })

        socket.emit('ai-response', {
            content: response,
            chat: messagePayload.chat
        })

    })
   
})

}

module.exports =  initSocketServer
