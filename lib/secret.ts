import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const key = () => createHash('sha256').update(process.env.APP_ENCRYPTION_KEY ?? 'wuxian-local-development-key').digest();

export function encryptSecret(value: string) {
  if (!value) return '';
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `enc:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(value: string) {
  if (!value || !value.startsWith('enc:')) return value;
  const [, ivText, tagText, payloadText] = value.split(':');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivText, 'base64'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(payloadText, 'base64')), decipher.final()]).toString('utf8');
}
