import { customAlphabet } from 'nanoid/async';
import { createTransport } from 'nodemailer';
import { z } from 'zod';
import got from 'got';
import urlcat from 'urlcat';

const Env = z
    .object({
        EMAIL_HOST: z.string(),
        EMAIL_PORT: z.string(),
        EMAIL_SECURE: z.string(),
        EMAIL_AUTH_USER: z.string(),
        EMAIL_AUTH_PASS: z.string(),

        API_URL: z.string().url(),
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
    try {
        const mailer = createTransport({
            host: Env.EMAIL_HOST,
            port: Env.EMAIL_PORT,
            secure: Env.EMAIL_SECURE === 'true',
            auth: {
                user: Env.EMAIL_AUTH_USER,
                pass: Env.EMAIL_AUTH_PASS,
            },
            tls: {
                ciphers: 'SSLv3',
            },
        } as any);

        await mailer.sendMail({
            from: '"Temporal Electronic Signature" <temporal@electronic-signature.com>',
            to: email,
            subject: 'Electronic Signature - Confirmation Code',
            text: `
                The code to confirm the electronic signature is: ${confirmationCode}.
            `,
        });
    } catch (err) {
        console.error('sending confirmation code email activity error', err);

        throw err;
    }
}

export async function stampDocument(documentId: string): Promise<void> {
    const url = urlcat(Env.API_URL, `/procedure/stamp/${documentId}`);

    await got.post(url);
}
