// ✅ TASK: Verify if Node.js is included in the packaged Electron app
// This script should run inside the main process or preload script

// Check if Node.js core modules are accessible at runtime
try {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');
  const nodeVersion = process.version;

  console.log('✅ Node.js is bundled with the app.');
  console.log(`Running Node version: ${nodeVersion}`);
  console.log(`Platform: ${os.platform()}`);
  console.log(`Architecture: ${os.arch()}`);
  console.log(`App path: ${process.cwd()}`);
  console.log(`Filesystem and OS modules are available.`);
  
  // Test file system access
  const testPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(testPath)) {
    console.log('✅ File system access confirmed');
  }
  
} catch (err) {
  console.error('❌ Node.js is NOT bundled with this Electron build.');
  console.error('This app may rely on a system-wide Node installation.');
  console.error('Error details:', err.message);
}
