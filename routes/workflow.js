const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');

// GET all workflows
router.get('/', async (req, res) => {
  try {
    const workflows = await Workflow.find().sort({ createdAt: -1 });
    res.json(workflows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workflows', details: err.message });
  }
});

// GET a single workflow by ID
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching workflow', details: err.message });
  }
});

// CREATE a new workflow
router.post('/', async (req, res) => {
  try {
    // Validate required fields based on the schema in file_context_0
    if (!req.body.name || typeof req.body.name !== 'string') {
      return res.status(400).json({ error: 'Workflow name is required and must be a string.' });
    }
    // nodes and connections are optional, but if present, should be arrays
    if (req.body.nodes && !Array.isArray(req.body.nodes)) {
      return res.status(400).json({ error: 'nodes must be an array.' });
    }
    if (req.body.connections && !Array.isArray(req.body.connections)) {
      return res.status(400).json({ error: 'connections must be an array.' });
    }
    // nodePositions, if present, should be an object (Map)
    if (req.body.nodePositions && (typeof req.body.nodePositions !== 'object' || Array.isArray(req.body.nodePositions))) {
      return res.status(400).json({ error: 'nodePositions must be an object.' });
    }

    // Only allow fields defined in the schema
    const { name, status, description, nodes, connections, nodePositions } = req.body;
    const workflow = new Workflow({
      name,
      status,
      description,
      nodes,
      connections,
      nodePositions
    });
    await workflow.save();
    res.status(201).json(workflow);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create workflow', details: err.message });
  }
});

// UPDATE a workflow by ID
router.put('/:id', async (req, res) => {
  try {
    // Validate fields if present
    if (req.body.name && typeof req.body.name !== 'string') {
      return res.status(400).json({ error: 'Workflow name must be a string.' });
    }
    if (req.body.nodes && !Array.isArray(req.body.nodes)) {
      return res.status(400).json({ error: 'nodes must be an array.' });
    }
    if (req.body.connections && !Array.isArray(req.body.connections)) {
      return res.status(400).json({ error: 'connections must be an array.' });
    }
    if (req.body.nodePositions && (typeof req.body.nodePositions !== 'object' || Array.isArray(req.body.nodePositions))) {
      return res.status(400).json({ error: 'nodePositions must be an object.' });
    }

    // Only allow fields defined in the schema
    const updateFields = {};
    if ('name' in req.body) updateFields.name = req.body.name;
    if ('status' in req.body) updateFields.status = req.body.status;
    if ('description' in req.body) updateFields.description = req.body.description;
    if ('nodes' in req.body) updateFields.nodes = req.body.nodes;
    if ('connections' in req.body) updateFields.connections = req.body.connections;
    if ('nodePositions' in req.body) updateFields.nodePositions = req.body.nodePositions;

    const updated = await Workflow.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Workflow not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update workflow', details: err.message });
  }
});

// DELETE a workflow by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Workflow.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Workflow not found' });
    res.json({ message: 'Workflow deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete workflow', details: err.message });
  }
});

module.exports = router;