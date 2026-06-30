import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true
        },
        fecha_creacion: {
            type: Date,
            required: true,
            default: Date.now(),
        },
        descripcion: {
            type: String,
            required: false
        },
        estado: {
            type: Boolean,
            required: true,
            default: true
        }
    }
)

export const WORKSPACE_COLLECTION_NAME = "Workspace"
const Workspace = mongoose.model(WORKSPACE_COLLECTION_NAME, workspaceSchema);

export default Workspace