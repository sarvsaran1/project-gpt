const mongoose = require('mongoose')
 


async function connectDb() {
    try{
         await mongoose.connect(process.env.MONGO_URI)

         console.log("Connected to MongoDB")

    } catch(err){
        console.error("Error Connecting to MongoDB", err)
    }
   
}



module.exports = connectDb