import ServerError from "../helpers/serverError.helper.js";
import ENVIRONMENT from "../config/environment.config.js";
import jwt from 'jsonwebtoken'

function authMiddleware(request, response, next) {
    try {
        const authorization_header = request.headers.authorization

        // RECIBIR HEADER DE AUTORIZACIÓN //
        if (!authorization_header) {
            throw new ServerError("No hay Header de autorización", 401)
        }

        // TRANSFORMAR EL HEADER DE AUTORIZACIÓN EN UN ARRAY CON 2 VALORES: EL BEARER Y EL TOKEN //
        // 'bearer token_value' => split (' ') => ['bearer', 'token_value'][1] //
        const authorization_token = authorization_header.split(' ')[1]

        // EXTRAER TOKEN DE AUTORIZACIÓN DE HEADER //
        if (!authorization_token) {
            throw new ServerError("No hay Token de autorización", 401)
        }

        // VERIFICAR EL TOKEN DE HEADER //
        const user_info = jwt.verify(
            authorization_token,
            ENVIRONMENT.JWT_SECRET
        )

        // GUARDAR INFORMACIÓN DEL USUARIO DENTRO DE LA REQUEST //
        request.user = user_info

        console.log(user_info)
        // ACTIVA EL SIGUIENTE CONTROLADOR //
        return next()
    }
    catch (error) {
        // TOKEN DE HEADER EXPIRADO O INVÁLIDO//
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return response.status(401).json({
                message: 'Token expirado o inválido',
                ok: false,
                status: 401
            })
        }
        else if (error instanceof ServerError) {
            return response.status(error.status).json(
                {
                    message: error.message,
                    ok: false,
                    status: error.status
                }
            )
        }
        else {
            console.error('Error crítico:', error);
            return response.status(500).json({
                message: "Error interno del servidor",
                ok: false,
                status: 500
            });
        }
    }
}

export default authMiddleware