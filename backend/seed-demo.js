import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create STUDENT role if it doesn't exist
    let role = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    if (!role) {
        role = await prisma.role.create({ data: { name: 'STUDENT' } });
        console.log('Created STUDENT role');
    }

    // Create demo user
    const email = 'demo@conceptcraft.ai';
    const password = 'Demo@1234';
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        console.log('Demo user already exists!');
    } else {
        await prisma.user.create({
            data: {
                name: 'Demo User',
                email,
                passwordHash: hashedPassword,
                roleId: role.id,
                interests: ['technology', 'science'],
                isVerified: true  // Skip OTP verification
            }
        });
        console.log('Demo user created successfully!');
    }

    console.log('\n=== Demo Account Details ===');
    console.log('Email:    demo@conceptcraft.ai');
    console.log('Password: Demo@1234');
    console.log('============================\n');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
