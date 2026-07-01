import ServerError from "../helpers/serverError.helper.js";
import messageRepository from "../repositories/message.repository.js";

class MessageController {

    // POST /api/messages/:workspace_id //
    // Cualquier miembro aceptado del grupo puede enviar mensajes
    async create(request, response) {
        try {
            const { workspace_id } = request.params;
            const { contenido } = request.body;
            const user_id = request.user.id;

            if (!contenido || contenido.trim() === '') {
                throw new ServerError("El mensaje no puede estar vacío", 400);
            }

            const new_message = await messageRepository.create(workspace_id, user_id, contenido.trim());
            const message_with_author = await messageRepository.getById(new_message._id);

            return response.status(201).json({
                ok: true,
                message: "Mensaje enviado con éxito",
                data: {
                    message: {
                        message_id: message_with_author._id,
                        message_fk_workspace_id: message_with_author.fk_workspace_id,
                        message_contenido: message_with_author.contenido,
                        message_fecha_creacion: message_with_author.fecha_creacion,
                        user_id: request.user.id,
                        user_nombre: request.user.nombre
                    }
                }
            });

        } catch (error) {
            if (error instanceof ServerError) {
                return response.status(error.status).json({
                    message: error.message,
                    ok: false,
                    status: error.status
                });
            } else {
                console.error("Error crítico al enviar mensaje:", error);
                return response.status(500).json({
                    message: "Error interno del servidor al enviar el mensaje",
                    ok: false,
                    status: 500
                });
            }
        }
    }

    // GET /api/messages/:workspace_id
    // Trae el historial completo de mensajes del grupo
    async getByWorkspaceId(request, response) {
        try {
            const { workspace_id } = request.params;
            const messages = await messageRepository.getByWorkspaceId(workspace_id);

            return response.status(200).json({
                ok: true,
                message: "Mensajes obtenidos con éxito",
                data: {
                    messages
                }
            });

        } catch (error) {
            console.error("Error crítico al obtener mensajes:", error);
            return response.status(500).json({
                message: "Error interno del servidor al obtener los mensajes",
                ok: false,
                status: 500
            });
        }
    }

    // GET /api/messages/:workspace_id/new?after=ISO_DATE
    // Usado por el frontend para hacer polling: trae solo los mensajes nuevos
    async getNew(request, response) {
        try {
            const { workspace_id } = request.params;
            const { after } = request.query;

            if (!after) {
                throw new ServerError("Falta el parámetro 'after'", 400);
            }

            const messages = await messageRepository.getByWorkspaceIdAfter(workspace_id, new Date(after));

            return response.status(200).json({
                ok: true,
                message: "Mensajes nuevos obtenidos con éxito",
                data: {
                    messages
                }
            });

        } catch (error) {
            if (error instanceof ServerError) {
                return response.status(error.status).json({
                    message: error.message,
                    ok: false,
                    status: error.status
                });
            } else {
                console.error("Error crítico al obtener mensajes nuevos:", error);
                return response.status(500).json({
                    message: "Error interno del servidor al obtener los mensajes nuevos",
                    ok: false,
                    status: 500
                });
            }
        }
    }
}

const messageController = new MessageController();
export default messageController;
