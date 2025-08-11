const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const router = express.Router();

const IMAGE_ROOT = path.join(process.cwd(), 'image');
const PY_SRC     = path.join(process.cwd(), 'src');

// Function to check if images exist
function checkImagesExist() {
    const scatterDir = path.join(IMAGE_ROOT, 'scatter_plots');
    const tornadoDir = path.join(IMAGE_ROOT, 'tornado_diagrams');
  
    try {
      if (!fs.existsSync(scatterDir) || !fs.existsSync(tornadoDir)) return false;
  
      const hasPngInSub = (dir) =>
        fs.readdirSync(dir).some((name) => {
          const sub = path.join(dir, name);
          return fs.statSync(sub).isDirectory() &&
                 fs.readdirSync(sub).some((f) => f.toLowerCase().endsWith('.png'));
        });
  
      return hasPngInSub(scatterDir) || hasPngInSub(tornadoDir);
    } catch (e) {
      console.error('Error checking images:', e);
      return false;
    }
  }

// Function to run Python scripts
function runPythonScripts() {
    console.log('No images found, running Python scripts...');
    const scripts = ['Scatter.py', 'Tornado.py'];
    let done = 0;
  
    scripts.forEach((scriptName) => {
      const scriptPath = path.join(PY_SRC, scriptName);
      if (!fs.existsSync(scriptPath)) {
        console.log(`${scriptName} not found`);
        if (++done === scripts.length) console.log('All Python scripts completed');
        return;
      }
  
      const py = process.env.PY || 'python3';
      const child = spawn(py, [scriptName], { cwd: PY_SRC, stdio: 'pipe' });
  
      child.stdout.on('data', (d) => console.log(`${scriptName} output:`, d.toString()));
      child.stderr.on('data', (d) => console.error(`${scriptName} error:`, d.toString()));
      child.on('close', (code) => {
        console.log(`${scriptName} finished with code ${code}`);
        if (++done === scripts.length) console.log('All Python scripts completed');
      });
    });
  }

// API endpoint: Check specific image type
router.get('/check-images', (_req, res) => {
    try {
      if (!fs.existsSync(IMAGE_ROOT)) return res.json({ hasFiles: false });
      const hasFiles = checkImagesExist();
      res.json({ hasFiles });
    } catch (e) {
      console.error('Error checking images:', e);
      res.status(500).json({ error: 'Failed to check images' });
    }
  });

// API endpoint: Run specific Python script
router.get('/run-script', (req, res) => {
    const { script } = req.query;
    if (!script) return res.status(400).json({ error: 'Script name is required' });
  
    const scriptPath = path.join(PY_SRC, script);
    if (!fs.existsSync(scriptPath)) return res.status(404).json({ error: 'Script not found' });
  
    const py = process.env.PY || 'python3';
    const child = spawn(py, [script], { cwd: PY_SRC, stdio: 'pipe' });
  
    let out = '', err = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('close', (code) => {
      if (code === 0) res.json({ success: true, message: `${script} executed successfully`, output: out });
      else res.json({ success: false, message: `${script} failed with code ${code}`, error: err });
    });
    child.on('error', (error) => {
      res.status(500).json({ success: false, message: `Failed to execute ${script}`, error: error.message });
    });
  });
  
  module.exports = { router, checkImagesExist, runPythonScripts };