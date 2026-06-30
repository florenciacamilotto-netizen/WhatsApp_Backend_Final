import MEMBER_INVITATION_STATUS from "../constants/memberInvitationStatus.constant.js";
import ServerError from "../helpers/serverError.helper.js";
import userRepository from "../repositories/user.repository.js";
import workspaceMemberRepository from "../repositories/workspaceMember.repository.js";
import mailService from "./mail.service.js";
import ENVIRONMENT from "../config/environment.config.js";

/* 
Es la capa de nuestra API encargada de la logica de negocio
La idea es separar las funcionalidades de nuestra aplicacion como servicios, de esta manera el controlador solo se ocupara de parte HTTP Request response y el servicio de la logica de negocio
*/
class MemberWorkspaceService {

    /**
     * Invita a un usuario al grupo. La notificación llega dentro de la app
     * (en el grupo), no por email. La membresía queda en estado Pendiente
     * hasta que el invitado acepte o rechace desde la aplicación.
     *
     * @param {String} user_invited_for_id El id del usuario que invita
     * @param {String} user_invited_email El email del usuario invitado
     * @param {String} workspace_id El id del espacio de trabajo
     * @param {String} role El rol del usuario invitado
     */
    async inviteUser(user_invited_for_id, user_invited_email, workspace_id, role) {

        const userToInvite = await userRepository.getByEmail(user_invited_email);
        if (!userToInvite) {
            throw new ServerError("El usuario ingresado no existe en el sistema", 404);
        }

        // Verifica si el usuario ya es miembro o tiene una invitacion pendiente
        await this.verifyAlreadyMember(workspace_id, userToInvite._id);

        // Crea la membresia en estado Pendiente
        await workspaceMemberRepository.create(
            userToInvite._id,
            workspace_id,
            role,
            MEMBER_INVITATION_STATUS.PENDING,
            null
        );

        // Envía el mail de invitación. Si falla el envío, no rompemos la
        // invitación ya creada (igual que en el registro de usuario);
        // el invitado siempre puede ver/aceptar la invitación desde la app.
        const accept_url = `${ENVIRONMENT.URL_FRONTEND}/workspaces/${workspace_id}/invitations?decision=${encodeURIComponent(MEMBER_INVITATION_STATUS.ACCEPTED)}`;
        const reject_url = `${ENVIRONMENT.URL_FRONTEND}/workspaces/${workspace_id}/invitations?decision=${encodeURIComponent(MEMBER_INVITATION_STATUS.REJECTED)}`;

        try {
            await mailService.sendInvitationMemberEmail(
                user_invited_email,
                accept_url,
                reject_url,
                role
            );
        } catch (mailError) {
            console.error("Error al enviar el email de invitación:", mailError.message);
        }
    }

    /**
     * El invitado acepta o rechaza su invitacion desde la app.
     * Se identifica mediante su sesion activa.
     *
     * @param {String} member_id El id de la membresia del invitado
     * @param {String} decision ACCEPTED o REJECTED
     */
    async memberDesicion(member_id, decision) {
        const membership = await workspaceMemberRepository.getById(member_id);
        if (!membership) {
            throw new ServerError("Invitacion no encontrada", 404);
        }

        if (membership.estatus_invitacion !== MEMBER_INVITATION_STATUS.PENDING) {
            throw new ServerError("Esta invitacion ya fue procesada anteriormente", 400);
        }

        await workspaceMemberRepository.updateById(
            membership._id,
            { estatus_invitacion: decision }
        );
    }

    async verifyAlreadyMember(workspace_id, user_id) {
        const isInvitedAlreadyMember = await workspaceMemberRepository.getMemberByWorkspaceAndUserId(workspace_id, user_id);
        if (isInvitedAlreadyMember) {
            if (isInvitedAlreadyMember.estatus_invitacion === MEMBER_INVITATION_STATUS.ACCEPTED) {
                throw new ServerError("El usuario ya es un miembro del espacio de trabajo", 400);
            }
            if (isInvitedAlreadyMember.estatus_invitacion === MEMBER_INVITATION_STATUS.PENDING) {
                throw new ServerError("Ya has enviado una invitacion al usuario", 400);
            }
            if (isInvitedAlreadyMember.estatus_invitacion === MEMBER_INVITATION_STATUS.REJECTED) {
                // Si ya rechazo antes, eliminamos la membresia y permitimos re-invitar
                await workspaceMemberRepository.deleteById(isInvitedAlreadyMember._id);
            }
        }
    }
}

const memberWorkspaceService = new MemberWorkspaceService();
export default memberWorkspaceService;