const express = require('express');
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const Workflow = require('../models/Workflow');

const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
// For single file (file) and multiple images (images)
const upload = multer({ dest: UPLOAD_DIR });

// Get all workflows
router.get('/', async (req, res) => {
  try {
    const workflows = await Workflow.find().sort({ createdAt: -1 });
    res.json(workflows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workflows', details: err.message });
  }
});

// Get a single workflow
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching workflow', details: err.message });
  }
});

// Create a new workflow (supports file upload to Cloudinary, and batch image upload)
router.post(
  '/',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'images', maxCount: 20 }
  ]),
  async (req, res) => {
    try {
      let fileUrl = null;
      let filePublicId = null;
      let images = [];

      // Handle main file upload
      if (req.files && req.files.file && req.files.file[0]) {
        const result = await cloudinary.uploader.upload(req.files.file[0].path, {
          folder: 'entyre/workflowFiles'
        });
        fileUrl = result.secure_url;
        filePublicId = result.public_id;
        await fs.promises.unlink(req.files.file[0].path);
      }

      // Handle batch image upload
      if (req.files && req.files.images && req.files.images.length > 0) {
        for (const img of req.files.images) {
          const result = await cloudinary.uploader.upload(img.path, {
            folder: 'entyre/workflowImages'
          });
          images.push({
            id: img.originalname, // id自动填充为filename
            url: result.secure_url,
            publicId: result.public_id
          });
          await fs.promises.unlink(img.path);
        }
      }

      // Parse body
      let { name, status, description, nodes, connections, nodePositions } = req.body;

      if (typeof nodes === 'string') {
        try { nodes = JSON.parse(nodes); } catch {}
      }
      if (typeof connections === 'string') {
        try { connections = JSON.parse(connections); } catch {}
      }
      if (typeof nodePositions === 'string') {
        try { nodePositions = JSON.parse(nodePositions); } catch {}
      }

      // Validate name
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Workflow name is required and must be a string' });
      }
      // Validate nodes
      if (nodes && !Array.isArray(nodes)) {
        return res.status(400).json({ error: 'nodes must be an array' });
      }
      // Validate connections
      if (connections && !Array.isArray(connections)) {
        return res.status(400).json({ error: 'connections must be an array' });
      }
      // Validate nodePositions
      if (nodePositions && (typeof nodePositions !== 'object' || Array.isArray(nodePositions))) {
        return res.status(400).json({ error: 'nodePositions must be an object' });
      }

      // Directly store, mongoose schema will validate
      const workflow = new Workflow({
        name,
        status,
        description,
        nodes: nodes || [],
        connections: connections || [],
        nodePositions: nodePositions && Object.keys(nodePositions).length > 0 ? nodePositions : undefined,
        fileUrl,
        filePublicId,
        images
      });

      await workflow.save();
      res.status(201).json(workflow);
    } catch (err) {
      res.status(400).json({ error: 'Failed to create workflow', details: err.message });
    }
  }
);

// Update workflow (supports file upload to Cloudinary, and batch image upload)
router.put(
  '/:id',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'images', maxCount: 20 }
  ]),
  async (req, res) => {
    try {
      let { name, status, description, nodes, connections, nodePositions } = req.body;

      // If form-data, nodes/connections/nodePositions may be strings, need to parse
      if (typeof nodes === 'string') {
        try { nodes = JSON.parse(nodes); } catch {}
      }
      if (typeof connections === 'string') {
        try { connections = JSON.parse(connections); } catch {}
      }
      if (typeof nodePositions === 'string') {
        try { nodePositions = JSON.parse(nodePositions); } catch {}
      }

      // Validate name
      if ('name' in req.body && typeof name !== 'string') {
        return res.status(400).json({ error: 'Workflow name must be a string' });
      }
      // Validate nodes
      if ('nodes' in req.body && nodes && !Array.isArray(nodes)) {
        return res.status(400).json({ error: 'nodes must be an array' });
      }
      // Validate connections
      if ('connections' in req.body && connections && !Array.isArray(connections)) {
        return res.status(400).json({ error: 'connections must be an array' });
      }
      // Validate nodePositions
      if ('nodePositions' in req.body && nodePositions && (typeof nodePositions !== 'object' || Array.isArray(nodePositions))) {
        return res.status(400).json({ error: 'nodePositions must be an object' });
      }

      // Only update fields that are provided
      const updateFields = {};
      if ('name' in req.body) updateFields.name = name;
      if ('status' in req.body) updateFields.status = status;
      if ('description' in req.body) updateFields.description = description;
      if ('nodes' in req.body) updateFields.nodes = nodes;
      if ('connections' in req.body) updateFields.connections = connections;
      if ('nodePositions' in req.body) {
        updateFields.nodePositions = nodePositions && Object.keys(nodePositions).length > 0 ? nodePositions : undefined;
      }

      // File upload logic
      if (req.files && req.files.file && req.files.file[0]) {
        // Find the original workflow and delete the old Cloudinary file
        const workflow = await Workflow.findById(req.params.id);
        if (workflow && workflow.filePublicId) {
          await cloudinary.uploader.destroy(workflow.filePublicId);
        }
        const result = await cloudinary.uploader.upload(req.files.file[0].path, {
          folder: 'entyre/workflowFiles'
        });
        updateFields.fileUrl = result.secure_url;
        updateFields.filePublicId = result.public_id;
        await fs.promises.unlink(req.files.file[0].path);
      }

      // Batch image upload logic (append to images array)
      if (req.files && req.files.images && req.files.images.length > 0) {
        const newImages = [];
        for (const img of req.files.images) {
          const result = await cloudinary.uploader.upload(img.path, {
            folder: 'entyre/workflowImages'
          });
          newImages.push({
            id: img.originalname,
            url: result.secure_url,
            publicId: result.public_id
          });
          await fs.promises.unlink(img.path);
        }
        // Append new images to existing images
        const workflow = await Workflow.findById(req.params.id);
        if (!workflow) {
          return res.status(404).json({ error: 'Workflow not found' });
        }
        updateFields.images = (workflow.images || []).concat(newImages);
      }

      const updated = await Workflow.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true, runValidators: true }
      );
      if (!updated) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: 'Failed to update workflow', details: err.message });
    }
  }
);

// Delete workflow (also deletes Cloudinary file and all images)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Workflow.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    // Delete Cloudinary file
    if (deleted.filePublicId) {
      await cloudinary.uploader.destroy(deleted.filePublicId);
    }
    // Delete all images from Cloudinary
    if (deleted.images && Array.isArray(deleted.images)) {
      for (const img of deleted.images) {
        if (img.publicId) {
          await cloudinary.uploader.destroy(img.publicId);
        }
      }
    }
    res.json({ message: 'Workflow deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete workflow', details: err.message });
  }
});

module.exports = router;