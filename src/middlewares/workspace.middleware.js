import ServerError from "../helpers/serverError.helper.js"
import Workspace from "../models/workspace.model.js"
import WorkspaceMember from "../models/workspaceMembers.model.js"
import workspaceRepository from "../repositories/workspace.repository.js"
import workspaceMemberRepository from "../repositories/workspaceMember.repository.js"
import MEMBER_INVITATION_STATUS from "../constants/memberInvitationStatus.constant.js"

function workspaceMiddleware(valid_roles = []) {

    return async function (request, response, next) {
        try {
            const user_id = request.user.id;
            const workspace_id = request.params.workspace_id;

            // CORROBORAR SI EXISTE EL ESPACIO DE TRABAJO //
            if (!workspace_id) {
                throw new ServerError("No se proporcionó el ID del espacio de trabajo", 400);
            }

            // BUSCAR ESPACIO DE TRABAJO POR ID //
            const workspace = await workspaceRepository.getById(workspace_id);
            if (!workspace) {
                throw new ServerError("No se encontró el espacio de trabajo", 404);
            }

            const member_selected = await workspaceMemberRepository.getByUserAndWorkspaceId(user_id, workspace_id);

            if (!member_selected) {
                throw new ServerError("No eres miembro de este espacio de trabajo", 403);
            }
            /* console.log({valid_roles, member_selected}) */

            if (member_selected.estatus_invitacion !== MEMBER_INVITATION_STATUS.ACCEPTED) {
                throw new ServerError("Debés aceptar la invitación antes de realizar esta acción", 403);
            }

            if (valid_roles.length > 0 && !valid_roles.includes(member_selected.rol)) {
                throw new ServerError("No tenés el rol necesario para esta accion", 403);
            }

            request.workspace = workspace;
            request.membership = member_selected;

            return next();

        } catch (error) {
            if (error instanceof ServerError) {
                return response.status(error.status).json({
                    message: error.message,
                    ok: false,
                    status: error.status
                });
            } else {
                console.error("Error critico:", error);
                return response.status(500).json({
                    message: "Error interno del servidor",
                    ok: false,
                    status: 500
                });
            }
        }
    }
}

export default workspaceMiddleware;