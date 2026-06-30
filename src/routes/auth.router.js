import express from 'express'
import authController from '../controllers/auth.controller.js'

const authRouter = express.Router()

authRouter.post(
    '/register',
    authController.register
)

authRouter.get(
    '/verify-email',
    authController.verifyEmail
)

authRouter.post(
    '/login',
    authController.login
)

authRouter.post(
    '/reset-password-request',
    authController.resetPasswordRequest
);

authRouter.post(
    '/reset-password',
    authController.resetPasswordConfirm
)

export default authRouter