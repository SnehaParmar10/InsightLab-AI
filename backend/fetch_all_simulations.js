import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'harshitj183@gmail.com' },
            include: {
                conversations: {
                    include: {
                        messages: true
                    }
                }
            }
        });

        if (!user) {
            console.log("User not found.");
            return;
        }

        const simMessages = [];
        for (const conv of user.conversations) {
            for (const msg of conv.messages) {
                if (msg.simulation != null) {
                    simMessages.push({
                        msgId: msg.id,
                        convId: conv.id,
                        convTitle: conv.title,
                        sender: msg.sender,
                        text: msg.text,
                        simTitle: msg.simulation.title || null,
                        htmlLength: msg.simulation.html ? msg.simulation.html.length : 0
                    });
                }
            }
        }

        console.log("Total simulation messages:", simMessages.length);
        console.log(JSON.stringify(simMessages, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
