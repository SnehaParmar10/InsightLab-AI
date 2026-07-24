import os
import json
import re
import httpx
from typing import List, Optional, Dict, Any, TypedDict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END

# Load environment variables
load_dotenv()

app = FastAPI(title="VisuLogic AI Backend", description="FastAPI service for LLM agent processing")

# Enable CORS for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request / Response Schemas
class Message(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    messages: List[Message]
    custom_instructions: Optional[str] = None

class QuizRequest(BaseModel):
    topic: str
    custom_instructions: Optional[str] = None


# Helper to clean and parse JSON responses from Claude
def clean_and_parse_json(text: str):
    if text is None:
        return {"text": "Error: Received empty response from AI.", "notes": None}
        
    clean_text = text.strip()
    if clean_text.startswith("```json"):
        clean_text = clean_text[7:]
    elif clean_text.startswith("```"):
        clean_text = clean_text[3:]
    if clean_text.endswith("```"):
        clean_text = clean_text[:-3]
    
    clean_text = clean_text.strip()
    try:
        return json.loads(clean_text, strict=False)
    except Exception as e:
        # Fallback to regex pattern extraction
        start_idx = clean_text.find('{')
        start_arr_idx = clean_text.find('[')
        start = -1
        end = -1
        
        if start_idx != -1 and (start_arr_idx == -1 or start_idx < start_arr_idx):
            start = start_idx
            end = clean_text.rfind('}')
        elif start_arr_idx != -1:
            start = start_arr_idx
            end = clean_text.rfind(']')
            
        if start != -1 and end != -1:
            try:
                return json.loads(clean_text[start:end+1], strict=False)
            except Exception:
                pass
                
        try:
            import re
            text_match = re.search(r'"text"\s*:\s*"(.*?)"\s*(?:,\s*"notes"|\s*})', clean_text, re.DOTALL)
            if text_match:
                extracted_text = text_match.group(1).replace('\\n', '\n').replace('\\"', '"')
                
                notes_match = re.search(r'"notes"\s*:\s*"(.*?)(?:"\s*}|"\s*$|$)', clean_text, re.DOTALL)
                extracted_notes = None
                if notes_match:
                    extracted_notes = notes_match.group(1).replace('\\n', '\n').replace('\\"', '"').replace('\\/', '/')
                    
                return {
                    "text": extracted_text,
                    "notes": extracted_notes,
                    "simulation": None
                }
        except Exception:
            pass
        
        # If all JSON parsing fails, return the raw text gracefully
        # Setting notes to None so the UI shows the default placeholder instead of an ugly error box.
        return {
            "text": text,
            "notes": None,
            "simulation": None
        }

# Helper to call Anthropic (native Messages API format)
async def call_anthropic(messages_payload: list, system_prompt: str, require_json: bool = True, prefill: str = None):
    base_url = os.getenv("ANTHROPIC_API_BASE", "https://capi.aerolink.lat/v1").strip()
    key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    
    if not key:
        raise ValueError("ANTHROPIC_API_KEY is not set")
        
    messages_url = f"{base_url}/messages"
    
    headers = {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "user-agent": "claude-code/0.2.40"
    }

    filtered_messages = []
    for m in messages_payload:
        if isinstance(m, dict) and "role" in m and "content" in m and m["content"]:
            filtered_messages.append({"role": m["role"], "content": m["content"]})
            
    if not filtered_messages:
        filtered_messages = [{"role": "user", "content": "Hello"}]

    if require_json:
        messages_with_system = [
            {"role": "user", "content": f"For this conversation, I need you to strictly adopt a specific educational persona and follow these formatting rules:\n\n{system_prompt}\n\nPlease confirm you will act as this persona and output ONLY valid JSON."},
            {"role": "assistant", "content": "I confirm. I will adopt the requested persona, follow all instructions perfectly, and output ONLY valid JSON without any conversational text."},
        ] + filtered_messages
    else:
        messages_with_system = [
            {"role": "user", "content": f"For this conversation, I need you to strictly adopt a specific educational persona and follow these formatting rules:\n\n{system_prompt}\n\nPlease confirm you will act as this persona and follow the output format requested."},
            {"role": "assistant", "content": "I confirm. I will adopt the requested persona and follow all instructions perfectly without any unnecessary conversational text."},
        ] + filtered_messages

    # Anthropic API strictly requires alternating user/assistant roles.
    # We must merge any consecutive messages with the same role.
    merged_messages = []
    for msg in messages_with_system:
        if merged_messages and merged_messages[-1]["role"] == msg["role"]:
            merged_messages[-1]["content"] += "\n\n" + msg["content"]
        else:
            merged_messages.append({"role": msg["role"], "content": msg["content"]})

    # Enforce output format by appending a strict instruction to the last user message
    if merged_messages and merged_messages[-1]["role"] == "user":
        if require_json:
            merged_messages[-1]["content"] += "\n\nCRITICAL: Respond ONLY with a valid JSON object or array as requested. Do not add any conversational text, introductions, or conclusions. Start your response directly with { or [."
        else:
            merged_messages[-1]["content"] += "\n\nCRITICAL: Respond exactly in the format requested in the system prompt. Do not add any conversational text, introductions, or conclusions."

    if prefill:
        merged_messages.append({"role": "assistant", "content": prefill})

    models_to_try = ["claude-sonnet-5", "claude-haiku-4-5-20251001", "claude-opus-4-7"]
    max_retries = 2
    last_err = None

    for model in models_to_try:
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=150.0) as client:
                    response = await client.post(
                        messages_url,
                        headers=headers,
                        json={
                            "model": model,
                            "messages": merged_messages,
                            "max_tokens": 8000
                        }
                    )
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"API error ({response.status_code}): {response.text}"
                    )
                data = response.json()
                content_blocks = data.get("content", [])
                for block in content_blocks:
                    if block.get("type") == "text":
                        return block["text"]
                if content_blocks and "text" in content_blocks[0]:
                    return content_blocks[0]["text"]
                return data.get("text", "")
            except Exception as e:
                last_err = e
                print(f"[call_anthropic] Model {model} attempt {attempt+1} failed: {e}")
                import asyncio
                await asyncio.sleep(1.0)
    raise last_err

# ==========================================
# LOCAL FALLBACK ENGINE
# ==========================================

def detect_topic(input_string: str) -> str:
    return "general"
