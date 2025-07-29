const mongoose = require('../db/mongoose');

const nodeSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    icon: { type: String, trim: true },
    type: { type: String, trim: true },
    label: { type: String, trim: true },
    detail: { type: String, trim: true },
    selectable: { type: Boolean }
}, { _id: false });

const connectionSchema = new mongoose.Schema({
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    sourceHandle: { type: String, trim: true },
    targetHandle: { type: String, trim: true },
    edgeStyle: { type: String, enum: ['default', 'redDashed', 'redSolid', 'grayDashed', 'blueBold'] },
    edgeType: { type: String, trim: true }
}, { _id: false });

const nodePositionSchema = new mongoose.Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true }
}, { _id: false });

const workflowSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    status: { type: String, trim: true },
    description: { type: String, trim: true },
    nodes: { type: [nodeSchema], default: [] },
    connections: { type: [connectionSchema], default: [] },
    nodePositions: {
        type: Map,
        of: nodePositionSchema
    },
    fileUrl: { type: String, trim: true },
    filePublicId: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Workflow', workflowSchema);