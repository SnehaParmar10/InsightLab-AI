import re

file_path = "frontend/app/dashboard/page.jsx"
with open(file_path, "r") as f:
    content = f.read()

# Fix switch conversation fetch
switch_conv_fetch = "fetch(`${API}/api/ai/conversations/${newId}/messages`, { credentials: 'include' })"
switch_conv_fetch_new = "fetch(`${API}/api/ai/conversations/${newId}/messages?page=1&limit=20`, { credentials: 'include' })"
content = content.replace(switch_conv_fetch, switch_conv_fetch_new)

switch_conv_parse = """
                if (msgRes.ok) {
                    const totalMsg = parseInt(msgRes.headers.get('X-Total-Count') || '0');
                    setHasMoreMsgs(msgData.length < totalMsg);
                    setMsgPage(1);
                }
"""
content = content.replace(
    "const msgData = await msgRes.json();",
    "const msgData = await msgRes.json();\n" + switch_conv_parse,
    1 # This assumes the first one after the switch logic, wait. I will just replace the exact block if possible.
)

with open(file_path, "w") as f:
    f.write(content)
