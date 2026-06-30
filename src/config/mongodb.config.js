import mongoose from "mongoose"
import ENVIRONMENT from "./environment.config.js"

const connectMongoDB = async () => {
    try {
        await mongoose.connect(
            ENVIRONMENT.MONGO_DB_CONNECTION_STRING + '/' + ENVIRONMENT.MONGO_DB_NAME
        )
        console.log("La conexión con MongoDB funciona")
    }
    catch (error) {
        console.error("Hubo un fallo en la conexión de la DB", error)
    }
}

export default connectMongoDB