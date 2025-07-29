const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');

/**
 * 工作流路由
 * 数据存储在MongoDB（通过Mongoose），供Render部署的API使用
 * 参考前端entyre-cms-frontend/src/components/workflow.jsx和模型entyre-backend/models/Workflow.js
 */

// 获取所有工作流
router.get('/', async (req, res) => {
  try {
    const workflows = await Workflow.find().sort({ createdAt: -1 });
    res.json(workflows);
  } catch (err) {
    res.status(500).json({ error: '获取工作流失败', details: err.message });
  }
});

// 获取单个工作流
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: '未找到该工作流' });
    }
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: '获取工作流出错', details: err.message });
  }
});

// 创建新的工作流
router.post('/', async (req, res) => {
  try {
    const { name, status, description, nodes, connections, nodePositions } = req.body;

    // 校验name
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: '工作流名称必填且必须为字符串' });
    }
    // 校验nodes
    if (nodes && !Array.isArray(nodes)) {
      return res.status(400).json({ error: 'nodes 必须为数组' });
    }
    // 校验connections
    if (connections && !Array.isArray(connections)) {
      return res.status(400).json({ error: 'connections 必须为数组' });
    }
    // 校验nodePositions
    if (nodePositions && (typeof nodePositions !== 'object' || Array.isArray(nodePositions))) {
      return res.status(400).json({ error: 'nodePositions 必须为对象' });
    }

    // 直接存储，mongoose schema会自动校验
    const workflow = new Workflow({
      name,
      status,
      description,
      nodes: nodes || [],
      connections: connections || [],
      nodePositions: nodePositions && Object.keys(nodePositions).length > 0 ? nodePositions : undefined
    });

    await workflow.save();
    res.status(201).json(workflow);
  } catch (err) {
    res.status(400).json({ error: '创建工作流失败', details: err.message });
  }
});

// 更新工作流
router.put('/:id', async (req, res) => {
  try {
    const { name, status, description, nodes, connections, nodePositions } = req.body;

    // 校验name
    if ('name' in req.body && typeof name !== 'string') {
      return res.status(400).json({ error: '工作流名称必须为字符串' });
    }
    // 校验nodes
    if ('nodes' in req.body && nodes && !Array.isArray(nodes)) {
      return res.status(400).json({ error: 'nodes 必须为数组' });
    }
    // 校验connections
    if ('connections' in req.body && connections && !Array.isArray(connections)) {
      return res.status(400).json({ error: 'connections 必须为数组' });
    }
    // 校验nodePositions
    if ('nodePositions' in req.body && nodePositions && (typeof nodePositions !== 'object' || Array.isArray(nodePositions))) {
      return res.status(400).json({ error: 'nodePositions 必须为对象' });
    }

    // 只更新有传递的字段
    const updateFields = {};
    if ('name' in req.body) updateFields.name = name;
    if ('status' in req.body) updateFields.status = status;
    if ('description' in req.body) updateFields.description = description;
    if ('nodes' in req.body) updateFields.nodes = nodes;
    if ('connections' in req.body) updateFields.connections = connections;
    if ('nodePositions' in req.body) {
      updateFields.nodePositions = nodePositions && Object.keys(nodePositions).length > 0 ? nodePositions : undefined;
    }

    const updated = await Workflow.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: '未找到该工作流' });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: '更新工作流失败', details: err.message });
  }
});

// 删除工作流
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Workflow.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: '未找到该工作流' });
    }
    res.json({ message: '工作流已删除' });
  } catch (err) {
    res.status(500).json({ error: '删除工作流失败', details: err.message });
  }
});

module.exports = router;

/**
 * 说明：
 * 1. 本路由不涉及fs文件操作，所有数据均存储在MongoDB（通过Mongoose模型）。
 * 2. Render部署时，API直接通过MongoDB存取数据，不需要本地文件存储（fs）。
 * 3. 结构和校验严格参考entyre-cms-frontend/src/components/workflow.jsx和entyre-backend/models/Workflow.js。
 */