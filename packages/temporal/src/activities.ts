import { customAlphabet } from 'nanoid/async';
import { createTransport } from 'nodemailer';
import { z } from 'zod';

const Env = z
    .object({
        EMAIL_HOST: z.string(),
        EMAIL_PORT: z.string(),
        EMAIL_SECURE: z.string(),
        EMAIL_AUTH_USER: z.string(),
        EMAIL_AUTH_PASS: z.string(),
    })
    .parse(process.env);

export async function generateConfirmationCode(): Promise<string> {
    const nanoid = customAlphabet('0123456789ABCDEF', 6);

    return await nanoid();
}

export async function sendConfirmationCodeEmail({
    confirmationCode,
    email,
}: {
    confirmationCode: string;
    email: string;
}): Promise<void> {
    const mailer = createTransport({
        host: Env.EMAIL_HOST,
        port: Env.EMAIL_PORT,
        secure: Boolean(Env.EMAIL_SECURE),
        auth: {
            user: Env.EMAIL_AUTH_USER,
            pass: Env.EMAIL_AUTH_PASS,
        },
        tls: {
            ciphers: 'SSLv3',
        },
    } as any);

    await mailer.sendMail({
        from: '"Temporal Electronic Signature" <baptiste@devessier.fr>',
        to: email,
        subject: 'Electronic Signature - Confirmation Code',
        text: `
            The code to confirm the electronic signature is: ${confirmationCode}.
        `,
    });
}