def get_fallback_chat_and_notes(topic_key: str, query: str):
    if topic_key == "osi":
        return {
            "text": "The OSI (Open Systems Interconnection) Model is a conceptual framework that standardizes network communication into 7 distinct layers. It helps engineers troubleshoot protocol issues and ensures different hardware systems can communicate seamlessly.",
            "notes": """
                <div class="notes-header-strip">
                    <h1 class="font-title" style="font-size:1.4rem;color:#be123c;margin:0 0 4px;">The OSI Model 🗼</h1>
                    <p class="font-hand" style="font-size:0.78rem;color:#64748b;margin:0;">Open Systems Interconnection — Standardized Networking Framework</p>
                </div>
                <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem;">
                    <p class="font-notes">The OSI Model divides networking tasks into <span class="highlight-yellow">7 hierarchical layers</span>. As data moves <strong>down</strong> the stack, headers are appended (encapsulation). As it moves <strong>up</strong>, headers are parsed (decapsulation).</p>

                    <div style="display:flex;flex-direction:column;gap:0.35rem;max-width:26rem;margin:0 auto;">
                        <div class="concept-card"><div class="badge" style="background:#ef4444;">7</div><div class="card-body"><h4 style="color:#9f1239;">Application Layer</h4><p>Protocols: HTTP, DNS, SMTP &nbsp;|&nbsp; PDU: Data</p></div></div>
                        <div class="concept-card"><div class="badge" style="background:#f97316;">6</div><div class="card-body"><h4 style="color:#9a3412;">Presentation Layer</h4><p>Protocols: SSL, TLS, ASCII &nbsp;|&nbsp; PDU: Data Format</p></div></div>
                        <div class="concept-card"><div class="badge" style="background:#f59e0b;">5</div><div class="card-body"><h4 style="color:#92400e;">Session Layer</h4><p>Protocols: SOCKS, NetBIOS &nbsp;|&nbsp; PDU: Session Stream</p></div></div>
                        <div class="concept-card"><div class="badge" style="background:#22c55e;">4</div><div class="card-body"><h4 style="color:#166534;">Transport Layer</h4><p>Protocols: TCP, UDP &nbsp;|&nbsp; PDU: Segment / Datagram</p></div></div>
                        <div class="concept-card"><div class="badge" style="background:#06b6d4;">3</div><div class="card-body"><h4 style="color:#155e75;">Network Layer</h4><p>Protocols: IPv4, IPv6 &nbsp;|&nbsp; PDU: Packet</p></div></div>
                        <div class="concept-card"><div class="badge" style="background:#3b82f6;">2</div><div class="card-body"><h4 style="color:#1e40af;">Data Link Layer</h4><p>Protocols: Ethernet, Wi-Fi &nbsp;|&nbsp; PDU: Frame</p></div></div>
                        <div class="concept-card"><div class="badge" style="background:#a855f7;">1</div><div class="card-body"><h4 style="color:#6b21a8;">Physical Layer</h4><p>Hardware: Cables, Hubs, Bits &nbsp;|&nbsp; PDU: Bits</p></div></div>
                    </div>

                    <div class="callout-box">
                        <p class="font-hand" style="font-size:0.8rem;font-weight:700;color:#44403c;margin:0 0 4px;">💡 Mnemonic — Bottom to Top (L1→L7):</p>
                        <p class="font-notes" style="font-size:0.8rem;color:#57534e;margin:0;font-style:italic;">"<strong>P</strong>lease <strong>D</strong>o <strong>N</strong>ot <strong>T</strong>hrow <strong>S</strong>ausage <strong>P</strong>izza <strong>A</strong>way"</p>
                        <p class="font-hand" style="font-size:0.72rem;color:#78716c;margin:4px 0 0;">Physical → Data Link → Network → Transport → Session → Presentation → Application</p>
                    </div>
                </div>
            """
        }
    if topic_key == "binary_search":
        return {
            "text": "Binary Search is a highly efficient O(log N) search algorithm. It works on sorted arrays by repeatedly halving the search space until the target value is found or the search bounds exhaust.",
            "notes": """
                <div class="notes-header-strip">
                    <h1 class="font-title" style="font-size:1.4rem;color:#be123c;margin:0 0 4px;">Binary Search 🔍</h1>
                    <p class="font-hand" style="font-size:0.78rem;color:#64748b;margin:0;">Divide-and-Conquer Search — O(log N) Mastery</p>
                </div>
                <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem;">
                    <div>
                        <h2 class="font-title" style="font-size:1rem;color:#1e3a5f;border-bottom:1.5px solid #cbd5e1;padding-bottom:3px;display:inline-block;">1. Core Theory</h2>
                        <p class="font-notes" style="margin-top:0.5rem;">Binary search finds a target value in a <strong>sorted array</strong> by halving the search space at every step. It runs in <span class="highlight-cyan">O(log N)</span> time — incredibly fast for large datasets.</p>
                    </div>

                    <div>
                        <h2 class="font-title" style="font-size:1rem;color:#1e3a5f;border-bottom:1.5px solid #cbd5e1;padding-bottom:3px;display:inline-block;">2. The Dictionary Analogy</h2>
                        <p class="font-notes" style="margin-top:0.5rem;">Looking up <em>"Network"</em> in a dictionary? You don't start from page 1. You open the <span class="highlight-yellow">middle page</span>, check if N comes before or after, and throw away half the book. Repeat until found!</p>
                    </div>

                    <div>
                        <h2 class="font-title" style="font-size:1rem;color:#1e3a5f;border-bottom:1.5px solid #cbd5e1;padding-bottom:3px;display:inline-block;">3. Step-by-Step: Find 23</h2>
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:1rem;margin-top:0.5rem;">
                            <svg viewBox="0 0 400 55" style="width:100%;max-width:380px;display:block;margin:0 auto 8px;">
                                <g transform="translate(10,8)">
                                    <rect x="0"   y="0" width="34" height="30" rx="4" fill="#ef4444" opacity="0.25"/><text x="17"  y="19" fill="#7f1d1d" font-size="10" font-family="monospace" text-anchor="middle">2</text>
                                    <rect x="42"  y="0" width="34" height="30" rx="4" fill="#ef4444" opacity="0.25"/><text x="59"  y="19" fill="#7f1d1d" font-size="10" font-family="monospace" text-anchor="middle">5</text>
                                    <rect x="84"  y="0" width="34" height="30" rx="4" fill="#ef4444" opacity="0.25"/><text x="101" y="19" fill="#7f1d1d" font-size="10" font-family="monospace" text-anchor="middle">8</text>
                                    <rect x="126" y="0" width="34" height="30" rx="4" fill="#f59e0b"/><text x="143" y="19" fill="white" font-size="10" font-family="monospace" text-anchor="middle" font-weight="bold">12</text>
                                    <text x="143" y="44" fill="#d97706" font-size="8" font-family="monospace" text-anchor="middle">Mid</text>
                                    <rect x="168" y="0" width="34" height="30" rx="4" fill="#1e293b"/><text x="185" y="19" fill="#94a3b8" font-size="10" font-family="monospace" text-anchor="middle">16</text>
                                    <rect x="210" y="0" width="34" height="30" rx="4" fill="#10b981"/><text x="227" y="19" fill="white" font-size="10" font-family="monospace" text-anchor="middle" font-weight="bold">23</text>
                                    <text x="227" y="44" fill="#059669" font-size="8" font-family="monospace" text-anchor="middle">✓ Found</text>
                                    <rect x="252" y="0" width="34" height="30" rx="4" fill="#1e293b"/><text x="269" y="19" fill="#94a3b8" font-size="10" font-family="monospace" text-anchor="middle">38</text>
                                    <rect x="294" y="0" width="34" height="30" rx="4" fill="#1e293b"/><text x="311" y="19" fill="#94a3b8" font-size="10" font-family="monospace" text-anchor="middle">44</text>
                                </g>
                            </svg>
                            <table style="width:100%;border-collapse:collapse;font-size:0.72rem;font-family:monospace;">
                                <thead><tr style="background:#f1f5f9;"><th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:left;color:#475569;">Step</th><th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:left;color:#475569;">Bounds</th><th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:left;color:#475569;">Mid Value</th><th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:left;color:#475569;">Action</th></tr></thead>
                                <tbody>
                                    <tr><td style="padding:5px 8px;border:1px solid #e2e8f0;">1</td><td style="padding:5px 8px;border:1px solid #e2e8f0;">L=0, H=7</td><td style="padding:5px 8px;border:1px solid #e2e8f0;">12 &lt; 23</td><td style="padding:5px 8px;border:1px solid #e2e8f0;color:#d97706;">L = Mid+1 → 4</td></tr>
                                    <tr style="background:#f0fdf4;"><td style="padding:5px 8px;border:1px solid #e2e8f0;">2</td><td style="padding:5px 8px;border:1px solid #e2e8f0;">L=4, H=7</td><td style="padding:5px 8px;border:1px solid #e2e8f0;">23 = 23</td><td style="padding:5px 8px;border:1px solid #e2e8f0;color:#16a34a;font-weight:700;">FOUND at index 5 🎉</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="callout-box">
                        <p class="font-hand" style="font-weight:700;font-size:0.8rem;color:#44403c;margin:0 0 4px;">⚠️ Pre-requisite: Array must be sorted!</p>
                        <p class="font-notes" style="font-size:0.78rem;color:#57534e;margin:0;">Mid index = <code style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:4px;padding:1px 5px;font-size:0.75rem;">low + (high - low) // 2</code> — avoids integer overflow.</p>
                    </div>
                </div>
            """
        }
    if topic_key == "stack_queue":
        return {
            "text": "Stacks and Queues are fundamental linear data structures. A Stack follows the LIFO (Last In First Out) principle, while a Queue follows the FIFO (First In First Out) principle.",
            "notes": """
                <div class="notes-header-strip">
                    <h1 class="font-title" style="font-size:1.4rem;color:#be123c;margin:0 0 4px;">Stacks vs Queues 🥞</h1>
                    <p class="font-hand" style="font-size:0.78rem;color:#64748b;margin:0;">LIFO &amp; FIFO — Linear Data Structures</p>
                </div>
                <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                        <div style="border:1px solid #c7d2fe;background:#eef2ff;border-radius:8px;padding:1rem;text-align:center;">
                            <h3 class="font-title" style="color:#312e81;font-size:0.95rem;margin:0 0 6px;">Stack (LIFO)</h3>
                            <p class="font-notes" style="font-size:0.72rem;color:#64748b;margin:0 0 10px;">Last In, First Out — like a stack of plates.</p>
                            <div style="display:flex;flex-direction:column-reverse;gap:4px;width:90px;margin:0 auto;border-left:2px solid #818cf8;border-right:2px solid #818cf8;border-bottom:2px solid #818cf8;padding:4px;min-height:90px;">
                                <div style="background:#6366f1;color:white;font-size:9px;font-family:monospace;text-align:center;padding:5px 2px;border-radius:3px;">Plate 1 (Bottom)</div>
                                <div style="background:#4f46e5;color:white;font-size:9px;font-family:monospace;text-align:center;padding:5px 2px;border-radius:3px;">Plate 2</div>
                                <div style="background:#3730a3;color:white;font-size:9px;font-family:monospace;text-align:center;padding:5px 2px;border-radius:3px;">Plate 3 ← Top</div>
                            </div>
                            <p style="font-size:9px;color:#4338ca;font-family:monospace;margin-top:6px;">Push/Pop at Top only</p>
                        </div>
                        <div style="border:1px solid #a7f3d0;background:#ecfdf5;border-radius:8px;padding:1rem;text-align:center;">
                            <h3 class="font-title" style="color:#065f46;font-size:0.95rem;margin:0 0 6px;">Queue (FIFO)</h3>
                            <p class="font-notes" style="font-size:0.72rem;color:#64748b;margin:0 0 10px;">First In, First Out — like a ticket queue.</p>
                            <div style="display:flex;flex-direction:column;gap:4px;padding:6px;border:1px solid #6ee7b7;border-radius:4px;background:#f0fdf4;">
                                <div style="background:#10b981;color:white;font-size:9px;font-family:monospace;text-align:center;padding:5px 4px;border-radius:3px;">← Dequeue (Front)</div>
                                <div style="background:#059669;color:white;font-size:9px;font-family:monospace;text-align:center;padding:5px 4px;border-radius:3px;">Middle</div>
                                <div style="background:#047857;color:white;font-size:9px;font-family:monospace;text-align:center;padding:5px 4px;border-radius:3px;">Enqueue (Rear) →</div>
                            </div>
                            <p style="font-size:9px;color:#065f46;font-family:monospace;margin-top:6px;">Insert at Back, Remove from Front</p>
                        </div>
                    </div>

                    <div>
                        <h2 class="font-title" style="font-size:1rem;color:#1e3a5f;border-bottom:1.5px solid #cbd5e1;padding-bottom:3px;display:inline-block;">Operations Comparison</h2>
                        <table style="width:100%;border-collapse:collapse;font-size:0.75rem;margin-top:0.5rem;">
                            <thead><tr style="background:#f1f5f9;"><th style="padding:6px 10px;border:1px solid #e2e8f0;color:#475569;">Operation</th><th style="padding:6px 10px;border:1px solid #e2e8f0;color:#475569;">Stack</th><th style="padding:6px 10px;border:1px solid #e2e8f0;color:#475569;">Queue</th></tr></thead>
                            <tbody class="font-mono">
                                <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;">Insert</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#4338ca;">Push (top)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#065f46;">Enqueue (rear)</td></tr>
                                <tr style="background:#f8fafc;"><td style="padding:6px 10px;border:1px solid #e2e8f0;">Remove</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#4338ca;">Pop (top)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#065f46;">Dequeue (front)</td></tr>
                                <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;">Use case</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">Undo/Redo, DFS</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">Task scheduling, BFS</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            """
        }
    if topic_key == "sorting":
        return {
            "text": "Sorting algorithms arrange elements of a list in a specific order (typically ascending). Popular algorithms include Bubble Sort, Insertion Sort, Merge Sort, and Quick Sort, each offering different space/time efficiency trade-offs.",
            "notes": """
                <div class="notes-header-strip">
                    <h1 class="font-title" style="font-size:1.4rem;color:#be123c;margin:0 0 4px;">Sorting Algorithms 📊</h1>
                    <p class="font-hand" style="font-size:0.78rem;color:#64748b;margin:0;">Comparing Array Ordering Techniques</p>
                </div>
                <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem;">
                    <p class="font-notes">Sorting arranges array elements in order. The algorithm you pick changes <span class="highlight-yellow">performance drastically</span> — here's a full comparison matrix:</p>

                    <table style="width:100%;border-collapse:collapse;font-size:0.75rem;">
                        <thead><tr style="background:#f1f5f9;"><th style="padding:7px 10px;border:1px solid #e2e8f0;color:#475569;">Algorithm</th><th style="padding:7px 10px;border:1px solid #e2e8f0;color:#475569;">Best Case</th><th style="padding:7px 10px;border:1px solid #e2e8f0;color:#475569;">Worst Case</th><th style="padding:7px 10px;border:1px solid #e2e8f0;color:#475569;">Space</th><th style="padding:7px 10px;border:1px solid #e2e8f0;color:#475569;">Stable?</th></tr></thead>
                        <tbody class="font-mono">
                            <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:700;">Bubble Sort</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#16a34a;">O(N)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#dc2626;">O(N²)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">O(1)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#16a34a;">✓ Yes</td></tr>
                            <tr style="background:#f8fafc;"><td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:700;">Insertion Sort</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#16a34a;">O(N)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#dc2626;">O(N²)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">O(1)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#16a34a;">✓ Yes</td></tr>
                            <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:700;">Quick Sort</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#16a34a;">O(N log N)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#dc2626;">O(N²)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">O(log N)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#dc2626;">✗ No</td></tr>
                            <tr style="background:#f0fdf4;"><td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:700;">Merge Sort</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#16a34a;">O(N log N)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#16a34a;">O(N log N)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#d97706;">O(N)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#16a34a;">✓ Yes</td></tr>
                        </tbody>
                    </table>

                    <div class="callout-box">
                        <p class="font-hand" style="font-weight:700;font-size:0.8rem;color:#44403c;margin:0 0 4px;">🏆 When to use what?</p>
                        <p class="font-notes" style="font-size:0.78rem;color:#57534e;margin:0;"><span class="highlight-green">Merge Sort</span> — guaranteed O(N log N), great for linked lists. <span class="highlight-yellow">Quick Sort</span> — fastest in practice on arrays. <span class="highlight-cyan">Bubble/Insertion</span> — only when input is nearly sorted.</p>
                    </div>
                </div>
            """
        }
    if topic_key == "hashmap":
        return {
            "text": "A HashMap is a data structure that stores key-value pairs using a hash function to map keys to array indices, enabling average O(1) lookups, inserts, and deletes. Collisions are handled via chaining or open addressing.",
            "notes": """
                <div class="notes-header-strip">
                    <h1 class="font-title" style="font-size:1.4rem;color:#be123c;margin:0 0 4px;">HashMap / Hash Table 🗂️</h1>
                    <p class="font-hand" style="font-size:0.78rem;color:#64748b;margin:0;">Key-Value Store — O(1) Average Lookup Power</p>
                </div>
                <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem;">
                    <div>
                        <h2 class="font-title" style="font-size:1rem;color:#1e3a5f;border-bottom:1.5px solid #cbd5e1;padding-bottom:3px;display:inline-block;">1. Core Concept</h2>
                        <p class="font-notes" style="margin-top:0.5rem;">A HashMap stores data as <span class="highlight-yellow">key → value</span> pairs. A <strong>hash function</strong> converts any key into an integer index, pointing to a slot in an underlying array. This is why lookups are <span class="highlight-cyan">O(1) average</span> — no searching needed, just compute the index and jump directly to it.</p>
                    </div>

                    <div>
                        <h2 class="font-title" style="font-size:1rem;color:#1e3a5f;border-bottom:1.5px solid #cbd5e1;padding-bottom:3px;display:inline-block;">2. Real-World Analogy</h2>
                        <p class="font-notes" style="margin-top:0.5rem;">Think of a <span class="highlight-green">library catalog system</span>. Each book (value) has a unique ISBN (key). The catalog (hash function) instantly tells you exactly which shelf and slot holds the book — you never scan every shelf.</p>
                    </div>

                    <div>
                        <h2 class="font-title" style="font-size:1rem;color:#1e3a5f;border-bottom:1.5px solid #cbd5e1;padding-bottom:3px;display:inline-block;">3. How Hashing Works</h2>
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:1rem;margin-top:0.5rem;">
                            <svg viewBox="0 0 420 80" style="width:100%;max-width:400px;display:block;margin:0 auto;">
                                <rect x="0" y="20" width="80" height="36" rx="6" fill="#e0e7ff" stroke="#818cf8"/>
                                <text x="40" y="42" font-size="10" font-family="monospace" text-anchor="middle" fill="#3730a3" font-weight="bold">"apple"</text>
                                <text x="40" y="56" font-size="8" font-family="monospace" text-anchor="middle" fill="#6366f1">Key</text>
                                <text x="120" y="42" font-size="18" fill="#94a3b8" text-anchor="middle">→</text>
                                <rect x="140" y="20" width="90" height="36" rx="6" fill="#fef9c3" stroke="#eab308"/>
                                <text x="185" y="38" font-size="9" font-family="monospace" text-anchor="middle" fill="#92400e">hash("apple")</text>
                                <text x="185" y="52" font-size="9" font-family="monospace" text-anchor="middle" fill="#92400e">= 3,849,234</text>
                                <text x="250" y="42" font-size="18" fill="#94a3b8" text-anchor="middle">→</text>
                                <rect x="270" y="20" width="60" height="36" rx="6" fill="#dcfce7" stroke="#22c55e"/>
                                <text x="300" y="38" font-size="9" font-family="monospace" text-anchor="middle" fill="#166534">% 10</text>
                                <text x="300" y="52" font-size="9" font-family="monospace" text-anchor="middle" fill="#166534">= index 4</text>
                                <text x="350" y="42" font-size="18" fill="#94a3b8" text-anchor="middle">→</text>
                                <rect x="375" y="20" width="40" height="36" rx="6" fill="#fee2e2" stroke="#ef4444"/>
                                <text x="395" y="38" font-size="9" font-family="monospace" text-anchor="middle" fill="#991b1b">arr</text>
                                <text x="395" y="52" font-size="9" font-family="monospace" text-anchor="middle" fill="#991b1b">[4]</text>
                            </svg>
                        </div>
                    </div>

                    <div>
                        <h2 class="font-title" style="font-size:1rem;color:#1e3a5f;border-bottom:1.5px solid #cbd5e1;padding-bottom:3px;display:inline-block;">4. Collision Handling</h2>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:0.5rem;">
                            <div style="border:1px solid #c7d2fe;background:#eef2ff;border-radius:6px;padding:0.75rem;">
                                <h4 class="font-title" style="color:#3730a3;font-size:0.82rem;margin:0 0 4px;">Chaining (Linked List)</h4>
                                <p class="font-notes" style="font-size:0.72rem;color:#475569;margin:0;">Each bucket holds a linked list. Multiple keys that hash to the same index are chained together.</p>
                            </div>
                            <div style="border:1px solid #a7f3d0;background:#ecfdf5;border-radius:6px;padding:0.75rem;">
                                <h4 class="font-title" style="color:#065f46;font-size:0.82rem;margin:0 0 4px;">Open Addressing (Probing)</h4>
                                <p class="font-notes" style="font-size:0.72rem;color:#475569;margin:0;">On collision, probe the next available slot linearly or quadratically within the array itself.</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 class="font-title" style="font-size:1rem;color:#1e3a5f;border-bottom:1.5px solid #cbd5e1;padding-bottom:3px;display:inline-block;">5. Complexity Cheatsheet</h2>
                        <table style="width:100%;border-collapse:collapse;font-size:0.75rem;margin-top:0.5rem;">
                            <thead><tr style="background:#f1f5f9;"><th style="padding:6px 10px;border:1px solid #e2e8f0;color:#475569;">Operation</th><th style="padding:6px 10px;border:1px solid #e2e8f0;color:#475569;">Average</th><th style="padding:6px 10px;border:1px solid #e2e8f0;color:#475569;">Worst Case</th></tr></thead>
                            <tbody class="font-mono">
                                <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:700;">Insert</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#16a34a;">O(1)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#dc2626;">O(N)</td></tr>
                                <tr style="background:#f8fafc;"><td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:700;">Lookup</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#16a34a;">O(1)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#dc2626;">O(N)</td></tr>
                                <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:700;">Delete</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#16a34a;">O(1)</td><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#dc2626;">O(N)</td></tr>
                            </tbody>
                        </table>
                        <p class="font-notes" style="font-size:0.72rem;color:#64748b;margin-top:4px;">Worst case O(N) occurs when all keys collide into the same bucket.</p>
                    </div>

                    <div class="callout-box">
                        <p class="font-hand" style="font-weight:700;font-size:0.8rem;color:#44403c;margin:0 0 4px;">🔥 Common Interview Patterns using HashMap:</p>
                        <p class="font-notes" style="font-size:0.78rem;color:#57534e;margin:0;">
                            <span class="highlight-yellow">Two Sum</span> — store complement in map for O(1) lookup.<br/>
                            <span class="highlight-green">Frequency Count</span> — count chars/elements in one pass.<br/>
                            <span class="highlight-cyan">Sliding Window</span> — track window elements with map.<br/>
                            <span class="highlight-pink">Anagram Check</span> — compare frequency maps of two strings.
                        </p>
                    </div>
                </div>
            """
        }
    return {
        "text": f"I'd love to help you explore this topic. VisuLogic specializes in creating premium interactive graphics, canvas notes, and custom simulator sandboxes to master any concept.",
        "notes": (
            f'<div class="notes-header-strip">'
            f'<h1 class="font-title" style="font-size:1.4rem;color:#be123c;margin:0 0 4px;">Topic Overview &#9997;</h1>'
            f'<p class="font-hand" style="font-size:0.78rem;color:#64748b;margin:0;">Conceptual Blueprint</p>'
            f'</div>'
            f'<div style="padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem;">'
            f'<div>'
            f'<h2 class="font-title" style="font-size:1rem;color:#1e3a5f;border-bottom:1.5px solid #cbd5e1;padding-bottom:3px;display:inline-block;">1. Overview</h2>'
            f'<p class="font-notes" style="margin-top:0.5rem;">Let\'s break down the key structural elements, core mechanics, and typical use cases related to your query.</p>'
            f'</div>'
            f'<div class="callout-box">'
            f'<p class="font-hand" style="font-size:0.8rem;font-weight:700;color:#44403c;margin:0 0 4px;">&#128161; How to use this panel:</p>'
            f'<p class="font-notes" style="font-size:0.78rem;color:#57534e;margin:0;">Switch to the <strong>Quiz</strong> tab to test your understanding, or the <strong>Simulator</strong> tab for an interactive visualizer.</p>'
            f'</div>'
            f'<div>'
            f'<h2 class="font-title" style="font-size:1rem;color:#1e3a5f;border-bottom:1.5px solid #cbd5e1;padding-bottom:3px;display:inline-block;">2. Key Concepts</h2>'
            f'<p class="font-notes" style="margin-top:0.5rem;">Ask me a specific question for a step-by-step breakdown or to see how the underlying mechanisms work visually.</p>'
            f'</div>'
            f'</div>'
        )
    }

