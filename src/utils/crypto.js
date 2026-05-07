"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomString = generateRandomString;
exports.generateRandomPassword = generateRandomPassword;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.validatePasswordStrength = validatePasswordStrength;
const webCrypto = globalThis.crypto;
async function deriveWebCryptoHash(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await webCrypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await webCrypto.subtle.deriveBits({
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-512',
    }, keyMaterial, 512);
    return Array.from(new Uint8Array(bits)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
/**
 * Generate a random string of specified length
 */
function generateRandomString(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomValues = new Uint8Array(length);
    webCrypto.getRandomValues(randomValues);
    let result = '';
    for (let index = 0; index < length; index += 1) {
        result += charset[randomValues[index] % charset.length];
    }
    return result;
}
/**
 * Generate a random password (uppercase, lowercase, numbers, special chars)
 */
function generateRandomPassword(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    const randomValues = new Uint8Array(length);
    webCrypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        password += charset[randomValues[i] % charset.length];
    }
    return password;
}
/**
 * Hash a password using PBKDF2
 */
async function hashPassword(password, salt) {
    const saltBytes = salt ? Uint8Array.from(salt.match(/.{1,2}/g)?.map((part) => Number.parseInt(part, 16)) ?? []) : webCrypto.getRandomValues(new Uint8Array(32));
    const hash = await deriveWebCryptoHash(password, saltBytes);
    return `${Array.from(saltBytes).map((byte) => byte.toString(16).padStart(2, '0')).join('')}:${hash}`;
}
/**
 * Verify a password against its hash
 */
async function verifyPassword(password, hash) {
    const [salt] = hash.split(':');
    const hashToCheck = await hashPassword(password, salt);
    return hashToCheck === hash;
}
/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
    const feedback = [];
    if (password.length < 12) {
        feedback.push('Password should be at least 12 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        feedback.push('Password should contain uppercase letters');
    }
    if (!/[a-z]/.test(password)) {
        feedback.push('Password should contain lowercase letters');
    }
    if (!/\d/.test(password)) {
        feedback.push('Password should contain numbers');
    }
    if (!/[!@#$%^&*]/.test(password)) {
        feedback.push('Password should contain special characters');
    }
    return {
        isStrong: feedback.length === 0,
        feedback,
    };
}
