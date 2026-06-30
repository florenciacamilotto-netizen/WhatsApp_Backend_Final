import ENVIRONMENT from "../config/environment.config.js";
import mailer_transport from "../config/mailer.config.js";
import ServerError from "../helpers/serverError.helper.js";


class MailService {
    async sendInvitationMemberEmail (invited_email, accept_url, reject_url, role){
        try {
            await mailer_transport.sendMail({
                from: `"Slack UTN" <${ENVIRONMENT.GMAIL_USERNAME}>`,
                to: invited_email,
                subject: 'Invitación a Espacio de Trabajo',
                html: `
                    <div style="font-family: Arial; padding: 20px; text-align: center;">
                        <h2>¡Has sido invitado!</h2>
                        <p>Alguien te ha invitado a colaborar en un espacio de trabajo con el rol de <b>${role}</b>.</p>
                        <div style="margin: 30px 0; display: flex; justify-content: center; gap: 20px;">
                            <a href="${accept_url}" style="background-color: #28a745; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">ACEPTAR INVITACIÓN</a>
                            <a href="${reject_url}" style="background-color: #dc3545; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">RECHAZAR</a>
                        </div>
                        <p style="font-size: 12px; color: gray;">Si no conoces este espacio, ignora este mensaje o presiona rechazar.</p>
                    </div>
                `
            });
            console.log("¡Correo de invitación enviado a:", invited_email);
    } catch (error) {
        console.error("Error al enviar la invitación:", error);
        throw error
    }
    }
}

const mailService = new MailService()
export default mailService