def get_fallback_quiz(topic_key: str):
    if topic_key == "osi":
        return [
            {"q": "Which OSI layer handles encryption and formatting?", "opts": ["Application Layer", "Presentation Layer", "Session Layer", "Transport Layer"], "ans": 1, "exp": "The Presentation Layer (Layer 6) is responsible for data translation, encryption, and formatting."},
            {"q": "What is the PDU (Protocol Data Unit) of Layer 3 (Network)?", "opts": ["Segment", "Packet", "Frame", "Bits"], "ans": 1, "exp": "The Network layer encapsulates segments into Packets (or Datagrams) for routing."},
            {"q": "Which protocol operates at the Application Layer (Layer 7)?", "opts": ["HTTP", "TCP", "IPsec", "ARP"], "ans": 0, "exp": "HTTP is an application-level protocol for distributed, collaborative, hypermedia information systems."},
            {"q": "Which layer is responsible for node-to-node MAC addressing?", "opts": ["Physical Layer", "Data Link Layer", "Network Layer", "Transport Layer"], "ans": 1, "exp": "The Data Link Layer uses MAC addresses to transmit frames from one node to another over the same physical network."},
            {"q": "TCP and UDP protocols run at which OSI layer?", "opts": ["Session Layer", "Transport Layer", "Network Layer", "Application Layer"], "ans": 1, "exp": "The Transport Layer (Layer 4) handles reliable (TCP) and unreliable (UDP) data transfer."}
        ]
    if topic_key == "binary_search":
        return [
            {"q": "What is the time complexity of Binary Search in the average case?", "opts": ["O(N)", "O(N log N)", "O(log N)", "O(1)"], "ans": 2, "exp": "Binary search halves the search space at each step, yielding a logarithmic time complexity."},
            {"q": "Binary search requires which pre-condition on the input array?", "opts": ["Array must be empty", "Array must be sorted", "Array must contain only integers", "Array size must be power of 2"], "ans": 1, "exp": "The array must be sorted so that the algorithm knows which half to discard."},
            {"q": "How is the mid index calculated in binary search?", "opts": ["Low + (High - Low)", "Math.floor((Low + High) / 2)", "Low * High / 2", "High - Low / 2"], "ans": 1, "exp": "The midpoint is exactly halfway between the Low and High bounds."},
            {"q": "If the target is smaller than the middle element, what is the next step?", "opts": ["Set Low = Mid + 1", "Set High = Mid - 1", "Return Mid", "Terminate algorithm"], "ans": 1, "exp": "If the target is smaller, it must lie in the left half, so we adjust High to Mid - 1."},
            {"q": "What is the best-case time complexity of Binary Search?", "opts": ["O(log N)", "O(N)", "O(1)", "O(N²)"], "ans": 2, "exp": "If the target is found exactly at the middle element on the first try, the time complexity is O(1)."}
        ]
    if topic_key == "stack_queue":
        return [
            {"q": "What principles do Stack and Queue follow respectively?", "opts": ["LIFO and FIFO", "FIFO and LIFO", "LIFO and LIFO", "FIFO and FIFO"], "ans": 0, "exp": "Stack is Last-In-First-Out (LIFO), Queue is First-In-First-Out (FIFO)."},
            {"q": "Which operation is used to insert an element into a stack?", "opts": ["Enqueue", "Push", "Pop", "Dequeue"], "ans": 1, "exp": "Push inserts an element onto the top of a stack."},
            {"q": "Where does insertion occur in a queue?", "opts": ["Top", "Front", "Back/Rear", "Bottom"], "ans": 2, "exp": "In a queue, elements are added at the rear (Enqueue) and removed from the front (Dequeue)."},
            {"q": "What does the Peek operation do in a stack?", "opts": ["Removes top element", "Adds element to top", "Returns top element without removing it", "Checks if stack is empty"], "ans": 2, "exp": "Peek lets you look at the top item without actually modifying the stack."},
            {"q": "Which of the following is a typical application of a Stack?", "opts": ["Breadth-First Search queue", "Undo/Redo buffer in editors", "CPU round-robin scheduling", "Printer task spooler"], "ans": 1, "exp": "Undo buffers use LIFO behavior; the last action performed is the first one undone."}
        ]
    if topic_key == "sorting":
        return [
            {"q": "Which sorting algorithm repeatedly swaps adjacent elements if they are out of order?", "opts": ["Quick Sort", "Bubble Sort", "Merge Sort", "Insertion Sort"], "ans": 1, "exp": "Bubble sort 'bubbles' larger elements to the top by swapping adjacent elements."},
            {"q": "What is the average time complexity of Quick Sort?", "opts": ["O(N²)", "O(N log N)", "O(N)", "O(log N)"], "ans": 1, "exp": "Quick Sort averages O(N log N) by picking a pivot and partitioning the array recursively."},
            {"q": "Which algorithm guarantees O(N log N) performance even in the worst case?", "opts": ["Bubble Sort", "Quick Sort", "Merge Sort", "Selection Sort"], "ans": 2, "exp": "Merge Sort always splits the array in half and merges, guaranteeing O(N log N) time."},
            {"q": "Bubble Sort has a worst-case time complexity of?", "opts": ["O(N)", "O(N log N)", "O(1)", "O(N²)"], "ans": 3, "exp": "In the worst case (reverse sorted array), it has to make O(N²) comparisons and swaps."},
            {"q": "Which sorting algorithm is based on a pivot partitioning step?", "opts": ["Bubble Sort", "Quick Sort", "Merge Sort", "Radix Sort"], "ans": 1, "exp": "Quick Sort relies on partitioning elements around a pivot value."}
        ]
    return [
        {"q": "What is the primary benefit of structured learning roadmaps?", "opts": ["Saves cloud storage", "Helps contextualize and break down topics", "Accelerates GPU compiling", "Replaces database indexing"], "ans": 1, "exp": "Roadmaps help structure the learning process and give clear direction."},
        {"q": "Which time complexity represents linear time?", "opts": ["O(1)", "O(N)", "O(N²)", "O(log N)"], "ans": 1, "exp": "O(N) means the time grows linearly with the size of the input."},
        {"q": "A LIFO structure stands for?", "opts": ["Longest In First Out", "Last In First Out", "Logical Index File Operation", "Left In Front Out"], "ans": 1, "exp": "Last-In-First-Out is a standard data processing order used by Stacks."},
        {"q": "Standard web requests typically use which protocol at the Application Layer?", "opts": ["HTTP/HTTPS", "TLS", "IP", "TCP"], "ans": 0, "exp": "Web browsers use HTTP/HTTPS to request resources from servers."},
        {"q": "Which sorting method is a divide-and-conquer algorithm?", "opts": ["Bubble Sort", "Merge Sort", "Insertion Sort", "Selection Sort"], "ans": 1, "exp": "Merge Sort recursively divides the list in half before conquering (merging) them."}
    ]

