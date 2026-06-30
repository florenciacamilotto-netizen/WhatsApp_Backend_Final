import ENVIRONMENT from "./config/environment.config.js";
import connectMongoDB from "./config/mongodb.config.js";
import { MEMBER_WORKSPACE_ROLES } from "./constants/memberRoles.constant.js";
import User from "./models/user.model.js";
import userRepository from "./repositories/user.repository.js";
import workspaceRepository from "./repositories/workspace.repository.js";
import workspaceMemberRepository from "./repositories/workspaceMember.repository.js"

// CREAR USUARIO EN MONGODB //
connectMongoDB()
/* userRepository.create('pepe', 'pepe@gmail.com', 'pepe1234') */


// CAMBIAR INFORMACIÓN DE USUARIO EN MONGODB //
/*
userRepository.updateById(
    '6a35987a3ee411a0f57bb1af', {
        nombre: 'juan'
    }
)
*/

// MOSTRAR INFORMACIÓN DE USUARIO EN CONSOLA //
/*
userRepository.getById ('6a35987a3ee411a0f57bb1af')
.then(
    (resultado) => {
        console.log(resultado)
    }
)
*/

// CREAR EQUIPO DE TRABAJO EN MONGODB //
/*
workspaceRepository.create(
    'Test',
    'Test'
)
*/

// CREAR MIEMBRO EN EQUIPO DE TRABAJO //
/*
workspaceMemberRepository.create(
    '6a35987a3ee411a0f57bb1af',
    '6a384bca0c974d7ca746f83f',
    MEMBER_WORKSPACE_ROLES.ADMIN
)
*/

// MOSTRAR INFORMACIÓN DE MIEMBRO EN CONSOLA //
/*
workspaceMemberRepository.getById('6a3842982f37ef33fc1c7bc4')
.then(
    (resultado) => {
        console.log(resultado)
    }
)
*/

// ACTUALIZAR ROL DE MIEMBRO EN EQUIPO DE TRABAJO //
/*
workspaceMemberRepository.updateById(
    '6a384d67200564fbe94c44c1',
    {
        rol: MEMBER_WORKSPACE_ROLES.OWNER

    }
)
*/

// BORRAR MIEMBRO EN EQUIPO DE TRABAJO //
/*
workspaceMemberRepository.deleteById(
    '6a384d67200564fbe94c44c1'
)
*/

// MOSTRAR INFORMACIÓN DE MIEMBRO EN CONSOLA //
/*
workspaceMemberRepository.getByWorkspaceId('6a384bca0c974d7ca746f83f')
.then(
    (resultado) => {
        console.log(resultado)
    }
)
*/

import express from 'express'
import mailer_transport from "./config/mailer.config.js";
import authController from "./controllers/auth.controller.js";
import authRouter from "./routes/auth.router.js";
import authMiddleware from "./middlewares/auth.middleware.js";
import cors from 'cors'
import errorHandlerMiddleware from './middlewares/error.middleware.js';
import workspaceRouter from "./routes/workspace.router.js";

const app = express()

// TRANSFORMAR JSON A OBJETO DE JS //
app.use(express.json(
    { limit: '50mb' }
))

// HABILITAR CONSULTAS CROSS-ORIGIN //
app.use(cors('https://whats-app-frontend-final.vercel.app/register'))

app.use('/api/auth', authRouter);
app.use('/api/workspace', workspaceRouter)

app.get(
    '/api/profile',
    authMiddleware,
    (request, response) => {
        console.log('Nombre del cliente:',
            request.user.nombre
        )
        return response.json({
            ok: true,
            status: 200,
            message: "Estas autenticado"
        })
    }
)

// REGISTRAR ERROR HANDLER MIDDLEWARE AL FINAL //
app.use(errorHandlerMiddleware)

// SOLO ESCUCHAR EN UN PUERTO CUANDO CORRE LOCAL (NO EN VERCEL) //
if (!process.env.VERCEL) {
    app.listen(
        ENVIRONMENT.PORT,
        () => {
            console.log(`Nuestra app de express se ejecuta correctamente en el puerto ${ENVIRONMENT.PORT}`)
        }
    )
}

// EXPORTAR LA APP PARA QUE VERCEL LA USE COMO FUNCIÓN SERVERLESS //
export default app

/*
app.get(
    '/api/test',
    (request, response) => {
        console.log("Llegó una consulta de Test")
        response.send("Respuesta de prueba")
    }
)

app.post(
    '/api/test',
    (request, response) => {
        console.log('Body de la consulta:', request.body)
        response.send("Respuesta de prueba")
    }
)

app.get(
    '/api/test/:test_id',
    (request, response) => {
        const { test_id } = request.params
        console.log("Se busca el Test con ID " + test_id)
        return response.send('Acá tenés la información')
    }
)

app.get(
    '/api/users',
    (request, response) => {
        const { limit, search_value } = request.query
        console.log(`Se buscan hasta ${limit} usuarios con el termino de busqueda ${search_value}`)
        return response.send('Resultado')
    }
)
*/

// ENVIAR MAIL DESDE POSTMAN //
/*
mailer_transport.sendMail(
    {
        from: "flordelyrics@gmail.com",
        to: "flordelyrics@gmail.com",
        subject: "Prueba desde Node.js",
        html: '<h1>Hola mundo desde Node.js</h1>'
        ,
        attachments: [
            {
                filename: 'test.txt',
                content: 'hola mundo'
            }
        ]
    }
)
*/