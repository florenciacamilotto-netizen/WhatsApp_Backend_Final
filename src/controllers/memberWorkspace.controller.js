import MEMBER_INVITATION_STATUS from "../constants/memberInvitationStatus.constant.js";
import { MEMBER_WORKSPACE_ROLES } from "../constants/memberRoles.constant.js";
import ServerError from "../helpers/serverError.helper.js";
import workspaceMemberRepository from "../repositories/workspaceMember.repository.js";
import memberWorkspaceService from "../services/memberWorkspace.service.js";

class MemberWorkspaceController {

    // (POST) /:workspace_id/members //

    // (DUEÑO) INVITAR USUARIOS AL GRUPO //
    async inviteUser(request, response) {
        const { workspace_id } = request.params;
        const { invited_email, role } = request.body;
        const { id: client_id } = request.user;

        if (!invited_email || !role) {
            throw new ServerError("Faltan datos obligatorios (email y rol)", 400);
        }

        const rolesPermitidos = [MEMBER_WORKSPACE_ROLES.USER];
        if (!rolesPermitidos.includes(role)) {
            throw new ServerError("El rol indicado no es válido para la invitación", 400);
        }

        await memberWorkspaceService.inviteUser(
            client_id,
            invited_email,
            workspace_id,
            role
        );

        return response.status(200).json({
            ok: true,
            message: "Invitación enviada con éxito"
        });
    }

    // (GET) /:workspace_id/members //

    // LISTAR A LOS MIEMBROS QUE ACEPTARON FORMAR PARTE DEL GRUPO //
    async getMembers(request, response) {
        const { workspace_id } = request.params;

        const members = await workspaceMemberRepository.getByWorkspaceId(workspace_id);

        return response.status(200).json({
            ok: true,
            message: "Miembros obtenidos",
            data: {
                members
            }
        });
    }

    // (GET) /members/me/invitations //

    // OBTENER LAS INVITACIONES PENDIENTES DEL USUARIO LOGUEADO //
    async getMyPendingInvitations(request, response) {
        const { id: user_id } = request.user;

        const invitations = await workspaceMemberRepository.getPendingByUserId(user_id);

        return response.status(200).json({
            ok: true,
            message: "Invitaciones pendientes obtenidas",
            data: {
                invitations
            }
        });
    }

    // (PUT) /:workspace_id/members/me/decision //

    // ACTUALIZAR INVITACIÓN ACEPTADA O RECHAZADA //
    async processInvitation(request, response) {
        const { decision } = request.params;
        const { id: user_id } = request.user;
        const { workspace_id } = request.params;

        if (
            decision !== MEMBER_INVITATION_STATUS.ACCEPTED &&
            decision !== MEMBER_INVITATION_STATUS.REJECTED
        ) {
            throw new ServerError("Decisión no válida", 400);
        }

        const membership = await workspaceMemberRepository.getByUserAndWorkspaceId(user_id, workspace_id);

        if (!membership) {
            throw new ServerError("No tienes una invitación en este grupo", 404);
        }

        if (membership.estatus_invitacion !== MEMBER_INVITATION_STATUS.PENDING) {
            throw new ServerError("Esta invitación ya fue procesada anteriormente", 400);
        }

        await memberWorkspaceService.memberDesicion(membership._id, decision);

        response.json({
            ok: true,
            status: 200,
            message: `¡Decisión de ${decision} tomada con éxito!`
        });
    }

    // (DELETE) /:workspace_id/members/me //

    // (MIEMBROS) ABANDONAR EL GRUPO DEL QUE FUERON ACEPTADOS //
    async leaveWorkspace(request, response) {
        const membership = request.membership;

        if (membership.estatus_invitacion !== MEMBER_INVITATION_STATUS.ACCEPTED) {
            throw new ServerError("Solo puedes abandonar un grupo al que hayas aceptado unirte", 400);
        }

        await workspaceMemberRepository.deleteById(membership._id);

        return response.status(200).json({
            ok: true,
            message: "Has abandonado el grupo exitosamente"
        });
    }
}

const memberWorkspaceController = new MemberWorkspaceController();
export default memberWorkspaceController;