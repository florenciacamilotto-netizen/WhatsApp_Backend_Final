import Message from "../models/message.model.js";

class MessageRepository {

    async create(workspace_id, user_id, contenido) {
        return await Message.create({
            fk_workspace_id: workspace_id,
            fk_user_id: user_id,
            contenido
        });
    }

    async getById(message_id) {
        return await Message.findById(message_id);
    }

    // Historial completo de mensajes de un grupo, ordenados del más viejo al más nuevo
    async getByWorkspaceId(workspace_id) {
        const resultado = await Message
            .find({ fk_workspace_id: workspace_id })
            .sort({ fecha_creacion: 1 })
            .populate('fk_user_id', 'nombre email');

        return resultado.map(this.#toDTO);
    }

    // Solo los mensajes posteriores a una fecha dada (usado para el polling)
    async getByWorkspaceIdAfter(workspace_id, after_date) {
        const resultado = await Message
            .find({
                fk_workspace_id: workspace_id,
                fecha_creacion: { $gt: after_date }
            })
            .sort({ fecha_creacion: 1 })
            .populate('fk_user_id', 'nombre email');

        return resultado.map(this.#toDTO);
    }

    #toDTO(message) {
        return {
            message_id: message._id,
            message_fk_workspace_id: message.fk_workspace_id,
            message_contenido: message.contenido,
            message_fecha_creacion: message.fecha_creacion,
            user_id: message.fk_user_id._id,
            user_nombre: message.fk_user_id.nombre,
            user_email: message.fk_user_id.email
        };
    }

}

const messageRepository = new MessageRepository();
export default messageRepository;