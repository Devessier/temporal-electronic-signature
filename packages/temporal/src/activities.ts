import { customAlphabet } from 'nanoid/async';

export async function generateConfirmationCode(): Promise<string> {
    const nanoid = customAlphabet('0123456789ABCDEF', 6);

    return await nanoid();
}

// export async function sendConfirmationCodeEmail(): Promise<void> {}
