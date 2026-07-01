import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import workspaceController from "../controllers/workspace.controller.js";
import workspaceMiddleware from "../middlewares/workspace.middleware.js";
import { MEMBER_WORKSPACE_ROLES } from "../constants/memberRoles.constant.js";

import memberWorkspaceController from '../controllers/memberWorkspace.controller.js';

const workspaceRouter = express.Router();

// CONFIGURAR EL AUTHMIDDLEWARE A NIVEL DE RUTA //
workspaceRouter.use(authMiddleware);

// CREAR UN ESPACIO DE TRABAJO //
workspaceRouter.post('/', workspaceController.create);

// OBTENER LOS ESPACIOS DE TRABAJO DE UN USUARIO //
workspaceRouter.get('/', workspaceController.getAllByUser);

// ELIMINAR EL ESPACIO DE TRABAJO SI EL CLIENTE ES DUEÑO //
workspaceRouter.delete(
    '/:workspace_id',
    workspaceMiddleware([MEMBER_WORKSPACE_ROLES.OWNER]),
    workspaceController.deleteById
);

// EDITAR EL ESPACIO DE TRABAJO SI EL CLIENTE ES DUEÑO //
workspaceRouter.put(
    '/:workspace_id',
    workspaceMiddleware([MEMBER_WORKSPACE_ROLES.OWNER]),
    workspaceController.updateById
);

// Invitar usuario al grupo (solo Dueño)
workspaceRouter.post(
    '/:workspace_id/members',
    workspaceMiddleware([MEMBER_WORKSPACE_ROLES.OWNER]),
    memberWorkspaceController.inviteUser
);

// Invitaciones pendientes del usuario logueado (para mostrarlas en el home)
// IMPORTANTE: ruta literal, va antes que '/:workspace_id/members' para que
// Express no intente interpretar "members" como workspace_id.
workspaceRouter.get(
    '/members/me/invitations',
    memberWorkspaceController.getMyPendingInvitations
);

// Listar miembros aceptados de un grupo (cualquier miembro aceptado puede verla)
workspaceRouter.get(
    '/:workspace_id/members',
    workspaceMiddleware([]),
    memberWorkspaceController.getMembers
);

// El invitado acepta o rechaza la invitación desde la app (requiere sesión)
// El middleware NO se usa aquí porque el invitado aún tiene estatus Pendiente
workspaceRouter.put(
    '/:workspace_id/members/me/:decision',
    memberWorkspaceController.processInvitation
);

// Miembro abandona el grupo voluntariamente
workspaceRouter.delete(
    '/:workspace_id/members/me',
    workspaceMiddleware([MEMBER_WORKSPACE_ROLES.USER]),
    memberWorkspaceController.leaveWorkspace
);

// Dueño expulsa a un miembro
workspaceRouter.delete(
    '/:workspace_id/members/:member_id',
    workspaceMiddleware([MEMBER_WORKSPACE_ROLES.OWNER]),
    memberWorkspaceController.kickMember
);

export default workspaceRouter;