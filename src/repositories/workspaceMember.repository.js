import WorkspaceMember from "../models/workspaceMembers.model.js"
import MEMBER_INVITATION_STATUS from "../constants/memberInvitationStatus.constant.js"

class WorkspaceMemberRepository {

    async create(user_id, workspace_id, rol, estatus_invitacion, fecha_expiracion_invitacion) {
        return await WorkspaceMember.create({
            fk_workspace_id: workspace_id,
            fk_user_id: user_id,
            rol,
            estatus_invitacion,
            fecha_expiracion_invitacion
        });
    }

    async getById(member_id) {
        return await WorkspaceMember.findById(member_id);
    }

    async updateById(member_id, update_data) {
        return await WorkspaceMember.findByIdAndUpdate(member_id, update_data);
    }

    async deleteById(member_id) {
        return await WorkspaceMember.findByIdAndDelete(member_id);
    }

    // Lista de membresías por workspace (solo miembros aceptados)
    async getByWorkspaceId(workspace_id) {
        const resultado = await WorkspaceMember
            .find({
                fk_workspace_id: workspace_id,
                estatus_invitacion: MEMBER_INVITATION_STATUS.ACCEPTED
            })
            .populate('fk_user_id', 'nombre email');

        return resultado.map((member) => ({
            member_id: member._id,
            member_fk_workspace_id: member.fk_workspace_id,
            member_rol: member.rol,
            member_fecha_creacion: member.fecha_creacion,
            user_id: member.fk_user_id._id,
            user_nombre: member.fk_user_id.nombre,
            user_email: member.fk_user_id.email
        }));
    }

    // Obtener membresía por usuario y workspace (cualquier estado)
    async getByUserAndWorkspaceId(user_id, workspace_id) {
        return await WorkspaceMember.findOne({
            fk_user_id: user_id,
            fk_workspace_id: workspace_id
        });
    }

    // Alias usado en memberWorkspace.service.js
    async getMemberByWorkspaceAndUserId(workspace_id, user_id) {
        return await this.getByUserAndWorkspaceId(user_id, workspace_id);
    }

    // Listar membresías aceptadas de un usuario (para el listado de grupos)
    async getByUserId(user_id) {
        const memberships = await WorkspaceMember
            // BUSCAR MEMBRESÍAS ASOCIADAS A UN USUARIO EN PARTICULAR //
            .find({
                fk_user_id: user_id,
                estatus_invitacion: MEMBER_INVITATION_STATUS.ACCEPTED
            })
            // EXPANDIR LA PROPIEDAD FK_WORKSPACE_ID POR CADA MEMBRESÍA //
            // OBTENER LOS DATOS ASOCIADOS AL ESPACIO DE TRABAJO //
            .populate(
                {
                    // PROPIEDAD A EXPANDIR //
                    path: 'fk_workspace_id',
                    // DATOS SELEACCIONADOS DE LA PROPIEDAD EXPANDIDA //
                    select: 'nombre descripcion estado',
                    // CONDICIÓN //
                    match: { estado: true }
                }
            );

        return memberships
            .filter(
                membership => membership.fk_workspace_id
            )
            .map((membership) => ({
                /* Member */
                member_id: membership._id,
                member_rol: membership.rol,
                member_fecha_creacion: membership.fecha_creacion,
                /* Workspace */
                workspace_id: membership.fk_workspace_id._id,
                workspace_nombre: membership.fk_workspace_id.nombre,
                workspace_descripcion: membership.fk_workspace_id.descripcion,
                workspace_fecha_creacion: membership.fk_workspace_id.fecha_creacion
            }));
    }
}

const workspaceMemberRepository = new WorkspaceMemberRepository();
export default workspaceMemberRepository;