import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const getSesClient = () => {
    const sesConfig = {
        region: process.env.AWS_REGION || "ap-south-1"
    };

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        sesConfig.credentials = {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        };
    }

    return new SESClient(sesConfig);
};

export const sendOtpEmail = async (email, otp) => {
    console.log(`\n=========================================`);
    console.log(`[DEV ONLY] OTP for ${email} is: ${otp}`);
    console.log(`=========================================\n`);

    const fromEmail = process.env.AWS_SES_FROM_EMAIL || 'no-reply@yourdomain.com';

    const params = {
        Source: fromEmail, // MUST be verified in AWS SES
        Destination: {
            ToAddresses: [email],
        },
        Message: {
            Subject: {
                Data: '🔐 Your ConceptCraft AI Verification OTP',
            },
            Body: {
                Html: {
                    Data: `
                        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
                            <h2 style="color: #6366f1;">ConceptCraft AI</h2>
                            <p style="color: #374151;">Your email verification OTP is:</p>
                            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6366f1;">${otp}</span>
                            </div>
                            <p style="color: #6b7280; font-size: 14px;">⏱️ This OTP expires in <b>10 minutes</b>.</p>
                            <p style="color: #6b7280; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                        </div>
                    `,
                },
            },
        },
    };

    try {
        const command = new SendEmailCommand(params);
        await getSesClient().send(command);
        console.log(`[AWS SES] Email successfully sent to ${email} from ${fromEmail}`);
    } catch (err) {
        console.error("Mail Send Exception (AWS SES):", err.message);
        if (process.env.NODE_ENV !== 'production') {
            console.log("Ignoring SES error in development mode. Use the OTP from the console.");
            return;
        }
        throw err;
    }
};
