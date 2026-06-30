import MEMBER_INVITATION_STATUS from "../constants/memberInvitationStatus.constant.js";
import { MEMBER_WORKSPACE_ROLES } from "../constants/memberRoles.constant.js";
import ServerError from "../helpers/serverError.helper.js";
import workspaceMemberRepository from "../repositories/workspaceMember.repository.js";
import memberWorkspaceService from "../services/memberWorkspace.service.js";

class MemberWorkspaceController {

    // POST /:workspace_id/members
    // Solo el Dueño puede invitar usuarios al grupo
    async inviteUser(request, response) {
        const { workspace_id } = request.params;
        const { invited_email, role } = request.body;
        const { id: client_id } = request.user;

        if (!invited_email || !role) {
            throw new ServerError("Faltan datos obligatorios (email y rol)", 400);
        }

        const rolesPermitidos = [MEMBER_WORKSPACE_ROLES.USER, MEMBER_WORKSPACE_ROLES.ADMIN];
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

    // PUT /:workspace_id/members/me/decision
    // El invitado acepta o rechaza la invitación desde la app (requiere sesión)
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

        // Buscamos la membresía pendiente del usuario en este workspace
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
            message: `Decisión de ${decision} tomada con éxito!`
        });
    }

    // PUT /:workspace_id/members/me/downgrade
    // El Admin renuncia a su rol y pasa a ser Usuario
    async downgradeSelf(request, response) {
        const membership = request.membership;

        await workspaceMemberRepository.updateById(
            membership._id,
            { rol: MEMBER_WORKSPACE_ROLES.USER }
        );

        return response.status(200).json({
            ok: true,
            message: "Ahora eres Usuario del grupo"
        });
    }

    // DELETE /:workspace_id/members/me
    // Cualquier miembro aceptado (Admin o Usuario) puede abandonar el grupo
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

    // DELETE /:workspace_id/members/:member_id
    // El Dueño expulsa a un Admin o Usuario del grupo
    async kickMember(request, response) {
        const { member_id } = request.params;
        const requester_membership = request.membership;

        const memberToKick = await workspaceMemberRepository.getById(member_id);

        if (!memberToKick) {
            throw new ServerError("El miembro indicado no existe en este grupo", 404);
        }

        if (memberToKick.fk_workspace_id.toString() !== request.workspace._id.toString()) {
            throw new ServerError("El miembro no pertenece a este grupo", 400);
        }

        if (memberToKick._id.toString() === requester_membership._id.toString()) {
            throw new ServerError("El Dueño no puede expulsarse a sí mismo", 400);
        }

        if (memberToKick.rol === MEMBER_WORKSPACE_ROLES.OWNER) {
            throw new ServerError("No se puede expulsar al Dueño del grupo", 400);
        }

        await workspaceMemberRepository.deleteById(member_id);

        return response.status(200).json({
            ok: true,
            message: "Miembro eliminado del grupo exitosamente"
        });
    }
}

const memberWorkspaceController = new MemberWorkspaceController();
export default memberWorkspaceController;