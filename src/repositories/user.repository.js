import User from "../models/user.model.js";

class UserRepository {
    async getById(user_id) {
        return await User.findById(user_id)
    }

    async create(nombre, email, password) {
        return await User.create({
            nombre,
            email,
            password
        })
    }

    // BUSCAR EN MONGODB AL USUARIO INDICADO POR EMAIL //
    async getByEmail(email) {
        const user_found = await User.findOne({ email: email, activo: true })
        return user_found
    }

    async deleteById(user_id) {
        // SOFT DELETE//
        /* await User.findByIdAndUpdate(user_id, {activo:false}) */
        // HARD DELETE //
        await User.findByIdAndDelete(user_id)
    }

    async updateById(user_id, update_data) {
        await User.findByIdAndUpdate(user_id, update_data)
    }

}

const userRepository = new UserRepository()
export default userRepository