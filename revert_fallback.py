import re

with open("ai backend/main.py", "r") as f:
    code = f.read()

# Revert analogy_architect_node
analogy_target = """    try:
        ai_output = await call_anthropic(state["messages"], system_prompt)
        state["output"] = clean_and_parse_json(ai_output)
    except Exception as error:
        print(f"[AI AGENT] Anthropic failed: {error}. Falling back to Groq...")
        try:
            ai_output = await call_groq(state["messages"], system_prompt)
            state["output"] = clean_and_parse_json(ai_output)
        except Exception as groq_error:
            print(f"[AI AGENT] Groq also failed: {groq_error}. Using core fallback.")
            fallback_data = get_fallback_chat_and_notes(state["topic_key"], state["topic"])
            state["output"] = fallback_data"""

analogy_replacement = """    try:
        ai_output = await call_anthropic(state["messages"], system_prompt)
        state["output"] = clean_and_parse_json(ai_output)
    except Exception as error:
        print(f"[AI AGENT] Anthropic API error, using core fallback for topic '{state['topic_key']}': {error}")
        fallback_data = get_fallback_chat_and_notes(state["topic_key"], state["topic"])
        state["output"] = fallback_data"""

code = code.replace(analogy_target, analogy_replacement)

# Revert visualization_node
viz_target = """    try:
        ai_output = await call_anthropic(state["messages"], system_prompt, require_json=False)
    except Exception as error:
        print(f"[AI AGENT] Anthropic failed: {error}. Falling back to Groq...")
        try:
            ai_output = await call_groq(state["messages"], system_prompt, require_json=False)
        except Exception as groq_error:
            print(f"[AI AGENT] Groq API error for chat stream '{state['topic_key']}': {groq_error}")
            state["output"] = get_fallback_simulation(state["topic_key"], state["topic"])
            return state
            
    import re
    
    # 1. Try to extract from custom <sim_code> tag first
    match = re.search(r"<sim_code>(.*?)</sim_code>", ai_output, re.DOTALL | re.IGNORECASE)
    if match:
        clean_out = match.group(1).strip()
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
    
    # Extract title if present
    title = f"{state['topic']} Lab"
    title_start = clean_out.lower().find("<title>")
    title_end = clean_out.lower().find("</title>")
    if title_start != -1 and title_end != -1 and title_end > title_start + 7:
        title = clean_out[title_start+7:title_end].strip()
        
    state["output"] = {"title": title, "html": clean_out}
    return state"""

viz_replacement = """    try:
        ai_output = await call_anthropic(state["messages"], system_prompt, require_json=False)
        
        import re
        
        # 1. Try to extract from custom <sim_code> tag first
        match = re.search(r"<sim_code>(.*?)</sim_code>", ai_output, re.DOTALL | re.IGNORECASE)
        if match:
            clean_out = match.group(1).strip()
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
        
        # Extract title if present
        title = f"{state['topic']} Lab"
        title_start = clean_out.lower().find("<title>")
        title_end = clean_out.lower().find("</title>")
        if title_start != -1 and title_end != -1 and title_end > title_start + 7:
            title = clean_out[title_start+7:title_end].strip()
            
        state["output"] = {"title": title, "html": clean_out}
    except Exception as error:
        print(f"[AI AGENT] Anthropic API error for simulation '{state['topic_key']}': {error}")
        state["output"] = get_fallback_simulation(state["topic_key"], state["topic"])
    return state"""

code = code.replace(viz_target, viz_replacement)

# Revert quiz_node
quiz_target = """    try:
        ai_output = await call_anthropic(state["messages"], system_prompt)
        parsed = clean_and_parse_json(ai_output)
        questions = parsed.get("questions", parsed) if isinstance(parsed, dict) else parsed
        state["output"] = {"questions": questions}
    except Exception as error:
        print(f"[AI AGENT] Anthropic failed: {error}. Falling back to Groq...")
        try:
            ai_output = await call_groq(state["messages"], system_prompt)
            parsed = clean_and_parse_json(ai_output)
            questions = parsed.get("questions", parsed) if isinstance(parsed, dict) else parsed
            state["output"] = {"questions": questions}
        except Exception as groq_error:
            print(f"[AI AGENT] Groq failed: {groq_error}. Using fallback quiz.")
            state["output"] = {"questions": get_fallback_quiz(state["topic_key"])}"""

quiz_replacement = """    try:
        ai_output = await call_anthropic(state["messages"], system_prompt)
        parsed = clean_and_parse_json(ai_output)
        questions = parsed.get("questions", parsed) if isinstance(parsed, dict) else parsed
        state["output"] = {"questions": questions}
    except Exception as error:
        print(f"[AI AGENT] Anthropic API error, using core fallback quiz for topic '{state['topic_key']}': {error}")
        state["output"] = {"questions": get_fallback_quiz(state["topic_key"])}"""

code = code.replace(quiz_target, quiz_replacement)

# Revert suggestions_node
sug_target = """    try:
        ai_output = await call_anthropic(state["messages"], system_prompt)
        parsed = clean_and_parse_json(ai_output)
        state["output"] = parsed.get("suggestions", parsed) if isinstance(parsed, dict) else parsed
    except Exception as error:
        print(f"[AI AGENT] Anthropic failed: {error}. Falling back to Groq...")
        try:
            ai_output = await call_groq(state["messages"], system_prompt)
            parsed = clean_and_parse_json(ai_output)
            state["output"] = parsed.get("suggestions", parsed) if isinstance(parsed, dict) else parsed
        except Exception as groq_error:
            print(f"[AI AGENT] Groq failed: {groq_error}. Using empty suggestions.")
            state["output"] = []"""

sug_replacement = """    try:
        ai_output = await call_anthropic(state["messages"], system_prompt)
        parsed = clean_and_parse_json(ai_output)
        state["output"] = parsed.get("suggestions", parsed) if isinstance(parsed, dict) else parsed
    except Exception as error:
        print(f"[AI AGENT] Anthropic API error for suggestions '{state['topic_key']}': {error}")
        state["output"] = []"""

code = code.replace(sug_target, sug_replacement)

with open("ai backend/main.py", "w") as f:
    f.write(code)
print("Fallback logic reverted to Anthropic-only.")
