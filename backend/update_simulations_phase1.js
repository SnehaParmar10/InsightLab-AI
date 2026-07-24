import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const updates = [
  {
    msgId: 'b1c8b3f7-9fcb-4200-a432-6539e4736b20',
    title: 'Sliding Window Simulator: Fixed vs Dynamic',
    text: 'Here is the interactive lab for: Sliding Window Simulator: Fixed vs Dynamic',
    html: `
<style>
  body { background: #0f172a; color: #e2e8f0; font-family: monospace; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
  .box { border: 1px solid #1e293b; background: #18181b; padding: 30px; border-radius: 8px; width: 100%; max-width: 600px; text-align: center; }
  .array-container { display: flex; gap: 8px; justify-content: center; margin: 30px 0; position: relative; }
  .arr-item { width: 40px; height: 40px; border-radius: 6px; background: #334155; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; transition: all 0.3s ease; border: 2px solid transparent; }
  .window { position: absolute; height: 48px; border: 3px solid #10b981; border-radius: 8px; top: -4px; transition: all 0.3s ease; pointer-events: none; background: rgba(16, 185, 129, 0.1); }
  .controls { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
  button { background: #1e293b; color: white; border: 1px solid #334155; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: 0.2s; }
  button:hover:not(:disabled) { background: #334155; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .stats { color: #10b981; font-weight: bold; font-size: 20px; margin-top: 15px; }
  .desc { color: #94a3b8; font-size: 13px; margin-bottom: 20px; }
</style>
<div class="box">
  <h2 style="margin-top:0; color: #10b981;">Sliding Window Visualizer</h2>
  <div class="desc">Find the maximum sum of a subarray of size K=3.</div>
  
  <div class="array-container" id="arr-c">
    <div class="window" id="win"></div>
  </div>
  
  <div class="stats">Current Sum: <span id="csum">0</span> | Max Sum: <span id="msum">0</span></div>
  
  <div class="controls">
    <button id="btnPrev" disabled>Move Left</button>
    <button id="btnNext">Move Right</button>
  </div>
</div>
<script>
  const arr = [2, 1, 5, 1, 3, 2];
  const k = 3;
  let idx = 0;
  let maxSum = 0;
  
  const c = document.getElementById('arr-c');
  const w = document.getElementById('win');
  const sumEl = document.getElementById('csum');
  const maxEl = document.getElementById('msum');
  const bp = document.getElementById('btnPrev');
  const bn = document.getElementById('btnNext');
  
  arr.forEach((num, i) => {
    let el = document.createElement('div');
    el.className = 'arr-item';
    el.innerText = num;
    el.id = 'i'+i;
    c.appendChild(el);
  });
  
  function update() {
    let sum = 0;
    for(let i=0; i<k; i++) sum += arr[idx+i];
    maxSum = Math.max(maxSum, sum);
    sumEl.innerText = sum;
    maxEl.innerText = maxSum;
    
    // Position window
    let offset = idx * 48; // 40px + 8px gap
    w.style.width = ((40 * k) + (8 * (k-1)) + 8) + 'px';
    w.style.left = (offset - 4) + 'px'; // adjust for padding
    
    // highlight items
    document.querySelectorAll('.arr-item').forEach((el, i) => {
      if(i >= idx && i < idx+k) {
        el.style.background = '#059669';
        el.style.color = '#fff';
      } else {
        el.style.background = '#334155';
        el.style.color = '#94a3b8';
      }
    });
    
    bp.disabled = idx === 0;
    bn.disabled = idx === arr.length - k;
  }
  
  bp.onclick = () => { if(idx > 0) { idx--; update(); } };
  bn.onclick = () => { if(idx < arr.length - k) { idx++; update(); } };
  
  // init layout wait
  setTimeout(() => {
    let first = document.getElementById('i0');
    w.style.left = (first.offsetLeft - 4) + 'px';
    update();
  }, 100);
</script>
    `
  },
  {
    msgId: '8228bc06-4c89-4578-b87b-ea0ed57aa5f9',
    title: 'Binary Search Variants Explorer',
    text: 'Here is the interactive lab for: Binary Search Variants Explorer',
    html: `
<style>
  body { background: #0f172a; color: #e2e8f0; font-family: monospace; padding: 20px; text-align:center; height: 100vh; overflow:hidden;}
  .box { max-width: 700px; margin: auto; background: #1e293b; padding: 25px; border-radius: 12px; border: 1px solid #334155; }
  .arr { display: flex; gap: 6px; justify-content: center; margin: 40px 0; position: relative; }
  .item { width: 35px; height: 40px; border-radius: 4px; background: #334155; display: flex; align-items: center; justify-content: center; transition: 0.3s; position: relative; }
  .ptr { position: absolute; font-size: 11px; font-weight: bold; bottom: -22px; width: 100%; text-align: center; transition: 0.3s;}
  .ptr.l { color: #3b82f6; }
  .ptr.r { color: #ef4444; }
  .ptr.m { color: #10b981; top: -22px; }
  button { margin: 5px; padding: 8px 15px; border-radius: 6px; border:none; background: #3b82f6; color:white; cursor:pointer; font-weight:bold; }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  .log { margin-top: 20px; font-size: 12px; color: #94a3b8; height: 80px; overflow-y: auto; background: #0f172a; padding: 10px; border-radius: 6px; text-align: left; }
</style>
<div class="box">
  <h2 style="color:#3b82f6; margin-top:0;">Binary Search: Find 42</h2>
  
  <div class="arr" id="arr"></div>
  
  <div>
    <button id="s" onclick="step()">Next Step</button>
    <button onclick="reset()" style="background:#ef4444">Reset</button>
  </div>
  
  <div class="log" id="log"></div>
</div>
<script>
  const data = [2, 5, 8, 12, 16, 23, 38, 42, 56, 72, 91];
  const target = 42;
  let L = 0, R = data.length - 1, M = -1, state = 'calc';
  const c = document.getElementById('arr');
  const l = document.getElementById('log');
  
  function init() {
    c.innerHTML = '';
    data.forEach((v, i) => {
      let d = document.createElement('div');
      d.className = 'item'; d.id = 'i'+i; d.innerText = v;
      let pL = document.createElement('div'); pL.className = 'ptr l'; pL.id = 'pl'+i;
      let pR = document.createElement('div'); pR.className = 'ptr r'; pR.id = 'pr'+i;
      let pM = document.createElement('div'); pM.className = 'ptr m'; pM.id = 'pm'+i;
      d.appendChild(pL); d.appendChild(pR); d.appendChild(pM);
      c.appendChild(d);
    });
  }
  
  function log(msg) { l.innerHTML += \`<div>\${msg}</div>\`; l.scrollTop = l.scrollHeight; }
  
  function render() {
    document.querySelectorAll('.ptr').forEach(e => e.innerText = '');
    document.querySelectorAll('.item').forEach((e, i) => {
      e.style.opacity = (i >= L && i <= R) ? '1' : '0.2';
      e.style.background = '#334155';
    });
    
    if(L <= R && L >= 0 && R < data.length) {
      document.getElementById('pl'+L).innerText = 'L';
      document.getElementById('pr'+R).innerText = 'R';
    }
    if(M !== -1) {
      document.getElementById('pm'+M).innerText = 'Mid';
      document.getElementById('i'+M).style.background = data[M] === target ? '#10b981' : '#f59e0b';
    }
  }
  
  function reset() {
    L = 0; R = data.length - 1; M = -1; state = 'calc';
    l.innerHTML = ''; document.getElementById('s').disabled = false;
    init(); render(); log("Initialized L=0, R=" + R);
  }
  
  function step() {
    if(L > R) { log("L > R. Target not found."); document.getElementById('s').disabled = true; return; }
    
    if(state === 'calc') {
      M = Math.floor((L+R)/2);
      log(\`Calculated Mid = floor((\${L}+\${R})/2) = \${M}. Value is \${data[M]}.\`);
      render();
      if(data[M] === target) { log("Target Found!"); document.getElementById('s').disabled = true; }
      else { state = 'eval'; }
    } else {
      if(data[M] < target) {
        log(\`\${data[M]} < \${target}, so moving L to Mid + 1 (\${M+1})\`);
        L = M + 1;
      } else {
        log(\`\${data[M]} > \${target}, so moving R to Mid - 1 (\${M-1})\`);
        R = M - 1;
      }
      M = -1; state = 'calc';
      render();
    }
  }
  
  reset();
</script>
    `
  },
  {
    msgId: '9c76e083-c44e-432f-aa01-7febaadda4cc',
    title: 'Off-By-One Bug Lab',
    text: 'Here is the interactive lab for: Off-By-One Bug Lab',
    html: `
<style>
  body { background: #0f172a; color: #f8fafc; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px;}
  .box { background: #1e293b; border: 1px solid #334155; padding: 30px; border-radius: 12px; width: 100%; max-width: 600px; }
  h2 { color: #f43f5e; margin-top: 0; text-align: center; }
  .arr { display: flex; gap: 4px; justify-content: center; margin: 30px 0; }
  .box-item { width: 45px; height: 45px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #334155; border-radius: 6px; border: 2px solid transparent; transition: 0.2s; position: relative;}
  .idx { position: absolute; top: -20px; font-size: 10px; color: #94a3b8; }
  .code { background: #020617; padding: 15px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; }
  .hl { color: #38bdf8; font-weight: bold; }
  button { padding: 10px 15px; background: #f43f5e; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: bold; width: 100%;}
  .msg { margin-top: 15px; text-align: center; font-weight: bold; height: 20px;}
</style>
<div class="box">
  <h2>The Off-By-One Boundary</h2>
  <div class="code">
    <span style="color:#e2e8f0">for</span>(let i = 0; i <span class="hl" id="cond"><=</span> arr.length; i++) {<br>
    &nbsp;&nbsp;console.log(arr[i]);<br>
    }
  </div>
  <div style="text-align:center; font-size:12px; color:#94a3b8; cursor:pointer;" onclick="toggleCond()">[Click to toggle <b style="color:#fff"><=</b> to <b style="color:#fff"><</b>]</div>
  
  <div class="arr" id="arr"></div>
  
  <button onclick="runLoop()" id="btn">Run Loop</button>
  <div class="msg" id="msg"></div>
</div>
<script>
  let isWrong = true;
  const arr = ['A','B','C','D'];
  const c = document.getElementById('arr');
  
  function init() {
    c.innerHTML = '';
    for(let i=0; i<=arr.length; i++) { // Render extra box for Out of bounds
      let b = document.createElement('div');
      b.className = 'box-item'; b.id = 'b'+i;
      
      let idx = document.createElement('div');
      idx.className = 'idx'; idx.innerText = i;
      
      let val = document.createElement('span');
      val.innerText = i < arr.length ? arr[i] : 'undefined';
      if(i === arr.length) { b.style.opacity = '0.4'; b.style.borderStyle = 'dashed'; }
      
      b.appendChild(idx); b.appendChild(val);
      c.appendChild(b);
    }
  }
  
  function toggleCond() {
    isWrong = !isWrong;
    document.getElementById('cond').innerText = isWrong ? '<=' : '<';
    document.getElementById('msg').innerText = '';
    document.getElementById('btn').disabled = false;
    document.querySelectorAll('.box-item').forEach(b => { b.style.borderColor = 'transparent'; b.style.background = '#334155';});
  }
  
  async function runLoop() {
    document.getElementById('btn').disabled = true;
    document.getElementById('msg').innerText = 'Running...';
    
    let limit = isWrong ? arr.length : arr.length - 1;
    
    for(let i=0; i<=limit; i++) {
      let b = document.getElementById('b'+i);
      b.style.background = '#0284c7';
      await new Promise(r => setTimeout(r, 600));
      
      if(i === arr.length) {
        b.style.borderColor = '#ef4444';
        b.style.background = 'rgba(239, 68, 68, 0.2)';
        document.getElementById('msg').innerHTML = '<span style="color:#ef4444">💥 CRASH: Index Out of Bounds (undefined)</span>';
        return;
      }
      b.style.background = '#10b981';
    }
    document.getElementById('msg').innerHTML = '<span style="color:#10b981">✅ Success! Loop completed safely.</span>';
    document.getElementById('btn').disabled = false;
  }
  
  init();
</script>
    `
  },
  {
    msgId: 'a35bf9b8-2685-4d1a-a424-894bcafb576d',
    title: 'Depth-First Search Explorer',
    text: 'Here is the interactive lab for: Depth-First Search Explorer',
    html: `
<style>
  body { background: #0f172a; color: #f8fafc; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;}
  .graph { position: relative; width: 400px; height: 300px; margin: 20px auto; }
  .node { position: absolute; width: 40px; height: 40px; border-radius: 50%; background: #334155; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid #64748b; z-index: 2; transition: 0.4s; }
  svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
  line { stroke: #475569; stroke-width: 2; transition: 0.4s; }
  button { padding: 10px 20px; background: #8b5cf6; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: bold; }
  button:disabled { opacity: 0.5; }
  .stack { display: flex; gap: 5px; margin-top: 20px; min-height: 30px; padding: 10px; background: #1e293b; border-radius: 6px; min-width: 200px; justify-content: center; }
  .stack-item { padding: 4px 10px; background: #8b5cf6; border-radius: 4px; font-weight:bold; }
</style>
<div>
  <h2 style="color:#8b5cf6; text-align:center;">DFS Traversal (Stack-based)</h2>
  <div class="graph" id="g">
    <svg id="svg"></svg>
    <div class="node" id="n1" style="left: 180px; top: 20px;">1</div>
    <div class="node" id="n2" style="left: 80px; top: 120px;">2</div>
    <div class="node" id="n3" style="left: 280px; top: 120px;">3</div>
    <div class="node" id="n4" style="left: 40px; top: 220px;">4</div>
    <div class="node" id="n5" style="left: 120px; top: 220px;">5</div>
    <div class="node" id="n6" style="left: 280px; top: 220px;">6</div>
  </div>
  <div style="text-align:center;">
    <button onclick="step()" id="btn">Next Step</button>
  </div>
  <div style="text-align:center; margin-top:15px; color:#94a3b8; font-size: 12px;">Stack:</div>
  <div class="stack" id="stack"></div>
</div>
<script>
  const edges = [[1,3], [1,2], [2,5], [2,4], [3,6]];
  const svg = document.getElementById('svg');
  edges.forEach(([u,v]) => {
    let nu = document.getElementById('n'+u), nv = document.getElementById('n'+v);
    let l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', parseInt(nu.style.left)+20); l.setAttribute('y1', parseInt(nu.style.top)+20);
    l.setAttribute('x2', parseInt(nv.style.left)+20); l.setAttribute('y2', parseInt(nv.style.top)+20);
    l.id = 'e'+u+'-'+v;
    svg.appendChild(l);
  });
  
  let stack = [1];
  let visited = new Set();
  let adj = {1:[3,2], 2:[5,4], 3:[6], 4:[], 5:[], 6:[]};
  
  function renderStack() {
    let html = '';
    stack.forEach(n => html += \`<div class="stack-item">\${n}</div>\`);
    document.getElementById('stack').innerHTML = html;
  }
  
  renderStack();
  
  async function step() {
    if(stack.length === 0) { document.getElementById('btn').disabled = true; return; }
    let curr = stack.pop();
    renderStack();
    
    let el = document.getElementById('n'+curr);
    el.style.background = '#8b5cf6';
    el.style.borderColor = '#c4b5fd';
    el.style.transform = 'scale(1.2)';
    
    if(!visited.has(curr)) {
      visited.add(curr);
      await new Promise(r => setTimeout(r, 600));
      
      let neighbors = adj[curr];
      for(let n of neighbors) {
        if(!visited.has(n)) {
          stack.push(n);
          let edge = document.getElementById('e'+curr+'-'+n);
          if(edge) edge.style.stroke = '#8b5cf6';
        }
      }
      renderStack();
    }
    setTimeout(() => { el.style.transform = 'scale(1)'; el.style.background = '#10b981'; el.style.borderColor = '#059669'; }, 500);
  }
</script>
    `
  },
  {
    msgId: 'd1419a3b-7e6e-4697-9c77-804954b199eb',
    title: 'Sliding Window Simulator: Dynamic Variant',
    text: 'Here is the interactive lab for: Sliding Window Simulator: Dynamic Variant',
    html: `
<style>
  body { background: #0f172a; color: #e2e8f0; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
  .box { max-width: 650px; background: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #334155; text-align: center;}
  h2 { color: #f59e0b; margin-top: 0; }
  .arr { display: flex; gap: 6px; justify-content: center; margin: 30px 0; position: relative;}
  .item { width: 40px; height: 40px; border-radius: 6px; background: #334155; display: flex; align-items: center; justify-content: center; font-weight: bold; transition: 0.3s; z-index: 1;}
  .win { position: absolute; height: 48px; border: 3px solid #f59e0b; border-radius: 8px; top: -4px; transition: 0.3s; pointer-events: none; background: rgba(245, 158, 11, 0.1); z-index: 0;}
  .stats { font-size: 16px; margin: 15px 0; color: #fbbf24; }
  button { padding: 8px 16px; border: none; background: #f59e0b; color: #1e293b; font-weight: bold; border-radius: 6px; cursor: pointer; margin: 5px; }
  button:disabled { opacity: 0.5; }
</style>
<div class="box">
  <h2>Dynamic Sliding Window</h2>
  <div style="font-size:12px; color:#94a3b8;">Goal: Find smallest window with sum >= 8</div>
  
  <div class="arr" id="arr">
    <div class="win" id="win"></div>
  </div>
  
  <div class="stats">Window Sum: <span id="sum">0</span> | Min Length: <span id="minL">∞</span></div>
  
  <button id="bE" onclick="expand()">Expand (R++)</button>
  <button id="bS" onclick="shrink()" disabled>Shrink (L++)</button>
</div>
<script>
  const arr = [2, 1, 5, 2, 3, 2];
  const target = 8;
  let L = 0, R = 0, sum = 0, minLen = Infinity;
  const c = document.getElementById('arr');
  const w = document.getElementById('win');
  
  arr.forEach((v, i) => {
    let d = document.createElement('div');
    d.className = 'item'; d.id = 'i'+i; d.innerText = v;
    c.appendChild(d);
  });
  
  function update() {
    let leftPx = L * 46; // 40 + 6 gap
    let widthPx = ((R - L) * 46) + 40;
    if(R < L) widthPx = 0;
    
    w.style.left = (leftPx - 4) + 'px';
    w.style.width = widthPx > 0 ? (widthPx + 8) + 'px' : '0px';
    
    document.getElementById('sum').innerText = sum;
    document.getElementById('minL').innerText = minLen === Infinity ? '∞' : minLen;
    
    document.getElementById('bE').disabled = R >= arr.length;
    document.getElementById('bS').disabled = L >= R;
    
    document.querySelectorAll('.item').forEach((el, i) => {
      if(i >= L && i < R) el.style.background = sum >= target ? '#10b981' : '#f59e0b';
      else el.style.background = '#334155';
    });
  }
  
  function expand() {
    if(R < arr.length) { sum += arr[R]; R++; }
    if(sum >= target) minLen = Math.min(minLen, R - L);
    update();
  }
  
  function shrink() {
    if(L < R) { sum -= arr[L]; L++; }
    if(sum >= target) minLen = Math.min(minLen, R - L);
    update();
  }
  
  setTimeout(update, 100);
</script>
    `
  }
];

async function run() {
    console.log("Starting DB Update Phase 1...");
    for(const u of updates) {
        const msg = await prisma.message.findUnique({ where: { id: u.msgId } });
        if(msg) {
            const newSim = { title: u.title, html: u.html };
            await prisma.message.update({
                where: { id: u.msgId },
                data: {
                    text: u.text,
                    simulation: newSim
                }
            });
            console.log(`Updated msgId: ${u.msgId} to ${u.title}`);
        } else {
            console.log(`Message not found: ${u.msgId}`);
        }
    }
    console.log("Done.");
}

run().catch(console.error).finally(() => prisma.$disconnect());
