import re

file_path = "frontend/app/dashboard/page.jsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Add state variables
state_vars = """
    const [convPage, setConvPage] = useState(1);
    const [hasMoreConv, setHasMoreConv] = useState(true);
    const [msgPage, setMsgPage] = useState(1);
    const [hasMoreMsgs, setHasMoreMsgs] = useState(true);
    const [loadingMoreMsgs, setLoadingMoreMsgs] = useState(false);
    const [loadingMoreConv, setLoadingMoreConv] = useState(false);
    const messagesContainerRef = useRef(null);
    const sidebarContainerRef = useRef(null);
"""
content = content.replace(
    "const [activeMessageIndex, setActiveMessageIndex] = useState(null);",
    "const [activeMessageIndex, setActiveMessageIndex] = useState(null);\n" + state_vars
)

# 2. Update initial conversations fetch
content = content.replace(
    "const res = await fetch(`${API}/api/ai/conversations`, {",
    "const res = await fetch(`${API}/api/ai/conversations?page=1&limit=20`, {"
)
# Update total count logic for conversations (in initial fetch)
fetch_initial_conv_parse = """
                const totalConv = parseInt(res.headers.get('X-Total-Count') || '0');
                setHasMoreConv(data.length < totalConv);
                setConvPage(1);
"""
content = content.replace(
    "const data = await res.json();",
    "const data = await res.json();\n" + fetch_initial_conv_parse,
    1 # Only the first one inside fetchInitialConversations
)

# Update initial messages fetch
content = content.replace(
    "const msgRes = await fetch(`${API}/api/ai/conversations/${restoreConv.id}/messages`, {",
    "const msgRes = await fetch(`${API}/api/ai/conversations/${restoreConv.id}/messages?page=1&limit=20`, {"
)
fetch_initial_msg_parse = """
                    const totalMsg = parseInt(msgRes.headers.get('X-Total-Count') || '0');
                    setHasMoreMsgs(msgData.length < totalMsg);
                    setMsgPage(1);
"""
content = content.replace(
    "const msgData = await msgRes.json();",
    "const msgData = await msgRes.json();\n" + fetch_initial_msg_parse,
    1 # Only the first one inside fetchInitialConversations
)

# 3. Handle Scroll Logic (Infinite Scroll)
scroll_handlers = """
    const handleSidebarScroll = async () => {
        if (!sidebarContainerRef.current || loadingMoreConv || !hasMoreConv) return;
        const { scrollTop, scrollHeight, clientHeight } = sidebarContainerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 20) {
            setLoadingMoreConv(true);
            try {
                const nextPage = convPage + 1;
                const res = await fetch(`${API}/api/ai/conversations?page=${nextPage}&limit=20`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    const total = parseInt(res.headers.get('X-Total-Count') || '0');
                    setConversations(prev => [...prev, ...data]);
                    setConvPage(nextPage);
                    setHasMoreConv(conversations.length + data.length < total);
                }
            } catch (err) {
                console.error(err);
            }
            setLoadingMoreConv(false);
        }
    };

    const handleChatScroll = async () => {
        if (!messagesContainerRef.current || loadingMoreMsgs || !hasMoreMsgs) return;
        if (messagesContainerRef.current.scrollTop <= 50) {
            setLoadingMoreMsgs(true);
            const previousScrollHeight = messagesContainerRef.current.scrollHeight;
            try {
                const nextPage = msgPage + 1;
                const res = await fetch(`${API}/api/ai/conversations/${activeConvId}/messages?page=${nextPage}&limit=20`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    const total = parseInt(res.headers.get('X-Total-Count') || '0');
                    setMessages(prev => [...data, ...prev]);
                    setMsgPage(nextPage);
                    setHasMoreMsgs(messages.length + data.length < total);
                    
                    // Restore scroll position
                    setTimeout(() => {
                        if (messagesContainerRef.current) {
                            const newScrollHeight = messagesContainerRef.current.scrollHeight;
                            messagesContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight;
                        }
                    }, 0);
                }
            } catch (err) {
                console.error(err);
            }
            setLoadingMoreMsgs(false);
        }
    };
"""

content = content.replace(
    "const handleSend = async (e) => {",
    scroll_handlers + "\n    const handleSend = async (e) => {"
)

# 4. Attach refs and onScroll
content = content.replace(
    "<div className=\"flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar\">",
    "<div className=\"flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar\" ref={sidebarContainerRef} onScroll={handleSidebarScroll}>"
)

content = content.replace(
    "<div className=\"flex-1 overflow-y-auto p-4 lg:p-6 space-y-5\">",
    "<div className=\"flex-1 overflow-y-auto p-4 lg:p-6 space-y-5\" ref={messagesContainerRef} onScroll={handleChatScroll}>"
)

# 5. Add loading indicators
content = content.replace(
    "{messages.map((msg, index) => {",
    "{loadingMoreMsgs && <div className=\"text-center text-xs text-slate-500 py-2\">Loading older messages...</div>}\n                        {messages.map((msg, index) => {"
)

with open(file_path, "w") as f:
    f.write(content)

print("Patched successfully")