def get_fallback_simulation(topic_key: str, topic_name: str):
    title = f"{topic_name} Visualizer"
    html_code = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ background: #09090b; color: #f4f4f5; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }}
            .error-box {{ border: 1px solid #ef4444; background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 8px; text-align: center; max-width: 80%; }}
        </style>
    </head>
    <body>
        <div class="error-box">
            <h2 style="color: #ef4444;">Simulation Generation Failed</h2>
            <p>The AI model encountered an error while trying to generate the simulation for '{topic_name}'.</p>
            <p style="color: #a1a1aa; font-size: 12px;">This is likely due to an API timeout, rate limit, or invalid response.</p>
        </div>
    </body>
    </html>
    """

    if topic_key == "osi":
        title = "OSI Packet Encapsulation Sim"
        html_code = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { background: #09090b; color: #f4f4f5; font-family: monospace; padding: 20px; margin: 0; display: flex; flex-direction: column; align-items: center; }
        .container { width: 100%; max-width: 500px; text-align: center; }
        .box { border: 1px solid #27272a; border-radius: 8px; background: #18181b; padding: 15px; margin: 15px 0; min-height: 100px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .packet { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; margin-top: 10px; }
        .header-block { padding: 6px 12px; border: 1px solid transparent; border-radius: 4px; font-size: 11px; font-weight: bold; }
        .controls { display: flex; gap: 10px; justify-content: center; margin-top: 10px; }
        button { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: bold; }
        .log { font-size: 11px; color: #a1a1aa; text-align: left; width: 100%; max-height: 120px; overflow-y: auto; border-top: 1px solid #27272a; padding-top: 10px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <h3>🗼 OSI Encapsulation Sandbox</h3>
        <div class="box">
            <div id="status">Click "Step Next" to append headers.</div>
            <div class="packet" id="packet-container">
                <div class="header-block" style="background:#ef4444; border-color:#b91c1c;">Payload Data</div>
            </div>
        </div>
        <div class="controls">
            <button id="step-btn">Step Next</button>
            <button id="reset-btn" style="background:#3f3f46;">Reset</button>
        </div>
        <div class="log" id="log-console">Console ready.</div>
    </div>
    <script>
        const steps = [
            { name: "L7: Application", tag: "App Hdr", color: "#f87171", border: "#ef4444", desc: "Adds Application Header (HTTP protocol details)." },
            { name: "L6: Presentation", tag: "Pres Hdr", color: "#fb923c", border: "#f97316", desc: "Formats data as UTF-8 and encrypts via SSL/TLS." },
            { name: "L5: Session", tag: "Sess Hdr", color: "#facc15", border: "#eab308", desc: "Establishes socket connection wrapper." },
            { name: "L4: Transport", tag: "TCP Hdr", color: "#4ade80", border: "#22c55e", desc: "Splits stream. Adds Source and Destination ports." },
            { name: "L3: Network", tag: "IP Hdr", color: "#22d3ee", border: "#06b6d4", desc: "Logical addressing. Appends Source and Target IP tags." },
            { name: "L2: Data Link", tag: "Eth Hdr", color: "#60a5fa", border: "#3b82f6", desc: "Appends MAC addresses and trailer checksum." },
            { name: "L1: Physical", tag: "Bits on Wire", color: "#c084fc", border: "#a855f7", desc: "Converts entire Ethernet Frame into physical voltage pulses!" }
        ];
        let currentStep = 0;
        const packet = document.getElementById("packet-container");
        const log = document.getElementById("log-console");
        const status = document.getElementById("status");
        const stepBtn = document.getElementById("step-btn");
        const resetBtn = document.getElementById("reset-btn");
        stepBtn.addEventListener("click", () => {
            if (currentStep >= steps.length) return;
            const step = steps[currentStep];
            const block = document.createElement("div");
            block.className = "header-block";
            block.style.background = step.color;
            block.style.borderColor = step.border;
            block.innerText = step.tag;
            if (step.name.includes("L2")) {
                packet.insertBefore(block, packet.firstChild);
                const trailer = document.createElement("div");
                trailer.className = "header-block";
                trailer.style.background = "#3b82f6";
                trailer.style.borderColor = "#1d4ed8";
                trailer.innerText = "Eth Tail";
                packet.appendChild(trailer);
            } else if (step.name.includes("L1")) {
                packet.innerHTML = `<div class="header-block" style="background:#a855f7; border-color:#6b21a8;">01100100 01101001 01110100 01110011</div>`;
            } else {
                packet.insertBefore(block, packet.firstChild);
            }
            log.innerHTML = "<div>[Step " + (currentStep+1) + "] <b>" + step.name + ":</b> " + step.desc + "</div>" + log.innerHTML;
            status.innerText = "Active: " + step.name;
            currentStep++;
            if (currentStep === steps.length) stepBtn.disabled = true;
        });
        resetBtn.addEventListener("click", () => {
            currentStep = 0;
            stepBtn.disabled = false;
            packet.innerHTML = `<div class="header-block" style="background:#ef4444; border-color:#b91c1c;">Payload Data</div>`;
            status.innerText = "Click 'Step Next' to append headers.";
            log.innerHTML = "Console reset.";
        });
    </script>
</body>
</html>
        """
    elif topic_key == "binary_search":
        title = "Binary Search Visualizer"
        html_code = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { background: #09090b; color: #f4f4f5; font-family: monospace; padding: 20px; margin: 0; display: flex; flex-direction: column; align-items: center; }
        .container { width: 100%; max-width: 500px; text-align: center; }
        .array-container { display: flex; justify-content: center; gap: 6px; margin: 20px 0; flex-wrap: wrap; }
        .cell { width: 36px; height: 36px; border: 1px solid #27272a; border-radius: 4px; background: #18181b; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; transition: all 0.3s ease; }
        .cell.active { background: rgba(14, 165, 233, 0.15); border-color: #0ea5e9; color: #38bdf8; }
        .cell.mid { background: #f59e0b; border-color: #d97706; color: #ffffff; transform: scale(1.1); }
        .cell.found { background: #10b981; border-color: #059669; color: #ffffff; transform: scale(1.1); }
        .cell.discarded { opacity: 0.25; background: #09090b; }
        .controls { display: flex; gap: 10px; justify-content: center; margin-top: 15px; }
        button { background: #0ea5e9; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: bold; }
        .console { text-align: left; font-size: 11px; color: #a1a1aa; border-top: 1px solid #27272a; padding-top: 10px; margin-top: 20px; max-height: 120px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h3>🔍 Binary Search visualizer</h3>
        <p style="font-size: 11px; color: #a1a1aa;">Target: <b style="color: #f59e0b;">23</b> in sorted array</p>
        <div class="array-container" id="array-box"></div>
        <div class="controls">
            <button id="step-btn">Search Step</button>
            <button id="reset-btn" style="background:#3f3f46;">Reset</button>
        </div>
        <div class="console" id="console-box">Click 'Search Step' to begin.</div>
    </div>
    <script>
        const array = [2, 5, 8, 12, 16, 23, 38, 44, 56, 72];
        const target = 23;
        let low = 0; let high = array.length - 1; let mid = -1; let found = false; let step = 0;
        const arrayBox = document.getElementById("array-box");
        const consoleBox = document.getElementById("console-box");
        const stepBtn = document.getElementById("step-btn");
        const resetBtn = document.getElementById("reset-btn");
        function render() {
            arrayBox.innerHTML = "";
            array.forEach((val, idx) => {
                const cell = document.createElement("div");
                cell.className = "cell"; cell.innerText = val;
                if (found && idx === mid) cell.className += " found";
                else if (idx === mid) cell.className += " mid";
                else if (idx >= low && idx <= high) cell.className += " active";
                else cell.className += " discarded";
                arrayBox.appendChild(cell);
            });
        }
        stepBtn.addEventListener("click", () => {
            if (found || low > high) return;
            step++;
            mid = Math.floor((low + high) / 2);
            render();
            if (array[mid] === target) {
                found = true;
                consoleBox.innerHTML = "<div>[Step " + step + "] Found " + target + " at index " + mid + "! 🎉</div>" + consoleBox.innerHTML;
                stepBtn.disabled = true;
                render();
            } else if (array[mid] < target) {
                consoleBox.innerHTML = "<div>[Step " + step + "] Mid element " + array[mid] + " < " + target + ". Move Low to " + (mid+1) + ".</div>" + consoleBox.innerHTML;
                low = mid + 1;
            } else {
                consoleBox.innerHTML = "<div>[Step " + step + "] Mid element " + array[mid] + " > " + target + ". Move High to " + (mid-1) + ".</div>" + consoleBox.innerHTML;
                high = mid - 1;
            }
        });
        resetBtn.addEventListener("click", () => {
            low = 0; high = array.length - 1; mid = -1; found = false; step = 0;
            stepBtn.disabled = false;
            consoleBox.innerHTML = "Visualizer reset. Click Step to run.";
            render();
        });
        render();
    </script>
</body>
</html>
        """
    elif topic_key == "stack_queue":
        title = "Stack & Queue Laboratory"
        html_code = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { background: #09090b; color: #f4f4f5; font-family: monospace; padding: 20px; margin: 0; display: flex; flex-direction: column; align-items: center; }
        .container { width: 100%; max-width: 500px; text-align: center; }
        .sandbox { border: 1px solid #27272a; border-radius: 8px; background: #18181b; padding: 20px; min-height: 220px; margin: 20px 0; display: flex; align-items: flex-end; justify-content: center; }
        .stack-box { display: flex; flex-direction: column-reverse; gap: 5px; width: 100px; border-left: 2px solid #a1a1aa; border-right: 2px solid #a1a1aa; border-bottom: 2px solid #a1a1aa; padding: 5px; min-height: 180px; }
        .queue-box { display: flex; gap: 5px; border-bottom: 2px solid #a1a1aa; padding: 5px; width: 100%; min-height: 50px; align-items: center; }
        .element { background: #8b5cf6; border: 1px solid #7c3aed; color: white; font-weight: bold; padding: 8px; border-radius: 4px; text-align: center; font-size: 12px; min-width: 25px; }
        .controls { display: flex; gap: 8px; justify-content: center; margin-top: 10px; }
        button { background: #8b5cf6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 11px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h3>🥞 Stack & Queue Sandbox</h3>
        <div class="controls"><button id="toggle-btn">Switch to Queue Mode</button></div>
        <div class="sandbox"><div class="stack-box" id="container-box"></div></div>
        <div class="controls">
            <input type="text" id="value-in" placeholder="Val" style="width: 50px; background:#18181b; border:1px solid #27272a; color:white; border-radius:4px; padding:4px 8px; font-family:inherit; font-size:11px;">
            <button id="push-btn">Push</button>
            <button id="pop-btn" style="background:#ef4444;">Pop</button>
        </div>
    </div>
    <script>
        let isStack = true; const list = [];
        const container = document.getElementById("container-box");
        const valIn = document.getElementById("value-in");
        const pushBtn = document.getElementById("push-btn");
        const popBtn = document.getElementById("pop-btn");
        const toggleBtn = document.getElementById("toggle-btn");
        function updateUI() {
            container.innerHTML = "";
            list.forEach(val => {
                const el = document.createElement("div");
                el.className = "element"; el.innerText = val;
                container.appendChild(el);
            });
        }
        toggleBtn.addEventListener("click", () => {
            isStack = !isStack; list.length = 0;
            if (isStack) {
                toggleBtn.innerText = "Switch to Queue Mode"; pushBtn.innerText = "Push"; popBtn.innerText = "Pop"; container.className = "stack-box";
            } else {
                toggleBtn.innerText = "Switch to Stack Mode"; pushBtn.innerText = "Enqueue"; popBtn.innerText = "Dequeue"; container.className = "queue-box";
            }
            updateUI();
        });
        pushBtn.addEventListener("click", () => {
            const val = valIn.value.trim() || Math.floor(Math.random() * 99) + 1;
            valIn.value = ""; list.push(val); updateUI();
        });
        popBtn.addEventListener("click", () => {
            if (list.length === 0) return;
            if (isStack) list.pop(); else list.shift();
            updateUI();
        });
        updateUI();
    </script>
</body>
</html>
        """
    else:
        title = "Neon Sorting Playground"
        html_code = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { background: #09090b; color: #f4f4f5; font-family: monospace; padding: 20px; margin: 0; display: flex; flex-direction: column; align-items: center; }
        .container { width: 100%; max-width: 500px; text-align: center; }
        .bar-container { display: flex; align-items: flex-end; justify-content: center; gap: 4px; height: 180px; border-bottom: 2px solid #27272a; padding-bottom: 10px; margin: 20px 0; }
        .bar { width: 20px; background: #10b981; border-radius: 2px 2px 0 0; transition: all 0.2s ease; }
        .bar.compare { background: #fb923c; }
        .bar.swap { background: #ef4444; }
        .controls { display: flex; gap: 10px; justify-content: center; margin-top: 15px; }
        button { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h3>📊 Sort Visualizer Sandbox</h3>
        <div class="bar-container" id="bar-box"></div>
        <div class="controls">
            <button id="shuffle-btn" style="background:#3f3f46;">Shuffle</button>
            <button id="sort-btn">Bubble Sort</button>
        </div>
    </div>
    <script>
        let items = [40, 90, 20, 70, 50, 10, 80, 30, 60];
        const barBox = document.getElementById("bar-box");
        const sortBtn = document.getElementById("sort-btn");
        const shuffleBtn = document.getElementById("shuffle-btn");
        function render(compareIdx = [], swapIdx = []) {
            barBox.innerHTML = "";
            items.forEach((val, idx) => {
                const bar = document.createElement("div");
                bar.className = "bar"; bar.style.height = val + "%";
                if (swapIdx.includes(idx)) bar.className += " swap";
                else if (compareIdx.includes(idx)) bar.className += " compare";
                barBox.appendChild(bar);
            });
        }
        shuffleBtn.addEventListener("click", () => {
            items.sort(() => Math.random() - 0.5); render();
        });
        async function bubbleSort() {
            sortBtn.disabled = true; shuffleBtn.disabled = true;
            for (let i = 0; i < items.length; i++) {
                for (let j = 0; j < items.length - i - 1; j++) {
                    render([j, j+1]);
                    await new Promise(r => setTimeout(r, 100));
                    if (items[j] > items[j+1]) {
                        let temp = items[j]; items[j] = items[j+1]; items[j+1] = temp;
                        render([j, j+1], [j, j+1]);
                        await new Promise(r => setTimeout(r, 100));
                    }
                }
            }
            render(); sortBtn.disabled = false; shuffleBtn.disabled = false;
        }
        sortBtn.addEventListener("click", bubbleSort);
        render();
    </script>
</body>
</html>
        """
    return {"title": title, "html": html_code}

# ==========================================
# LANGGRAPH STATE AND NODES
# ==========================================

class AgentState(TypedDict):
    task_type: str
    messages: List[Dict[str, str]]
    topic: str
    topic_key: str
    output: Any
    custom_instructions: Optional[str]

async def decomposer_node(state: AgentState):
    # Agent 1: Basic setup and parsing
    # In a full complex flow, this would break the concept down.
    # Here we just pass through to Analogy / Viz / Quiz based on task_type.
    return state

async def analogy_architect_node(state: AgentState):
    if state.get("task_type") != "chat": return state
    
    system_prompt = (
        'You are a world-class tutor at ConceptCraft AI. Explain concepts intuitively with analogies. '
        'CRITICAL: You MUST respond ONLY with a raw JSON object. Do NOT include ANY conversational text before or after the JSON. '
        '{"text": "<Rich Markdown chat response. MUST include: 1) A friendly intro introducing the generated notes. 2) A Markdown Table summarizing key concepts. 3) A \'Roadmap / Next Steps\' section. 4) \'Pro-tips / Suggestions\' based on the chat. Use headings (##), bolding, and bullet points.>", '
        '"notes": "<self-contained HTML for a beautiful study canvas. ...>"}'
        'RULES: 1) Use ONLY these CSS classes (no Tailwind): font-title, font-hand, font-notes, font-mono, highlight-yellow, highlight-cyan, highlight-green, highlight-pink, sketch-border, sketch-border-thin, callout-box, concept-card, notes-header-strip, term-tooltip. '
        '2) Use raw inline styles for colors/layout on custom elements, BUT use a beautiful, harmonious, pastel color palette. Never use harsh or clashing colors (e.g., red on purple). '
        '3) Structure: start with `<div class="notes-header-strip">` for the title+subtitle (DO NOT add inline background/color styles to this header, let the CSS class handle it). Then use `<div class="grid-2">` to wrap side-by-side `<div class="concept-card">` elements. Inside each concept-card, use `<div class="badge">icon</div> <h3>Title</h3> <p>Text</p>`. Use `<div class="callout-box">` for pro-tips. Do NOT use inline styles for layouts (like absolute positioning or floating), use the provided CSS classes.'
        '4) Make it highly detailed, rich, visual, and educational. Provide insightful details, and ALWAYS use `<div class="grid-2">` for side-by-side cards to keep the layout structured. '
        '5) Keep HTML under 6000 chars. '
        '6) Be highly creative with visuals! You MUST use a dynamic mix of these visual strategies: 1) Colorful ASCII art (use <pre> with inline colored spans), 2) Inline SVG diagrams, 3) Real images, and 4) Concept-based API images (Unsplash). '
        '7) CRITICAL: For ANY flowcharts, architectural diagrams, end-to-end flows, or scientific/medical diagrams, you MUST draw a beautiful, rich Inline SVG diagram. DO NOT use ASCII art for flows or architectures. DO NOT use AI-generated images for these. '
        '8) ANIMATION: To animate SVG flow paths, simply add `class="flow-animate"` to paths/lines. For pulsing nodes, add `class="pulse-animate"`. Do NOT write custom CSS animations. '
        '9) CRITICAL for ASCII Art & multiline text: You MUST wrap them entirely inside <pre> tags so `\\n` renders as newlines in HTML. '
        '10) In the `notes` HTML ONLY, wrap important technical terms in <span class=\'term-tooltip\' data-tooltip=\'Brief explanation\'>Term</span>. Do NOT use HTML in the `text` response. '
        '11) STRICT RULE: NEVER use Emojis anywhere (no emojis in text, notes, or titles). To save tokens and look professional, use FontAwesome icons (e.g., <i class=\'fa-solid fa-brain\' style=\'color: #ff5733;\'></i>) for small icons instead of generating custom inline SVGs. '
        '12) SVG RULES: Use viewBox=\'0 0 800 400\'. Perfectly align elements. Use exact matching Y-coordinates for horizontal flows. Use dominant-baseline=\'middle\' text-anchor=\'middle\' for text inside nodes. Max 1 decimal place. '
        'IMPORTANT: You MUST use SINGLE QUOTES for all HTML attributes (e.g. class=\'...\') so you do not break the JSON string format!"}'
    )
    if state.get("custom_instructions"):
        system_prompt += f"\n\nIMPORTANT USER PREFERENCES: {state['custom_instructions']}"

    try:
        ai_output = await call_anthropic(state["messages"], system_prompt)
        state["output"] = clean_and_parse_json(ai_output)
    except Exception as error:
        import traceback
        print(f"[AI AGENT] Claude API error traceback: {traceback.format_exc()}")
        fallback_data = get_fallback_chat_and_notes(state["topic_key"], state["topic"])
        state["output"] = fallback_data
    return state

async def visualization_node(state: AgentState):
    if state.get("task_type") != "simulation": return state
    
    system_prompt = (
        "You are a master Creative Technologist and Frontend Visualizer. Build a STUNNING, interactive learning lab."
        " Create a standalone, single-file HTML visualizer with visual node trees, step-by-step tracers, or canvas animations.\n\n"
        "### REQUIREMENTS\n"
        "- Write ALL CSS inside a `<style>` tag and JS inside a `<script>` tag.\n"
        "- CRITICAL: KEEP CODE COMPACT. Do NOT write verbose CSS/JS. Absolutely NO COMMENTS in CSS or JS. Use short variable names and minified style logic.\n"
        "- CSS Budget: Under 1200 characters. JS Budget: Under 2500 characters. Keep it extremely lightweight so it doesn't get truncated.\n"
        "- Dark UI: `#0f172a` background, neon glows, dark body color. Set `color: #e2e8f0` on body.\n"
        "- COLOR CAUTION: If drawing on Canvas, do NOT append hex opacity codes (like `+ '33'`) to HSL or RGB color strings (e.g. `hsl(...)33` is invalid and throws a canvas syntax error). Use proper `hsla()` or hex colors exclusively.\n"
        "- COORDINATES CAUTION: In 2D screen coordinates, Y increases downwards. Therefore, if drawing a tree or hierarchy that grows UPWARDS, you must decrease Y (e.g., subtracting height/length) or use positive angles with sine subtraction, not negative angles that draw downwards off-screen.\n"
        "- ANIMATION IS MANDATORY: CSS transitions, `@keyframes`, or JS animations.\n"
        "- Interactive Vanilla JS — place ALL `<script>` at the bottom of `<body>`.\n\n"
        "### STRICT OUTPUT RULES (CRITICAL)\n"
        "- Output ONLY the raw HTML wrapped inside `<sim_code>` and `</sim_code>` tags.\n"
        "- The HTML MUST be a COMPLETE valid document: `<!DOCTYPE html>` → `<html>` → `<head>` (with `<style>`) → `</head>` → `<body>` (with visible UI divs/buttons) → `<script>` → `</body>` → `</html>`.\n"
        "- DO NOT stop early. You MUST always close `</body></html>` at the end.\n"
        "- Do NOT use markdown code fences inside `<sim_code>`."
    )
    
    if state.get("custom_instructions"):
        system_prompt += f"\n\nIMPORTANT USER PREFERENCES: {state['custom_instructions']}"
        
    try:
        ai_output = await call_anthropic(state["messages"], system_prompt, require_json=False)
        
        print(f"\\n[SIMULATOR RAW AI OUTPUT]\\n{ai_output[:500]}...\\n[END RAW OUTPUT]")
        
        import re
        
        # 1. Try to extract from custom <sim_code> tag first
        match = re.search(r"<sim_code>(.*?)</sim_code>", ai_output, re.DOTALL | re.IGNORECASE)
        if match:
            clean_out = match.group(1).strip()
            # Strip nested markdown block if present inside sim_code
            if clean_out.startswith("```"):
                clean_out = re.sub(r"^```(?:html)?\s*\n", "", clean_out)
                clean_out = re.sub(r"\n```$", "", clean_out).strip()
        else:
            # 2. Try Markdown code block
            match = re.search(r"```(?:html)?\s*\n(.*?)\n```", ai_output, re.DOTALL | re.IGNORECASE)
            if match:
                clean_out = match.group(1).strip()
            else:
                clean_out = ai_output.strip()
                
                # 3. Fallback: Extract everything from <!doctype html> or <html to </html>
                match = re.search(r"(<!doctype html>.*?</html>)", clean_out, re.DOTALL | re.IGNORECASE)
                if match:
                    clean_out = match.group(1).strip()
                else:
                    match = re.search(r"(<html[\s>].*?</html>)", clean_out, re.DOTALL | re.IGNORECASE)
                    if match:
                        clean_out = match.group(1).strip()
        
        print(f"[SIMULATOR EXTRACTED HTML LENGTH] {len(clean_out)} chars")
        
        # Extract title if present
        title = f"{state['topic']} Lab"
        title_start = clean_out.lower().find("<title>")
        title_end = clean_out.lower().find("</title>")
        if title_start != -1 and title_end != -1 and title_end > title_start + 7:
            title = clean_out[title_start+7:title_end].strip()
            
        state["output"] = {"title": title, "html": clean_out}
    except Exception as error:
        print(f"[AI AGENT] Claude API error, using core fallback simulation for topic '{state['topic_key']}': {error}")
        state["output"] = get_fallback_simulation(state["topic_key"], state["topic"])
    return state

async def quiz_node(state: AgentState):
    if state.get("task_type") != "quiz": return state
    
    system_prompt = (
        "You are a learning assessment expert.\n"
        "Generate exactly 5 high-quality multiple choice questions to test the user's understanding of the topic.\n"
        "You MUST respond ONLY with a raw, valid JSON array of objects. Do NOT use markdown code blocks, do NOT use backticks.\n"
        "Each question object in the array must follow this exact structure:\n"
        '{"q": "The question text...", "opts": ["Option A", "Option B", "Option C", "Option D"], "ans": 2, "exp": "Brief explanation of why the answer is correct."}'
    )
    
    if state.get("custom_instructions"):
        system_prompt += f"\n\nIMPORTANT USER PREFERENCES: {state['custom_instructions']}"
        
    try:
        ai_output = await call_anthropic(state["messages"], system_prompt)
        state["output"] = {"questions": clean_and_parse_json(ai_output)}
    except Exception as error:
        print(f"[AI AGENT] Claude API error, using core fallback quiz for topic '{state['topic_key']}': {error}")
        state["output"] = {"questions": get_fallback_quiz(state["topic_key"])}
    return state

async def roadmap_node(state: AgentState):
    # Agent 5: Final touchups (if any)
    return state

async def suggestions_node(state: AgentState):
    if state.get("task_type") != "suggestions": return state
    
    system_prompt = (
        'You are a visionary educational designer. Generate exactly 3 to 5 highly tailored, interactive lab suggestions for the user\'s current topic.\n'
        'Focus on creating deep, pedagogical visualizers where students can manipulate variables, test edge cases, or watch step-by-step traces.\n'
        'Examples: If they study physics/waves, suggest a "Live Double Slit Experiment Sandbox" with adjustable wavelength. '
        'If they study recursion/algorithms, suggest a "Step-by-step Call Stack Visualizer" to trace function calls visually.\n\n'
        'CRITICAL: You MUST respond ONLY with a raw JSON array of objects. Do NOT include ANY conversational text before or after the JSON.\n'
        'Format:\n[{"title": "<Catchy Lab Title>", "type": "<Interactive Sandbox | Step-by-Step Visualizer>", "description": "<Pitch what the student will visualize and manipulate>"}]'
    )
    try:
        ai_output = await call_anthropic(state["messages"], system_prompt)
        state["output"] = clean_and_parse_json(ai_output)
    except Exception as error:
        print(f"[AI AGENT] Claude API error for suggestions '{state['topic_key']}': {error}")
        state["output"] = []
    return state

# Build the Graph
builder = StateGraph(AgentState)
builder.add_node("decomposer", decomposer_node)
builder.add_node("analogy", analogy_architect_node)
builder.add_node("viz", visualization_node)
builder.add_node("quiz", quiz_node)
builder.add_node("suggestions", suggestions_node)
builder.add_node("roadmap", roadmap_node)

builder.add_edge(START, "decomposer")
builder.add_edge("decomposer", "analogy")
builder.add_edge("analogy", "viz")
builder.add_edge("viz", "quiz")
builder.add_edge("quiz", "suggestions")
builder.add_edge("suggestions", "roadmap")
builder.add_edge("roadmap", END)
graph = builder.compile()

# ==========================================
# FASTAPI ROUTE ENDPOINTS
# ==========================================

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    messages_list = request.messages
    if not messages_list:
        raise HTTPException(status_code=400, detail="Messages list is empty")
        
    last_user_query = ""
    for msg in reversed(messages_list):
        if msg.sender == "user":
            last_user_query = msg.text
            break
            
    topic_key = detect_topic(last_user_query)
    mapped_messages = [{"role": "user" if m.sender == "user" else "assistant", "content": m.text} for m in messages_list]

    state = AgentState(
        task_type="chat", 
        messages=mapped_messages, 
        topic=last_user_query, 
        topic_key=topic_key, 
        output=None,
        custom_instructions=request.custom_instructions
    )
    final_state = await graph.ainvoke(state)
    return final_state["output"]

@app.post("/quiz")
async def quiz_endpoint(request: QuizRequest):
    topic = request.topic
    topic_key = detect_topic(topic)
    import time
    messages = [{"role": "user", "content": f"Generate a unique quiz about: {topic}. Timestamp: {time.time()}"}]

    state = AgentState(
        task_type="quiz", 
        messages=messages, 
        topic=topic, 
        topic_key=topic_key, 
        output=None,
        custom_instructions=request.custom_instructions
    )
    final_state = await graph.ainvoke(state)
    return final_state["output"]



class AnalyzeRequest(BaseModel):
    conversation_context: str
    custom_instructions: Optional[str] = None

@app.post("/simulation/analyze")
async def simulation_analyze_endpoint(request: AnalyzeRequest):
    context = request.conversation_context
    topic_key = detect_topic(context)
    
    messages = [
        {"role": "user", "content": f"Analyze the following conversation and generate 5 specific interactive lab / simulation ideas related to what we are discussing:\n\n{context}"}
    ]

    state = AgentState(
        task_type="suggestions", 
        messages=messages, 
        topic=topic_key, 
        topic_key=topic_key, 
        output=None,
        custom_instructions=request.custom_instructions
    )
    final_state = await graph.ainvoke(state)
    return {"suggestions": final_state.get("output", [])}

class GenerateSimulationRequest(BaseModel):
    title: str
    topic: str
    custom_instructions: Optional[str] = None

@app.post("/simulation/generate")
async def simulation_generate_endpoint(request: GenerateSimulationRequest):
    title = request.title
    topic_key = detect_topic(request.topic)
    
    import time
    messages = [{"role": "user", "content": f"Create a detailed, beautiful interactive simulation/lab for the topic: {title}. Ensure it is unique. Timestamp: {time.time()}"}]

    state = AgentState(
        task_type="simulation", 
        messages=messages, 
        topic=title, 
        topic_key=topic_key, 
        output=None,
        custom_instructions=request.custom_instructions
    )
    final_state = await graph.ainvoke(state)
    return {"simulation": final_state.get("output")}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
