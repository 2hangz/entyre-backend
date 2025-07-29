const mongoose = require('../db/mongoose');

/*
  下面是 pathwaySchema 的定义，用于描述一个“路径”对象的数据结构。
  其中 nodeData 是一个数组，每个元素代表一个节点，包含以下字段：

  - id: 节点的唯一标识符，类型为字符串，必填，并自动去除首尾空格。
  - icon: 节点对应的图标路径，类型为字符串，必填，并自动去除首尾空格。
  - type: 节点的类型，只能是 'backgroundImage' 或 'nodeImage' 之一，必填。
  - label: 节点的显示名称，类型为字符串，必填，并自动去除首尾空格。
  - detail: 节点的详细描述，类型为字符串，必填（注意原代码写成了 require，应该是 required）。
*/

const pathwaySchema = new mongoose.Schema({
    nodeData: [
        {
            id: {
                type: String,
                required: true,
                trim: true
            },
            icon: {
                type: String,
                required: true,
                trim: true
            },
            type: {
                type: String,
                enum: ['backgroundImage', 'nodeImage'],
                required: true
            },
            label: {
                type: String,
                required: true,
                trim: true
            },
            detail: {
                type: String,
                required: true
            }
        }
    ],
    edgeStyles: [
        {
            source: { type: String, required: true, trim: true },
            target: { type: String, required: true, trim: true },
            styleKey: { 
                type: String, 
                enum: ['default', 'redDashed', 'redSolid', 'grayDashed', 'blueBold'], 
                default: 'default' 
            },
            color: { type: String },
            strokeWidth: { type: Number },
            strokeDasharray: { type: String }
        }
    ],
})

// Define the Workflow schema to match the frontend data structure

const workflowSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true }, // pathway name
    status: { type: String, required: false, trim: true }, // e.g., "researching"
    description: { type: String, required: false, trim: true },
    nodes: [{ type: String, required: true }], // array of node ids
    connections: [
        {
            from: { type: String, required: true, trim: true },
            to: { type: String, required: true, trim: true },
            sourceHandle: { type: String, required: false, trim: true },
            targetHandle: { type: String, required: false, trim: true },
            edgeStyle: { type: String, required: false, enum: ['default', 'redDashed', 'redSolid', 'grayDashed', 'blueBold'] },
            edgeType: { type: String, required: false, trim: true }
        }
    ],
    nodePositions: {
        type: Map,
        of: new mongoose.Schema({
            x: { type: Number, required: true },
            y: { type: Number, required: true }
        }, { _id: false }),
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Workflow', workflowSchema);