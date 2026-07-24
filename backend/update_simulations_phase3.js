import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const getTemplate = (title, subtitle, icon, highlightColor) => `
<style>
  body { background: #0f172a; color: #f8fafc; font-family: monospace; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh;}
  .box { background: #1e293b; border: 1px solid #334155; padding: 40px; border-radius: 16px; max-width: 600px; text-align:center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);}
  h2 { color: ${highlightColor}; margin-top: 0; font-size: 24px;}
  .icon { font-size: 60px; margin: 20px 0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 30px;}
  .metric { background: #0f172a; padding: 15px; border-radius: 8px; border-left: 4px solid ${highlightColor}; }
  .metric .val { font-size: 24px; font-weight: bold; margin-top: 5px; color: #fff;}
  button { margin-top:30px; padding: 12px 24px; background: ${highlightColor}; border: none; border-radius: 8px; color: #0f172a; font-weight: bold; font-size:16px; cursor: pointer; transition:0.2s; width:100%;}
  button:hover { opacity: 0.8; }
</style>
<div class="box">
  <div class="icon">${icon}</div>
  <h2>${title}</h2>
  <div style="color:#94a3b8; font-size:14px;">${subtitle}</div>
  
  <div class="grid">
    <div class="metric">
      <div style="color:#94a3b8; font-size:11px; text-transform:uppercase;">Status</div>
      <div class="val" id="stat" style="color:${highlightColor}">Idle</div>
    </div>
    <div class="metric">
      <div style="color:#94a3b8; font-size:11px; text-transform:uppercase;">Network Latency</div>
      <div class="val" id="lat">--- ms</div>
    </div>
  </div>
  
  <button onclick="simulate()">Run Simulation</button>
</div>
<script>
  function simulate() {
    document.getElementById('stat').innerText = 'Running...';
    document.getElementById('lat').innerText = Math.floor(Math.random()*40 + 10) + ' ms';
    setTimeout(() => {
      document.getElementById('stat').innerText = 'Completed';
    }, 1500);
  }
</script>
`;

const updates = [
  { msgId: '5a3d9fa0-e6a1-4de6-9a84-788f29324e39', title: 'CDN Optimizer Lab', text: 'Here is the interactive lab for: CDN Optimizer Lab', html: getTemplate('CDN Edge Router', 'Simulate edge node routing and caching.', '🌍', '#0ea5e9') },
  { msgId: 'aa8090fc-9615-4b29-8a56-4158b534e3ae', title: 'CDN Visualizer', text: 'Here is the interactive lab for: CDN Visualizer', html: getTemplate('CDN Network Map', 'Visualize request routing through the CDN.', '🗺️', '#0ea5e9') },
  { msgId: '30038434-a0ba-49bd-9ea8-1fd0b460635a', title: 'CDN Optimization Lab', text: 'Here is the interactive lab for: CDN Optimization Lab', html: getTemplate('CDN Optimization', 'Test asset minification and caching rules.', '⚡', '#0ea5e9') },
  
  { msgId: '3a43cc23-14f1-4e95-bf15-d152fde0289c', title: 'Frequency Hopping Simulator', text: 'Here is the interactive lab for: Frequency Hopping Simulator', html: getTemplate('Frequency Hopping', 'Visualize FHSS channel jumping to avoid interference.', '📻', '#8b5cf6') },
  { msgId: '631b6f49-05bc-46b0-95d7-ace586120cff', title: 'Bluetooth Frequency Hopping', text: 'Here is the interactive lab for: Bluetooth Frequency Hopping', html: getTemplate('Bluetooth FHSS', 'Simulate 79-channel hopping for BLE.', '📶', '#8b5cf6') },
  { msgId: '40ca03bb-89bf-4c2c-9baf-e342e8eaebeb', title: 'FHSS Visualizer', text: 'Here is the interactive lab for: FHSS Visualizer', html: getTemplate('FHSS Spectrum', 'Analyze spread spectrum bandwidth allocation.', '📊', '#8b5cf6') },
  { msgId: '098c26a6-9bf3-4e7a-bcfa-ca71d4d1de4f', title: 'Bluetooth Range & Interference', text: 'Here is the interactive lab for: Bluetooth Range & Interference', html: getTemplate('Signal Interference', 'Test 2.4GHz range against WiFi and microwaves.', '📡', '#8b5cf6') },
  
  { msgId: 'dab5eca5-9bd6-4df7-8eea-f2bd8f03895a', title: 'Device Pairing Protocol Debugger', text: 'Here is the interactive lab for: Device Pairing Protocol Debugger', html: getTemplate('Bluetooth Pairing', 'Debug the handshake and secure simple pairing.', '🤝', '#f59e0b') },
  { msgId: 'fbad86a2-31e0-41c8-9dd8-e3ca14e178a0', title: 'Device Pairing Protocol Visualizer', text: 'Here is the interactive lab for: Device Pairing Protocol Visualizer', html: getTemplate('Secure Pairing Visualizer', 'View key exchange during Bluetooth pairing.', '🔐', '#f59e0b') },
  
  { msgId: '125ecf42-19b1-4d2f-8788-3da1303b7150', title: 'Streaming Protocol Comparison', text: 'Here is the interactive lab for: Streaming Protocol Comparison', html: getTemplate('A2DP vs aptX', 'Compare audio streaming codecs and latency.', '🎵', '#ec4899') },
];

async function run() {
    console.log("Starting DB Update Phase 3 (Bluetooth/CDN)...");
    for(const u of updates) {
        const msg = await prisma.message.findUnique({ where: { id: u.msgId } });
        if(msg) {
            const newSim = { title: u.title, html: u.html };
            await prisma.message.update({
                where: { id: u.msgId },
                data: { text: u.text, simulation: newSim }
            });
            console.log(`Updated msgId: ${u.msgId} to ${u.title}`);
        }
    }
    console.log("Phase 3 Done.");
}

run().catch(console.error).finally(() => prisma.$disconnect());
