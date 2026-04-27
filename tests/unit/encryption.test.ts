// 加密模块测试

import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, encryptToString, decryptFromString, generateEncryptionKey } from '../../backend/lib/encryption';

describe('Encryption', () => {
  const testPassword = 'test_password_123';
  const testContent = '这是一段需要加密的敏感日记内容';

  describe('encrypt/decrypt', () => {
    it('应该能加密和解密文本', () => {
      const encrypted = encrypt(testContent, testPassword);

      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.tag).toBeDefined();

      const decrypted = decrypt(encrypted, testPassword);
      expect(decrypted).toBe(testContent);
    });

    it('不同密码应该产生不同的加密结果', () => {
      const encrypted1 = encrypt(testContent, 'password1');
      const encrypted2 = encrypt(testContent, 'password2');

      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
    });

    it('应该能处理空字符串', () => {
      const encrypted = encrypt('', testPassword);
      const decrypted = decrypt(encrypted, testPassword);
      expect(decrypted).toBe('');
    });

    it('应该能处理包含特殊字符的文本', () => {
      const specialContent = '特殊字符：!@#$%^&*()_+-=[]{}|;\':",./?<> 中文 日本語 한국어';
      const encrypted = encrypt(specialContent, testPassword);
      const decrypted = decrypt(encrypted, testPassword);
      expect(decrypted).toBe(specialContent);
    });

    it('应该能处理长文本', () => {
      const longContent = '这是一段很长的文本。'.repeat(1000);
      const encrypted = encrypt(longContent, testPassword);
      const decrypted = decrypt(encrypted, testPassword);
      expect(decrypted).toBe(longContent);
    });

    it('使用错误密码解密应该抛出错误', () => {
      const encrypted = encrypt(testContent, testPassword);

      expect(() => {
        decrypt(encrypted, 'wrong_password');
      }).toThrow();
    });

    it('篡改加密内容后解密应该抛出错误', () => {
      const encrypted = encrypt(testContent, testPassword);
      encrypted.encrypted = encrypted.encrypted.substring(0, encrypted.encrypted.length - 5) + 'xxxxx';

      expect(() => {
        decrypt(encrypted, testPassword);
      }).toThrow();
    });
  });

  describe('encryptToString/decryptFromString', () => {
    it('应该能加密和解密组合字符串', () => {
      const encryptedString = encryptToString(testContent, testPassword);

      expect(encryptedString).toContain(':');
      expect(encryptedString.split(':')).toHaveLength(4);

      const decrypted = decryptFromString(encryptedString, testPassword);
      expect(decrypted).toBe(testContent);
    });

    it('应该能处理包含特殊字符的文本', () => {
      const specialContent = 'Line1\nLine2\tTabbed 中文';
      const encryptedString = encryptToString(specialContent, testPassword);
      const decrypted = decryptFromString(encryptedString, testPassword);
      expect(decrypted).toBe(specialContent);
    });

    it('格式错误的加密字符串应该抛出错误', () => {
      expect(() => {
        decryptFromString('invalid_format', testPassword);
      }).toThrow('Invalid encrypted string format');
    });

    it('分割数量不正确的字符串应该抛出错误', () => {
      expect(() => {
        decryptFromString('a:b:c', testPassword);
      }).toThrow('Invalid encrypted string format');
    });
  });

  describe('generateEncryptionKey', () => {
    it('应该生成一个密钥', () => {
      const key = generateEncryptionKey();
      expect(key).toBeDefined();
      expect(key.length).toBeGreaterThan(0);
      expect(typeof key).toBe('string');
    });

    it('每次生成的密钥应该不同', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });

    it('生成的密钥应该能用于加密解密', () => {
      const key = generateEncryptionKey();
      const encrypted = encrypt(testContent, key);
      const decrypted = decrypt(encrypted, key);
      expect(decrypted).toBe(testContent);
    });
  });
});
