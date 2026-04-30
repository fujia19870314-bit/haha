// 加密工具模块 - 用于日记内容加密存储
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
/**
 * 加密文本内容
 * @param text 要加密的文本
 * @param password 加密密钥（用户密码或系统密钥）
 */
export function encrypt(text, password) {
    // 生成随机盐值
    const salt = randomBytes(SALT_LENGTH);
    // 派生密钥
    const key = scryptSync(password, salt, KEY_LENGTH);
    // 生成随机 IV
    const iv = randomBytes(IV_LENGTH);
    // 创建加密器
    const cipher = createCipheriv(ALGORITHM, key, iv);
    // 加密
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
    ]);
    // 获取认证标签
    const tag = cipher.getAuthTag();
    return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        salt: salt.toString('base64'),
        tag: tag.toString('base64')
    };
}
/**
 * 解密文本内容
 * @param encryptedData 加密数据
 * @param password 解密密钥
 */
export function decrypt(encryptedData, password) {
    // 解码
    const encrypted = Buffer.from(encryptedData.encrypted, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');
    // 派生密钥
    const key = scryptSync(password, salt, KEY_LENGTH);
    // 创建解密器
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    // 解密
    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);
    return decrypted.toString('utf8');
}
/**
 * 简便的加密函数 - 返回组合字符串
 * 格式: salt:iv:tag:encrypted（base64）
 */
export function encryptToString(text, password) {
    const result = encrypt(text, password);
    return `${result.salt}:${result.iv}:${result.tag}:${result.encrypted}`;
}
/**
 * 简便的解密函数 - 解析组合字符串
 */
export function decryptFromString(encryptedString, password) {
    const parts = encryptedString.split(':');
    if (parts.length !== 4) {
        throw new Error('Invalid encrypted string format');
    }
    return decrypt({
        salt: parts[0],
        iv: parts[1],
        tag: parts[2],
        encrypted: parts[3]
    }, password);
}
/**
 * 生成加密密钥
 * 用于生成系统级加密密钥
 */
export function generateEncryptionKey() {
    return randomBytes(32).toString('base64');
}
//# sourceMappingURL=encryption.js.map