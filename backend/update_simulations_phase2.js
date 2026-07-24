import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const updates = [
  {
    msgId: '3ea4b79d-1d83-4829-9b25-7938e801ad45',
    title: 'The CSS Table X-Ray Machine',
    text: 'Here is the interactive lab for: The CSS Table X-Ray Machine',
    html: `
<style>
  body { background: #0f172a; color: #f8fafc; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px;}
  .box { background: #1e293b; border: 1px solid #334155; padding: 30px; border-radius: 12px; width: 100%; max-width: 600px; text-align:center;}
  table { border-collapse: collapse; margin: 20px auto; transition: 0.3s; width: 100%; }
  th, td { border: 2px solid #3b82f6; padding: 15px; text-align: center; position: relative; transition: 0.3s; }
  .xray th, .xray td { border-color: #f43f5e; background: rgba(244, 63, 94, 0.1); color: #f43f5e; }
  .xray th::after, .xray td::after { content: attr(style); position: absolute; bottom: 2px; left: 0; width: 100%; font-size: 8px; color: #94a3b8; }
  button { padding: 10px 20px; background: #3b82f6; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: bold; }
</style>
<div class="box">
  <h2 style="color:#38bdf8; margin-top:0;">CSS Table X-Ray</h2>
  <div style="font-size:12px; color:#94a3b8;">Inspect the Box Model and Borders of a standard HTML Table.</div>
  
  <table id="tbl">
    <tr><th style="padding:15px;">Header 1</th><th style="padding:15px;">Header 2</th></tr>
    <tr><td style="padding:15px;">Row 1, Cell 1</td><td style="padding:15px;">Row 1, Cell 2</td></tr>
  </table>
  
  <button onclick="toggleXray()">Toggle X-Ray Mode</button>
</div>
<script>
  let on = false;
  function toggleXray() {
    on = !on;
    document.getElementById('tbl').className = on ? 'xray' : '';
  }
</script>
    `
  },
  {
    msgId: '00c108ae-ab83-4345-b863-ffa29775b564',
    title: 'Flexbox Froggy: Axis Explorer',
    text: 'Here is the interactive lab for: Flexbox Froggy: Axis Explorer',
    html: `
<style>
  body { background: #0f172a; color: #f8fafc; font-family: monospace; padding: 20px; }
  .container { background: #1e293b; border: 1px solid #334155; padding: 20px; border-radius: 12px; max-width: 600px; margin: auto; }
  .canvas { background: #334155; height: 150px; border-radius: 8px; margin: 20px 0; display: flex; transition: 0.3s; }
  .item { width: 40px; height: 40px; background: #10b981; border-radius: 8px; display: flex; align-items:center; justify-content:center; font-weight:bold; color:#0f172a; margin: 2px; }
  select { background: #0f172a; color: #38bdf8; border: 1px solid #38bdf8; padding: 5px; border-radius: 4px; margin-bottom: 10px; }
</style>
<div class="container">
  <h2 style="color:#10b981; text-align:center; margin-top:0;">Flexbox Axis Explorer</h2>
  <div style="display:flex; justify-content:space-around; align-items:center;">
    <div><label>justify-content: </label><select id="jc" onchange="upd()"><option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option><option value="space-between">space-between</option><option value="space-around">space-around</option></select></div>
    <div><label>align-items: </label><select id="ai" onchange="upd()"><option value="stretch">stretch</option><option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option></select></div>
  </div>
  <div class="canvas" id="cv"><div class="item">1</div><div class="item">2</div><div class="item">3</div></div>
</div>
<script>
  function upd() {
    document.getElementById('cv').style.justifyContent = document.getElementById('jc').value;
    document.getElementById('cv').style.alignItems = document.getElementById('ai').value;
  }
  upd();
</script>
    `
  },
  {
    msgId: 'ae18b623-e8ec-40b3-b1d2-b7ddb84a273a',
    title: 'The CSS Table X-Ray Machine (Advanced)',
    text: 'Here is the interactive lab for: The CSS Table X-Ray Machine (Advanced)',
    html: `
<style>
  body { background: #0f172a; color: #f8fafc; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px;}
  .box { background: #1e293b; border: 1px solid #334155; padding: 30px; border-radius: 12px; width: 100%; max-width: 600px; text-align:center;}
  .demo { display: grid; gap: 20px; grid-template-columns: 1fr 1fr; margin-top: 20px;}
  .el { background: #334155; padding: 20px; border-radius: 8px; border: 4px solid #10b981; }
  .box-model { outline: 4px dashed #f43f5e; box-shadow: 0 0 0 10px rgba(56, 189, 248, 0.2); margin: 20px; }
  .legend { font-size: 10px; display:flex; justify-content:center; gap: 10px; margin-top:20px;}
</style>
<div class="box">
  <h2 style="color:#f43f5e; margin-top:0;">Box Model X-Ray</h2>
  <div class="demo">
    <div>
      <h3>Standard</h3>
      <div class="el">Content</div>
    </div>
    <div>
      <h3>X-Ray</h3>
      <div class="el box-model">Content</div>
    </div>
  </div>
  <div class="legend">
    <span style="color:#f43f5e">Dashed = Border</span> | <span style="color:#38bdf8">Glow = Margin</span> | <span style="color:#10b981">Solid = Padding</span>
  </div>
</div>
    `
  },
  {
    msgId: '4582abe6-aa05-47d7-89f6-4bdd576109c1',
    title: 'CSS Grid Garden Architect',
    text: 'Here is the interactive lab for: Grid Garden Architect',
    html: `
<style>
  body { background: #0f172a; color: #f8fafc; font-family: monospace; padding: 20px; }
  .container { background: #1e293b; padding: 20px; border-radius: 12px; max-width: 600px; margin: auto; }
  .grid { display: grid; background: #334155; height: 200px; border-radius: 8px; gap: 5px; padding: 5px; margin: 20px 0; transition: 0.3s;}
  .itm { background: #f59e0b; border-radius: 4px; display: flex; align-items:center; justify-content:center; color:#0f172a; font-weight:bold; }
  input { background: #0f172a; color: #f59e0b; border: 1px solid #f59e0b; padding: 5px; border-radius: 4px; margin-bottom: 10px; width: 100%;}
</style>
<div class="container">
  <h2 style="color:#f59e0b; text-align:center; margin-top:0;">Grid Architect</h2>
  <label>grid-template-columns:</label>
  <input type="text" id="gtc" value="1fr 1fr 1fr" oninput="upd()">
  <label>grid-template-rows:</label>
  <input type="text" id="gtr" value="1fr 1fr" oninput="upd()">
  
  <div class="grid" id="grd">
    <div class="itm">1</div><div class="itm">2</div><div class="itm">3</div><div class="itm">4</div><div class="itm">5</div><div class="itm">6</div>
  </div>
</div>
<script>
  function upd() {
    document.getElementById('grd').style.gridTemplateColumns = document.getElementById('gtc').value;
    document.getElementById('grd').style.gridTemplateRows = document.getElementById('gtr').value;
  }
  upd();
</script>
    `
  },
  {
    msgId: 'd68f1756-6f50-48a0-95bc-95f9718d4585',
    title: 'The CSS Payment Gateway Factory',
    text: 'Here is the interactive lab for: The Payment Gateway Factory',
    html: `
<style>
  body { background: #0f172a; color: #f8fafc; font-family: monospace; display:flex; justify-content:center; align-items:center; height:100vh;}
  .card { background: linear-gradient(135deg, #3b82f6, #8b5cf6); width: 320px; height: 200px; border-radius: 16px; padding: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.5); position:relative; overflow:hidden;}
  .card-chip { width: 40px; height: 30px; background: #fbbf24; border-radius: 6px; margin-bottom: 30px;}
  .card-num { font-size: 22px; letter-spacing: 4px; margin-bottom: 15px;}
  .card-name { font-size: 14px; text-transform: uppercase;}
  .decor { position:absolute; border-radius:50%; background:rgba(255,255,255,0.1); }
</style>
<div>
  <h2 style="text-align:center; color:#38bdf8;">CSS Payment Card</h2>
  <div class="card">
    <div class="decor" style="width:200px; height:200px; top:-50px; right:-50px;"></div>
    <div class="decor" style="width:100px; height:100px; bottom:-20px; right:40px;"></div>
    <div class="card-chip"></div>
    <div class="card-num">4123 5678 9012 3456</div>
    <div class="card-name">John Doe</div>
  </div>
</div>
    `
  },
  {
    msgId: 'f6b0f6ca-29d7-401a-817e-ca0d1c76be76',
    title: 'CSS Positioning: Static vs Dynamic',
    text: 'Here is the interactive lab for: Static vs Dynamic Dispatch Race Track',
    html: `
<style>
  body { background: #0f172a; color: #f8fafc; font-family: monospace; padding:20px; }
  .box { border: 1px dashed #475569; padding: 20px; height: 150px; position: relative; margin-bottom: 20px;}
  .item { width: 50px; height: 50px; background: #f43f5e; color: white; display:flex; align-items:center; justify-content:center; border-radius:8px; font-weight:bold;}
  select { background: #1e293b; color: white; border: 1px solid #334155; padding: 5px;}
</style>
<div style="max-width: 600px; margin: auto;">
  <h2>Positioning Lab</h2>
  <label>Set position: </label>
  <select id="pos" onchange="upd()">
    <option value="static">static</option>
    <option value="relative">relative</option>
    <option value="absolute">absolute</option>
  </select>
  <div style="margin-top:10px;">
    Top: <input type="range" id="t" min="-20" max="50" value="0" oninput="upd()">
    Left: <input type="range" id="l" min="-20" max="100" value="0" oninput="upd()">
  </div>
  
  <div class="box">
    <div class="item" style="background:#3b82f6; position:static;">Ref</div>
    <div class="item" id="tgt" style="position:static; top:0; left:0;">Tgt</div>
  </div>
</div>
<script>
  function upd() {
    let t = document.getElementById('tgt');
    t.style.position = document.getElementById('pos').value;
    t.style.top = document.getElementById('t').value + 'px';
    t.style.left = document.getElementById('l').value + 'px';
  }
</script>
    `
  },
  {
    msgId: 'b0c05833-259f-4f33-b686-4b7cc4d95381',
    title: 'CSS Grid Garden',
    text: 'Here is the interactive lab for: CSS Grid Garden',
    html: `
<style>
  body { background: #0f172a; color: #f8fafc; font-family: monospace; display:flex; justify-content:center; align-items:center; height:100vh;}
  .garden { display: grid; grid-template-columns: repeat(5, 50px); grid-template-rows: repeat(5, 50px); gap: 5px; background: #84cc16; padding: 10px; border-radius: 12px;}
  .soil { background: #65a30d; border-radius: 4px; }
  .water { background: #0ea5e9; grid-column: 2 / 5; grid-row: 2 / 5; border-radius: 8px; opacity: 0.8;}
</style>
<div>
  <h2 style="color:#84cc16; text-align:center;">Grid Garden</h2>
  <div class="garden">
    <div class="soil"></div><div class="soil"></div><div class="soil"></div><div class="soil"></div><div class="soil"></div>
    <div class="soil"></div><div class="soil"></div><div class="soil"></div><div class="soil"></div><div class="soil"></div>
    <div class="soil"></div><div class="soil"></div><div class="soil"></div><div class="soil"></div><div class="soil"></div>
    <div class="soil"></div><div class="soil"></div><div class="soil"></div><div class="soil"></div><div class="soil"></div>
    <div class="soil"></div><div class="soil"></div><div class="soil"></div><div class="soil"></div><div class="soil"></div>
    <div class="water"></div>
  </div>
</div>
    `
  },
  {
    msgId: 'b77dac92-95dc-4871-9693-9b0841142045',
    title: 'CSS Animation Visualizer',
    text: 'Here is the interactive lab for: CSS Animation Visualizer',
    html: `
<style>
  body { background: #0f172a; color: #f8fafc; font-family: monospace; padding: 20px;}
  .track { width: 100%; height: 60px; background: #1e293b; border-radius: 30px; position: relative; margin: 40px 0; border: 2px solid #334155;}
  .ball { width: 56px; height: 56px; background: #ec4899; border-radius: 50%; position: absolute; top: 0; left: 0; animation: move 2s infinite alternate;}
  @keyframes move {
    0% { left: 0; transform: scale(1); }
    100% { left: calc(100% - 56px); transform: scale(1.2) rotate(360deg); background: #3b82f6;}
  }
  select { padding: 5px; background: #334155; color: white; border: none; border-radius: 4px; }
</style>
<div style="max-width: 600px; margin: auto; text-align:center;">
  <h2 style="color:#ec4899;">Animation Lab</h2>
  <label>Timing Function:</label>
  <select id="tf" onchange="upd()">
    <option value="ease">ease</option>
    <option value="linear">linear</option>
    <option value="ease-in-out">ease-in-out</option>
    <option value="steps(5)">steps(5)</option>
  </select>
  <div class="track">
    <div class="ball" id="b"></div>
  </div>
</div>
<script>
  function upd() {
    document.getElementById('b').style.animationTimingFunction = document.getElementById('tf').value;
  }
</script>
    `
  }
];

async function run() {
    console.log("Starting DB Update Phase 2 (CSS)...");
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
    console.log("Phase 2 Done.");
}

run().catch(console.error).finally(() => prisma.$disconnect());
