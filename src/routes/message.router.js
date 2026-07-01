import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import workspaceMiddleware from "../middlewares/workspace.middleware.js";
import messageController from "../controllers/message.controller.js";

const messageRouter = express.Router();

// CONFIGURAR EL AUTHMIDDLEWARE A NIVEL DE RUTA //
messageRouter.use(authMiddleware);

// ENVIAR UN MENSAJE AL GRUPO (cualquier miembro aceptado) //
messageRouter.post(
    '/:workspace_id',
    workspaceMiddleware([]),
    messageController.create
);

// OBTENER EL HISTORIAL COMPLETO DE MENSAJES DEL GRUPO //
messageRouter.get(
    '/:workspace_id',
    workspaceMiddleware([]),
    messageController.getByWorkspaceId
);

// OBTENER SOLO LOS MENSAJES NUEVOS (POLLING) //
messageRouter.get(
    '/:workspace_id/new',
    workspaceMiddleware([]),
    messageController.getNew
);

export default messageRouter;