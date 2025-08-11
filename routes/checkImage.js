const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const router = express.Router();

// Function to check if images exist
function checkImagesExist() {
  const imageDir = path.join(__dirname, 'image');
  const scatterDir = path.join(imageDir, 'scatter_plots');
  const tornadoDir = path.join(imageDir, 'tornado_diagrams');
  
  try {
    // Check if image directories exist
    if (!fs.existsSync(scatterDir) || !fs.existsSync(tornadoDir)) {
      return false;
    }
    
    // Check if there are any image files in the directories
    const scatterFiles = fs.readdirSync(scatterDir);
    const tornadoFiles = fs.readdirSync(tornadoDir);
    
    // Check if any subdirectories contain PNG files
    const hasScatterImages = scatterFiles.some(file => {
      const subDir = path.join(scatterDir, file);
      return fs.statSync(subDir).isDirectory() && 
             fs.readdirSync(subDir).some(f => f.endsWith('.png'));
    });
    
    const hasTornadoImages = tornadoFiles.some(file => {
      const subDir = path.join(tornadoDir, file);
      return fs.statSync(subDir).isDirectory() && 
             fs.readdirSync(subDir).some(f => f.endsWith('.png'));
    });
    
    return hasScatterImages || hasTornadoImages;
  } catch (error) {
    console.error('Error checking images:', error);
    return false;
  }
}

// Function to run Python scripts
function runPythonScripts() {
  console.log('No images found, running Python scripts...');
  
  const scripts = ['Scatter.py', 'Tornado.py'];
  let completedScripts = 0;
  
  scripts.forEach(scriptName => {
    const scriptPath = path.join(__dirname, 'src', scriptName);
    
    if (fs.existsSync(scriptPath)) {
      console.log(`Running ${scriptName}...`);
      
      const pythonProcess = spawn('python', [scriptPath], {
        cwd: path.join(__dirname, 'src'),
        stdio: 'pipe'
      });
      
      pythonProcess.stdout.on('data', (data) => {
        console.log(`${scriptName} output:`, data.toString());
      });
      
      pythonProcess.stderr.on('data', (data) => {
        console.error(`${scriptName} error:`, data.toString());
      });
      
      pythonProcess.on('close', (code) => {
        console.log(`${scriptName} finished with code ${code}`);
        completedScripts++;
        
        if (completedScripts === scripts.length) {
          console.log('All Python scripts completed');
        }
      });
    } else {
      console.log(`${scriptName} not found`);
      completedScripts++;
    }
  });
}

// API endpoint: Check specific image type
router.get('/check-images', (req, res) => {
  const imageDir = path.join(__dirname, 'image');
  
  try {
    // Check if image directory exists
    if (!fs.existsSync(imageDir)) {
      return res.json({ hasFiles: false });
    }
    
    // Check if image directory is empty
    const files = fs.readdirSync(imageDir);
    
    if (files.length === 0) {
      return res.json({ hasFiles: false });
    }
    
    // Check if there are any PNG files in subdirectories
    const hasFiles = checkImagesExist();
    
    res.json({ hasFiles });
  } catch (error) {
    console.error('Error checking images:', error);
    res.status(500).json({ error: 'Failed to check images' });
  }
});

// API endpoint: Run specific Python script
router.get('/run-script', (req, res) => {
  const { script } = req.query;
  
  if (!script) {
    return res.status(400).json({ error: 'Script name is required' });
  }
  
  const scriptPath = path.join(__dirname, 'src', script);
  
  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ error: 'Script not found' });
  }
  
  console.log(`Running ${script}...`);
  
  const pythonProcess = spawn('python', [script], {
    cwd: path.join(__dirname, 'src'),
    stdio: 'pipe'
  });
  
  let output = '';
  let errorOutput = '';
  
  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  pythonProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });
  
  pythonProcess.on('close', (code) => {
    if (code === 0) {
      res.json({ 
        success: true, 
        message: `${script} executed successfully`,
        output 
      });
    } else {
      res.json({ 
        success: false, 
        message: `${script} failed with code ${code}`,
        error: errorOutput 
      });
    }
  });
  
  pythonProcess.on('error', (error) => {
    res.status(500).json({ 
      success: false, 
      message: `Failed to execute ${script}`,
      error: error.message 
    });
  });
});

// Export utility functions for use in server.js
module.exports = {
  router,
  checkImagesExist,
  runPythonScripts
};