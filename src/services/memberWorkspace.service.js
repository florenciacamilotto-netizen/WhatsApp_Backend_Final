import ENVIRONMENT from "../config/environment.config.js";
import MEMBER_INVITATION_STATUS from "../constants/memberInvitationStatus.constant.js";
import ServerError from "../helpers/serverError.helper.js";
import userRepository from "../repositories/user.repository.js";
import workspaceRepository from "../repositories/workspace.repository.js";
import workspaceMemberRepository from "../repositories/workspaceMember.repository.js";
import mailService from "./mail.service.js";

class MemberWorkspaceService {

    // Invita a un usuario existente a un workspace y le envía el mail de invitación
    async inviteUser(client_id, invited_email, workspace_id, role) {
        // Verificar que el espacio de trabajo exista
        const workspace = await workspaceRepository.getById(workspace_id);
        if (!workspace) {
            throw new ServerError("El espacio de trabajo no existe", 404);
        }

        // Verificar que exista un usuario registrado con ese email
        const invited_user = await userRepository.getByEmail(invited_email);
        if (!invited_user) {
            throw new ServerError("No existe un usuario registrado con ese email", 404);
        }

        // Evitar que el dueño se invite a si mismo
        if (invited_user._id.toString() === client_id.toString()) {
            throw new ServerError("No puedes invitarte a ti mismo", 400);
        }

        // Verificar que no exista ya una membresía (pendiente o aceptada) para este usuario
        const existing_membership = await workspaceMemberRepository.getMemberByWorkspaceAndUserId(
            workspace_id,
            invited_user._id
        );

        if (existing_membership) {
            if (existing_membership.estatus_invitacion === MEMBER_INVITATION_STATUS.ACCEPTED) {
                throw new ServerError("El usuario ya es miembro de este grupo", 400);
            }
            if (existing_membership.estatus_invitacion === MEMBER_INVITATION_STATUS.PENDING) {
                throw new ServerError("El usuario ya tiene una invitación pendiente a este grupo", 400);
            }
        }

        // Crear la membresía en estado Pendiente (expira en 7 días)
        const fecha_expiracion_invitacion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await workspaceMemberRepository.create(
            invited_user._id,
            workspace_id,
            role,
            MEMBER_INVITATION_STATUS.PENDING,
            fecha_expiracion_invitacion
        );

        // El invitado acepta/rechaza desde la app (requiere sesión), por eso ambos
        // links apuntan a la pantalla de invitaciones pendientes del frontend.
        const accept_url = `${ENVIRONMENT.URL_FRONTEND}/invitations`;
        const reject_url = `${ENVIRONMENT.URL_FRONTEND}/invitations`;

        await mailService.sendInvitationMemberEmail(invited_email, accept_url, reject_url, role);
    }

    // Aplica la decisión (Aceptado/Rechazado) sobre una membresía pendiente
    async memberDesicion(membership_id, decision) {
        await workspaceMemberRepository.updateById(membership_id, {
            estatus_invitacion: decision
        });
    }
}

const memberWorkspaceService = new MemberWorkspaceService();
export default memberWorkspaceService;
