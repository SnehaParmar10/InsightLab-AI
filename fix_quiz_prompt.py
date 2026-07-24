with open("ai backend/main.py", "r") as f:
    content = f.read()

import re
# Fix the syntax error I just introduced
content = content.replace('system_prompt += "\n\nImportant:', 'system_prompt += "\\n\\nImportant:')
with open("ai backend/main.py", "w") as f:
    f.write(content)
