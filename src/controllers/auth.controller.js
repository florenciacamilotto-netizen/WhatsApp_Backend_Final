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
            // Siempre imprimir el enlace de verificación en la consola local por si falla el envío de correo.
            console.log("Enlace de verificación del usuario:", verificationUrl);

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

            return response.status(200).send(`
                <html>
                    <head>
                        <title>Cuenta Verificada</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f7f9fa; }
                            .card { background: white; padding: 30px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                            h1 { color: #07bc0c; }
                            a { display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #07bc0c; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <h1>¡Cuenta verificada con éxito!</h1>
                            <p>Tu email ha sido verificado correctamente. Ya puedes usar tu cuenta.</p>
                            <a href="${ENVIRONMENT.URL_FRONTEND}/login">Ir a Iniciar Sesión</a>
                        </div>
                    </body>
                </html>
            `);
        }
        catch (error) {
            let errorMessage = "Error interno del servidor";
            let statusCode = 500;

            if (error instanceof jwt.JsonWebTokenError) {
                errorMessage = "El token de verificación es inválido o ha expirado.";
                statusCode = 401;
            } else if (error instanceof ServerError) {
                errorMessage = error.message;
                statusCode = error.status;
            } else {
                console.error('Error crítico:', error);
            }

            return response.status(statusCode).send(`
                <html>
                    <head>
                        <title>Error de Verificación</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f7f9fa; }
                            .card { background: white; padding: 30px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                            h1 { color: #e74c3c; }
                            a { display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <h1>Error al verificar</h1>
                            <p>${errorMessage}</p>
                            <a href="${ENVIRONMENT.URL_FRONTEND}/login">Volver al Inicio</a>
                        </div>
                    </body>
                </html>
            `);
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
                message: 'Usuario autentificado exitosamente',
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




    /* --- 4. SOLICITUD RESTABLECER CONTRASEÑA --- */
    async resetPasswordRequest(request, response) {

        const { email } = request.body;

        if (!email) {
            throw new ServerError("El email es obligatorio", 400);
        }

        const user = await userRepository.getByEmail(email);

        //Esto es una decision de negocio, no quiere decir que siempre deba ser asi, un 404 not found podria estar bien tambien o
        if (!user) {
            return response.status(200).json({
                ok: true,
                status: 200,
                message: "En caso de que tengas una cuenta asociada a este correo te enviaremos instrucciones para restablecer tu contraseña"
            });
        }

        const secret_key = ENVIRONMENT.JWT_SECRET + user.password;

        const token = jwt.sign(
            { email: user.email, id: user._id },
            secret_key,
            { expiresIn: '15m' } //El token expiran en 15m
        );

        const reset_link = `${ENVIRONMENT.URL_FRONTEND}/reset-password?token=${token}`;

        await mailer_transport.sendMail({
            from: 'Tu App <no-reply@tuapp.com>',
            to: user.email,
            subject: 'Restablece tu contraseña',
            html: `
                    <h1>Restablecimiento de Contraseña</h1>
                    <p>Has solicitado restablecer tu contraseña. Haz clic en el enlace de abajo para continuar:</p>
                    <a href="${reset_link}">Restablecer mi contraseña</a>
                    <p>Este enlace expirará en 15 minutos. Si tú no solicitaste esto, puedes ignorar este correo sin problemas.</p>
                `
        });

        //RETURN EXITO REAL
        return response.status(200).json({
            ok: true,
            status: 200,
            message: "En caso de que tengas una cuenta asociada a este correo te enviaremos instrucciones para restablecer tu contraseña"
        });

    }

    async resetPasswordConfirm(request, response) {

        const auth_header = request.headers.authorization

        if (!auth_header) {
            throw new ServerError('Falta header de autentificacion', 401)
        }

        const reset_token = auth_header.split(' ')[1]

        if (!reset_token) {
            throw new ServerError('Falta el token de autorizacion', 401)
        }

        const { email } = jwt.decode(reset_token)
        const user = await userRepository.getByEmail(email)
        if (!user) {
            throw new ServerError("Usuario no encontrado", 404);
        }


        const secret_key = ENVIRONMENT.JWT_SECRET + user.password;
        const decoded = jwt.verify(reset_token, secret_key);

        const { newPassword } = request.body;

        if (!newPassword || newPassword.length < 6) {
            throw new ServerError("Contraseña invalida", 400);
        }

        const new_password_hashed = await bcrypt.hash(newPassword, 10);
        await userRepository.updateById(user._id, { password: new_password_hashed });

        return response.status(200).json({
            ok: true,
            status: 200,
            message: "Contraseña restablecida exitosamente"
        });

    }
}

const authController = new AuthController();
export default authController