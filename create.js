const { execSync } = require('child_process');
const fs = require('fs');
try {
  console.log('starting...');
  const out = execSync('npx.cmd -y create-expo-app FitBharat --template blank', { stdio: 'pipe' });
  fs.writeFileSync('result.txt', out.toString());
} catch (e) {
  let errStr = e.message + '\n';
  if (e.stdout) errStr += e.stdout.toString() + '\n';
  if (e.stderr) errStr += e.stderr.toString() + '\n';
  fs.writeFileSync('result.txt', errStr);
}
