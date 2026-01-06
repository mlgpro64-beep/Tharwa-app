import { networkInterfaces } from 'os';

function getLocalIPs() {
  const interfaces = networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name];
    if (nets) {
      for (const net of nets) {
        // Skip internal (loopback) and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address);
        }
      }
    }
  }
  
  return ips;
}

const localIPs = getLocalIPs();
const port = process.env.PORT || '5000';

console.log('\n📱 Local IP Addresses for Mobile Access:\n');
if (localIPs.length === 0) {
  console.log('   No local IP addresses found.');
  console.log('   Make sure you are connected to a network.\n');
} else {
  localIPs.forEach(ip => {
    console.log(`   http://${ip}:${port}`);
  });
  console.log('\n💡 Make sure your mobile device is on the same WiFi network.\n');
}













