import MEMBER_INVITATION_STATUS from "../constants/memberInvitationStatus.constant.js";
import ServerError from "../helpers/serverError.helper.js";
import userRepository from "../repositories/user.repository.js";
import workspaceRepository from "../repositories/workspace.repository.js";
import workspaceMemberRepository from "../repositories/workspaceMember.repository.js";

class MemberWorkspaceService {

    // INVITAR A UN CLIENTE A FORMAR PARTE DE UN ESPACIO DE TRABAJO //
    async inviteUser(client_id, invited_email, workspace_id, role) {


        // VERIFICAR LA EXISTENCIA DEL ESPACIO DE TRABAJO //
        const workspace = await workspaceRepository.getById(workspace_id);
        if (!workspace) {
            throw new ServerError("El espacio de trabajo no existe", 404);
        }

        // VERIFICAR LA EXISTENCIA DE UN USUARIO REGISTRADO CON ESE MAIL //
        const invited_user = await userRepository.getByEmail(invited_email);
        if (!invited_user) {
            throw new ServerError("No existe un usuario registrado con ese email", 404);
        }

        // EVITAR QUE EL DUEÑO SE INVITE A SÍ MISMO //
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

        // CREAR MEMBRESÍA //
        const fecha_expiracion_invitacion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await workspaceMemberRepository.create(
            invited_user._id,
            workspace_id,
            role,
            MEMBER_INVITATION_STATUS.PENDING,
            fecha_expiracion_invitacion
        );
    }

    // ACEPTAR O RECHAZAR LA MEMBRESÍA PENDIENTE //
    async memberDesicion(membership_id, decision) {
        await workspaceMemberRepository.updateById(membership_id, {
            estatus_invitacion: decision
        });
    }
}

const memberWorkspaceService = new MemberWorkspaceService();
export default memberWorkspaceService;
