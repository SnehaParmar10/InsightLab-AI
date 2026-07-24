export const osiLayerData = {
    7: {
        title: "Layer 7: Application Layer",
        pdu: "Application Data",
        protocols: "HTTP, HTTPS, FTP, DNS, SMTP, SSH, DHCP",
        devices: "Web browsers, terminal utilities, mail agents",
        desc: "Acts as the Direct User Interface window. It handles human-network interaction. When you search for a URL or click send on an email, L7 handles the protocols that interpret the request.",
        proTip: "Applications like Chrome run inside OS environments, but this layer provides protocols inside Chrome to access network hooks."
    },
    6: {
        title: "Layer 6: Presentation Layer",
        pdu: "Data Format",
        protocols: "ASCII, EBCDIC, JPEG, MP3, TLS/SSL (Encryptions)",
        devices: "Software decoders, encryption engines",
        desc: "Standardizes how structural data is represented. This translates raw system output into visual frameworks, handles compression tags, and processes Secure Socket Layer encryptions.",
        proTip: "If App Layer sends data in JSON or ASCII, presentation layer ensures the receiving node translates it back to matching layout blocks."
    },
    5: {
        title: "Layer 5: Session Layer",
        pdu: "Data Session Stream",
        protocols: "NetBIOS, RPC, SOCKS, PPTP tunneling",
        devices: "Operating system processes, socket wrappers",
        desc: "Maintains active ports, dialogue control sessions, and authentication security checks. Handles coordination between systems and marks checkpoints into high-volume transfers to support retry states.",
        proTip: "Prevents a 1GB file transmission from crashing completely at 99% by offering safe checkpoint checkpoints."
    },
    4: {
        title: "Layer 4: Transport Layer",
        pdu: "Segment (TCP) / Datagram (UDP)",
        protocols: "TCP (Reliable & heavy), UDP (Fast, lightweight)",
        devices: "Port endpoints, software firewalls",
        desc: "Governs logical data segmentation, connection assembly, safe flow speed configurations, error retransmissions, and sequences outgoing packages so they are unpacked in the exact order they departed.",
        proTip: "Port numbers (like 80 for HTTP or 443 for HTTPS) live on Layer 4 to hand data off to appropriate background apps."
    },
    3: {
        title: "Layer 3: Network Layer",
        pdu: "Packet",
        protocols: "IPv4, IPv6, ICMP, IPsec, OSPF routing",
        devices: "Network Routers, Layer-3 Multi-port Switches",
        desc: "Focuses on delivery paths across intermediate subnets. This reads incoming destination IPs and computes mathematical paths to direct packets across routers via shortest route algorithms.",
        proTip: "Logical Addressing happens here! Your digital IP address is added at Layer 3."
      },
    2: {
        title: "Layer 2: Data Link Layer",
        pdu: "Frame",
        protocols: "Ethernet (802.3), Wi-Fi (802.11), PPP, ARP",
        devices: "Network Switches, Bridges, NIC Cards",
        desc: "Governs physical node-to-node communication. It takes logical IP packets and packs into physical 'Frames' stamped with physical MAC addresses of matching hardware boards.",
        proTip: "MAC Addresses live here. Switches read these addresses to push data precisely to destination machines."
    },
    1: {
        title: "Layer 1: Physical Layer",
        pdu: "Bits (01100100...)",
        protocols: "DSL, USB, Fiber optic core standards, RJ45 Pinouts",
        devices: "Hubs, Ethernet cables, physical repeaters, fiber paths",
        desc: "Responsible for translating data streams into physical currents, light flashes, or radio signals. Deals with mechanical hardware specs, copper connectors, and absolute voltage properties.",
        proTip: "Layer 1 is completely blind to packet contents or IP addresses; it just passes signals as physical impulses."
    }
};

export const osiSimSteps = [
    { layer: 7, name: "Application Layer", tag: "App Data", class: "bg-red-600 text-white border-red-800", log: "User clicks send. Layer 7 registers request payload 'HELLO WORLD' raw data." },
    { layer: 6, name: "Presentation Layer", tag: "Pres Hdr", class: "bg-orange-600 text-white border-orange-800", log: "Translates text payload to UTF-8 standard binary formatting. Secure payload is encrypted using TLS." },
    { layer: 5, name: "Session Layer", tag: "Session Hdr", class: "bg-yellow-600 text-slate-900 border-yellow-800", log: "Establishes connection port socket wrapper. Prepares handshake signals to tag remote receiver." },
    { layer: 4, name: "Transport Layer", tag: "TCP Hdr", class: "bg-green-600 text-white border-green-800", log: "Splits bulk data. Adds Port numbers (Source: 54223, Destination: 443). Assembles raw TCP Segment." },
    { layer: 3, name: "Network Layer", tag: "IP Hdr", class: "bg-cyan-600 text-white border-cyan-800", log: "Injects Source IP (192.168.1.5) and Destination IP (142.250.1.1). Forms a network routing 'Packet'." },
    { layer: 2, name: "Eth Hdr", tag: "Eth Hdr", class: "bg-blue-600 text-white border-blue-800", log: "Wraps packet with Source MAC & Target gateway MAC. Appends checksum block (FCS error control). Forms an Ethernet 'Frame'." },
    { layer: 1, name: "Physical Layer", tag: "Bits on Wire", class: "bg-purple-600 text-white border-purple-800", log: "Frame converted into high-frequency electric voltages. Pushes bits onto copper/fiber medium." }
];
