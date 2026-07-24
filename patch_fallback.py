import re

with open("ai backend/main.py", "r") as f:
    code = f.read()

# Replace the single try-except with a fallback chain for analogy_architect_node
analogy_target = """    try:
        ai_output = await call_anthropic(state["messages"], system_prompt)
        state["output"] = clean_and_parse_json(ai_output)
    except Exception as error:
        print(f"[AI AGENT] Groq API error, using core fallback for topic '{state['topic_key']}': {error}")
        fallback_data = get_fallback_chat_and_notes(state["topic_key"], state["topic"])
        state["output"] = fallback_data"""

analogy_replacement = """    try:
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
code = code.replace(analogy_target, analogy_replacement)

# Same for visualization_node
viz_target = """    try:
        ai_output = await call_anthropic(state["messages"], system_prompt, require_json=False)

        import re

        # 1. Try to extract from custom <sim_code> tag first
        match = re.search(r"<sim_code>(.*?)</sim_code>", ai_output, re.DOTALL | re.IGNORECASE)
        if match:
            html_code = match.group(1).strip()
        else:
            # 2. Try standard HTML code block
            match = re.search(r"```html(.*?)```", ai_output, re.DOTALL | re.IGNORECASE)
            if match:
                html_code = match.group(1).strip()
            else:
                html_code = ai_output.strip()

        # Try to extract a title if one was provided in the text before the code block
        title = state["topic"]
        title_match = re.search(r"\*\*Title:\*\*\s*(.+)", ai_output, re.IGNORECASE)
        if title_match:
            title = title_match.group(1).strip()
            
        state["output"] = {"title": title, "html": html_code}
    except Exception as error:
        print(f"[AI AGENT] Groq API error for chat stream '{state['topic_key']}': {error}")
        state["output"] = get_fallback_simulation(state["topic_key"], state["topic"])"""

viz_replacement = """    try:
        ai_output = await call_anthropic(state["messages"], system_prompt, require_json=False)
    except Exception as error:
        print(f"[AI AGENT] Anthropic failed: {error}. Falling back to Groq...")
        try:
            ai_output = await call_groq(state["messages"], system_prompt, require_json=False)
        except Exception as groq_error:
            print(f"[AI AGENT] Groq failed: {groq_error}. Using core fallback.")
            state["output"] = get_fallback_simulation(state["topic_key"], state["topic"])
            return state

    import re
    match = re.search(r"<sim_code>(.*?)</sim_code>", ai_output, re.DOTALL | re.IGNORECASE)
    if match:
        html_code = match.group(1).strip()
    else:
        match = re.search(r"```html(.*?)```", ai_output, re.DOTALL | re.IGNORECASE)
        if match:
            html_code = match.group(1).strip()
        else:
            html_code = ai_output.strip()

    title = state["topic"]
    title_match = re.search(r"\*\*Title:\*\*\s*(.+)", ai_output, re.IGNORECASE)
    if title_match:
        title = title_match.group(1).strip()
        
    state["output"] = {"title": title, "html": html_code}"""
code = code.replace(viz_target, viz_replacement)

# Same for quiz_node
quiz_target = """    try:
        ai_output = await call_anthropic(state["messages"], system_prompt)
        parsed = clean_and_parse_json(ai_output)
        questions = parsed.get("questions", parsed) if isinstance(parsed, dict) else parsed
        state["output"] = {"questions": questions}
    except Exception as error:
        print(f"[AI AGENT] Groq API error, using core fallback quiz for topic '{state['topic_key']}': {error}")
        state["output"] = {"questions": get_fallback_quiz(state["topic_key"])}"""

quiz_replacement = """    try:
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
code = code.replace(quiz_target, quiz_replacement)

# Same for suggestions_node
sug_target = """    try:
        ai_output = await call_anthropic(state["messages"], system_prompt)
        parsed = clean_and_parse_json(ai_output)
        state["output"] = parsed.get("suggestions", parsed) if isinstance(parsed, dict) else parsed
    except Exception as error:
        print(f"[AI AGENT] Groq API error for suggestions '{state['topic_key']}': {error}")
        state["output"] = []"""

sug_replacement = """    try:
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
code = code.replace(sug_target, sug_replacement)


with open("ai backend/main.py", "w") as f:
    f.write(code)
print("Fallback chain implemented!")
