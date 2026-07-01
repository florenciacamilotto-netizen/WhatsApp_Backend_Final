import mailer_transport from "../config/mailer.config.js";
import ServerError from "../helpers/serverError.helper.js";
import userRepository from "../repositories/user.repository.js";
import bcrypt from "bcrypt"
import ENVIRONMENT from "../config/environment.config.js";
import jwt from "jsonwebtoken"

class AuthController {

    async register(request, response) {
        try {
            const { name, email, password } = request.body;

            // VALIDAR INFORMACIÓN DE REGISTRO //
            if (!name || name.length <= 2) {
                throw new ServerError("Nombre debe de ser mayor a 2 caracteres", 400)
            }

            if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
                throw new ServerError("Email inválido", 400)
            }

            if (!password || password.length < 6) {
                throw new ServerError("Password debe de tener al menos 6 caracteres", 400)
            }

            // VERIFICAR REGISTRO EXISTENTE DE USUARIO //
            const existingUser = await userRepository.getByEmail(email);
            if (existingUser) {
                throw new ServerError("El email ya está registrado", 400)
            }

            // HASHEAR CONTRASEÑA ANTES DE CREAR USUARIO //
            const hashed_password = await bcrypt.hash(password, 12);

            // CREAR USUARIO //
            const newUser = await userRepository.create(name, email, hashed_password);

            const verification_token = jwt.sign(
                {
                    email: email
                },
                ENVIRONMENT.JWT_SECRET
            )

            const verificationUrl = `${ENVIRONMENT.URL_BACKEND}/api/auth/verify-email?verification_token=${verification_token}`;
            try {
                await mailer_transport.sendMail(
                    {
                        to: email,
                        from: ENVIRONMENT.GMAIL_USERNAME,
                        subject: "Verifica tu mail",
                        html: `
                             <h1> Bienvenido a WhatsApp </h1>
                             <a href='${verificationUrl}'>Click aquí</a> para verificar tu cuenta
                        `
                    }
                )
                console.log(`Email de verificación enviado a ${email}.`);
            } catch (mailError) {
                console.error("Error al enviar el email de verificación:", mailError.message);
            }

            return response.status(201).json({
                message: "Usuario registrado con éxito",
                ok: true,
                status: 201,
                data: {
                    user: {
                        id: newUser._id,
                        name: newUser.nombre,
                        email: newUser.email
                    }
                }
            });
        }
        catch (error) {
            if (error instanceof ServerError) {
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

    async verifyEmail(request, response) {
        try {
            const { verification_token } = request.query;

            // VERIFICAR EXISTENCIA DE EMAIL //
            if (!verification_token) {
                throw new ServerError("Falta token de verificación", 400);
            }

            // CONVOCAR A USUARIO POR EMAIL //
            const payload = jwt.verify(verification_token, ENVIRONMENT.JWT_SECRET)
            const { email } = payload
            const user = await userRepository.getByEmail(email);

            // VERIFICAR EXISTENCIA DE USUARIO //
            if (!user) {
                throw new ServerError("Usuario no encontrado", 404);
            }

            // USUARIO VERIFICADO //
            if (user.email_verificado) {
                throw new ServerError("Este email ya ha sido verificado", 400);
            }

            // ACTUALIZAR VERIFICACIÓN DE USUARIO A VERDADERO //
            await userRepository.updateById(user._id, { email_verificado: true });

            return response.redirect(`${ENVIRONMENT.URL_FRONTEND}/verify-success`);
        }
        catch (error) {
            let errorMessage = "Error interno del servidor";

            if (error instanceof jwt.JsonWebTokenError) {
                errorMessage = "El token de verificación es inválido o ha expirado.";
            } else if (error instanceof ServerError) {
                errorMessage = error.message;
            } else {
                console.error('Error crítico:', error);
            }

            return response.redirect(`${ENVIRONMENT.URL_FRONTEND}/verify-error?message=${encodeURIComponent(errorMessage)}`);
        }
    }

    async login(request, response) {
        try {
            const { email, password } = request.body

            // VALIDAR INFORMACIÓN DE REGISTRO //
            if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
                throw new ServerError("Email inválido", 400)
            }

            if (!password || password.length < 6) {
                throw new ServerError("Contraseña inválida", 400)
            }

            const user_found = await userRepository.getByEmail(email);

            // USUARIO NO ENCONTRADO //
            if (!user_found) {
                throw new ServerError("Usuario no registrado", 404)
            }

            // MAIL NO VERIFICADO //
            if (!user_found.email_verificado) {
                throw new ServerError("Usuario con verificación de mail pendiente", 401)
            }

            // COMPARAR CONTRASEÑAS DEL CLIENTE Y DEL USUARIO //
            const is_same_password = await bcrypt.compare(password, user_found.password)

            // DIFERENTES CONTRASEÑAS DEL CLIENTE Y DEL USUARIO //
            if (!is_same_password) {
                throw new ServerError("Credenciales inválidas", 401)
            }

            // MISMAS CONTRASEÑAS DEL CLIENTE Y DEL USUARIO //
            // GENERAR LOS DATOS DE SESIÓN //
            const profile_info = {
                nombre: user_found.nombre,
                email: user_found.email,
                id: user_found._id,
                fecha_creacion: user_found.fecha_creacion
            }

            const access_token = jwt.sign(
                profile_info,
                ENVIRONMENT.JWT_SECRET
            )

            return response.status(200).json({
                ok: true,
                status: 200,
                message: "Usuario autentificado exitosamente",
                data: {
                    access_token
                }
            })
        }
        catch (error) {
            if (error instanceof ServerError) {
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
}

const authController = new AuthController();
export default authController