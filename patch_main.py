import re

with open("ai backend/main.py", "r") as f:
    code = f.read()

anthropic_func = """
# Helper to call Anthropic (native Messages API format)
async def call_anthropic(messages_payload: list, system_prompt: str, require_json: bool = True, prefill: str = None, temperature: float = 0.3):
    base_url = os.getenv("ANTHROPIC_API_BASE", "https://capi.aerolink.lat/v1").strip()
    key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    messages_url = f"{base_url.rstrip('/')}/messages"

    headers = {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }

    filtered_messages = []
    for m in messages_payload:
        if isinstance(m, dict) and "role" in m and "content" in m and m["content"]:
            role = "assistant" if m["role"] == "assistant" else "user"
            filtered_messages.append({"role": role, "content": m["content"]})

    merged_messages = []
    for msg in filtered_messages:
        if merged_messages and merged_messages[-1]["role"] == msg["role"]:
            merged_messages[-1]["content"] += "\\n\\n" + msg["content"]
        else:
            merged_messages.append({"role": msg["role"], "content": msg["content"]})

    if require_json and merged_messages and merged_messages[-1]["role"] == "user":
        merged_messages[-1]["content"] += "\\n\\nCRITICAL: Respond ONLY with a valid JSON object or array as requested. Start your response directly with { or [."

    if prefill:
        merged_messages.append({"role": "assistant", "content": prefill})

    max_retries = 4
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    messages_url,
                    headers=headers,
                    json={
                        "model": "claude-sonnet-5",
                        "system": system_prompt,
                        "messages": merged_messages,
                        "temperature": temperature,
                        "max_tokens": 8000
                    }
                )
            if response.status_code != 200:
                raise Exception(f"Anthropic API Error: {response.status_code} {response.text}")
            
            data = response.json()
            content_blocks = data.get("content", [])
            for block in content_blocks:
                if block.get("type") == "text":
                    return block["text"]
            if content_blocks and "text" in content_blocks[0]:
                return content_blocks[0]["text"]
            return ""
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            import asyncio
            await asyncio.sleep(1.5 * (attempt + 1))

"""

if "def call_anthropic" not in code:
    code = code.replace("# Helper to call Groq API", anthropic_func + "\n# Helper to call Groq API")

# Replace call_groq with call_anthropic in nodes
code = re.sub(r'ai_output\s*=\s*await call_groq\(state\["messages"\], system_prompt\)', 
              r'ai_output = await call_anthropic(state["messages"], system_prompt)', code)

code = re.sub(r'ai_output\s*=\s*await call_groq\(state\["messages"\], system_prompt, require_json=False\)', 
              r'ai_output = await call_anthropic(state["messages"], system_prompt, require_json=False)', code)

with open("ai backend/main.py", "w") as f:
    f.write(code)
print("Patched main.py")
