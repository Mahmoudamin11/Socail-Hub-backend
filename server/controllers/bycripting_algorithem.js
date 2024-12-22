import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes long');
}
/**
 * دالة لتشفير النصوص
 * @param {string} text - النص المراد تشفيره
 * @returns {string} النص المشفر
 */
export const encrypt = (text) => {
    const iv = crypto.randomBytes(16); // إنشاء متجه ابتدائي جديد
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${encrypted}-${iv.toString('hex')}`;
  };
  

/**
 * فك تشفير النصوص
 * @param {string} encryptedText - النص المشفر
 * @returns {string} النص الأصلي
 */
export const decrypt = (encryptedText) => {
    try {
      const [encryptedData, ivHex] = encryptedText.split('-');
      if (!encryptedData || !ivHex) {
        throw new Error('Invalid encrypted text format');
      }
  
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption Error:', error.message);
      throw new Error('Failed to decrypt text');
    }
  };
  