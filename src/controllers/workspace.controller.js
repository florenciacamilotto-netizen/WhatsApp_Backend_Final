import MEMBER_INVITATION_STATUS from "../constants/memberInvitationStatus.constant.js";
import { MEMBER_WORKSPACE_ROLES } from "../constants/memberRoles.constant.js";
import ServerError from "../helpers/serverError.helper.js";
import workspaceRepository from "../repositories/workspace.repository.js";
import workspaceMemberRepository from "../repositories/workspaceMember.repository.js";


class WorkspaceController {

    // POST /
    // Cualquier usuario autenticado puede crear un grupo
    async create(request, response) {
        const { nombre, descripcion } = request.body;
        const user_id = request.user.id;

        if (!nombre || nombre.trim() === '') {
            throw new ServerError("El nombre del espacio de trabajo es obligatorio", 400);
        }

        const newWorkspace = await workspaceRepository.create(nombre, descripcion || '');

        // El creador queda como Dueño con invitación aceptada automáticamente
        await workspaceMemberRepository.create(
            user_id,
            newWorkspace._id,
            MEMBER_WORKSPACE_ROLES.OWNER,
            MEMBER_INVITATION_STATUS.ACCEPTED,
            null
        );

        return response.status(201).json({
            ok: true,
            message: "Espacio de trabajo creado con éxito",
            data: {
                workspace: newWorkspace
            }
        });
    }

    // GET /
    // Devuelve solo los grupos donde el usuario tiene invitación Aceptada
    async getAllByUser(req, res) {
        const user_id = req.user.id;
        const workspaces = await workspaceMemberRepository.getByUserId(user_id);

        return res.status(200).json({
            ok: true,
            message: "Espacios de trabajo obtenidos",
            data: {
                workspaces
            }
        });
    }

    // (DELETE) ESPACIO DE TRABAJO //

    async deleteById(request, response) {
        try {
            const workspace_id = request.params.workspace_id;
            const deleted_workspace = await workspaceRepository.softDeleteById(workspace_id);

            return response.status(200).json({
                message: "Espacio de trabajo eliminado exitosamente",
                ok: true,
                status: 200,
                data: {
                    workspace: deleted_workspace
                }
            });
        } catch (error) {
            if (error instanceof ServerError) {
                return response.status(error.status).json(
                    {
                        message: error.message,
                        ok: false,
                        status: error.status
                    }
                )
            }
            else {
                console.error("Error crítico:", error);
                return response.status(500).json({
                    message: "Error interno del servidor",
                    ok: false,
                    status: 500
                });
            }
        }
    }

    // (PUT) ESPACIO DE TRABAJO //

    async updateById(request, response) {
        try {
            const workspace_id = request.params.workspace_id;

            const { nombre, descripcion } = request.body;
            const updated_info = {};
            const rol_user = request.membership.rol;

            // CORROBORAR EL ROL DEL CLIENTE EN EL ESPACIO DE TRABAJO //
            if (rol_user !== MEMBER_WORKSPACE_ROLES.OWNER) {
                throw new ServerError("No tienes permisos para eliminar este Espacio de Trabajo", 403);
            }
            // CORROBORAR LOS CAMPOS A ACTUALIZAR EN EL ESPACIO DE TRABAJO //
            if (!nombre && !descripcion) {
                throw new ServerError("Debes enviar al menos un campo para actualizar", 400);
            }
            // ACTUALIZAR EL CAMPO DE NOMBRE DEL ESPACIO DE TRABAJO //
            if (nombre) {
                if (nombre.length < 2) {
                    throw new ServerError("El nombre debe de tener al menos 2 caracteres", 400);
                }
                updated_info.nombre = nombre;
            }
            // ACTUALIZAR LA DESCRIPCIÓN DEL ESPACIO DE TRABAJO //
            if (descripcion) {
                updated_info.descripcion = descripcion;
            }

            const updated_workspace = await workspaceRepository.updateById(workspace_id, updated_info);
            const workspace_after_update = await workspaceRepository.getById(workspace_id);

            return response.status(200).json({
                message: "Espacio de trabajo actualizado exitosamente",
                ok: true,
                status: 200,
                data: {
                    workspace: workspace_after_update
                }
            });

        } catch (error) {
            if (error instanceof ServerError) {
                return response.status(error.status).json(
                    {
                        message: error.message,
                        ok: false,
                        status: error.status
                    });
            }
            else {
                console.error("Error crítico:", error);
                return response.status(500).json({
                    message: "Error interno del servidor",
                    ok: false,
                    status: 500
                });
            }
        }
    }
}

const workspaceController = new WorkspaceController();
export default workspaceController;