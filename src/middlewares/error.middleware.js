import jwt from 'jsonwebtoken'
import ServerError from '../helpers/serverError.helper.js';


function errorHandlerMiddleware(error, request, response, next) {
    if (
        error instanceof jwt.JsonWebTokenError
        ||
        error instanceof jwt.NotBeforeError
        ||
        error instanceof jwt.TokenExpiredError
    ) {
        return response.status(401).json(
            {
                message: "Token invalido",
                ok: false,
                status: 401
            }
        )
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
        console.error('Error critico:', error);
        return response.status(500).json({
            message: "Error interno del servidor",
            ok: false,
            status: 500
        });
    }
}

export default errorHandlerMiddleware