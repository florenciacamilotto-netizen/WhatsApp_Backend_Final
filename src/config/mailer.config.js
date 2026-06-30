import nodemailer from "nodemailer"
import ENVIRONMENT from "./environment.config.js"

const mailer_transport = nodemailer.createTransport(
    {
        service: 'gmail',
        auth: {
            user: ENVIRONMENT.GMAIL_USERNAME,
            pass: ENVIRONMENT.GMAIL_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    }
)

export default mailer_transport