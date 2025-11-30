// src/crypto/crypto.js
// Centraliza funciones criptográficas y helpers

const PBKDF2_ITERATIONS = 600000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function stringToArrayBuffer(str) {
  return new TextEncoder().encode(str);
}

async function deriveKeyFromPassword(password, salt, keyUsage) {
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    keyUsage
  );
}

async function encryptData(data, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );
  const result = new Uint8Array(iv.length + encryptedData.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encryptedData), iv.length);
  return result.buffer;
}

function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function decryptData(encrypted, key) {
  const encryptedBytes = new Uint8Array(base64ToArrayBuffer(encrypted));
  const iv = encryptedBytes.slice(0, 12); // IV_BYTES = 12
  const ciphertext = encryptedBytes.slice(12);
  return await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );
}

export async function encryptAndPreparePayload(secret, recoveryPassword) {
  const dek = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const saltKek = window.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const saltCr = window.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const secretBuffer = stringToArrayBuffer(secret);
  const encryptedSecret = await encryptData(secretBuffer, dek);
  const kek = await deriveKeyFromPassword(recoveryPassword, saltKek, ['encrypt', 'decrypt']);
  const exportedDek = await window.crypto.subtle.exportKey('raw', dek);
  const encryptedDek = await encryptData(exportedDek, kek);
  const passwordHashCrKey = await deriveKeyFromPassword(recoveryPassword, saltCr, ['encrypt']);
  const passwordHashCr = await window.crypto.subtle.exportKey('raw', passwordHashCrKey);
  return {
    encryptedSecret: arrayBufferToBase64(encryptedSecret),
    encryptedDek: arrayBufferToBase64(encryptedDek),
    saltKek: arrayBufferToBase64(saltKek),
    saltCr: arrayBufferToBase64(saltCr),
    passwordHashCr: arrayBufferToBase64(passwordHashCr),
  };
}

export async function decryptSecret(password, saltKekBase64, encryptedDekBase64, encryptedSecretBase64) {
  // 1. Decode base64 to ArrayBuffer
  const saltKek = new Uint8Array(base64ToArrayBuffer(saltKekBase64));
  // 2. Derive KEK from password and saltKek
  const kek = await deriveKeyFromPassword(password, saltKek, ['decrypt']);
  // 3. Decrypt DEK
  const exportedDekRaw = await decryptData(encryptedDekBase64, kek);
  // 4. Import DEK
  const dek = await window.crypto.subtle.importKey(
    'raw',
    exportedDekRaw,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  );
  // 5. Decrypt secret
  const secretBuffer = await decryptData(encryptedSecretBase64, dek);
  // 6. Convert ArrayBuffer to string
  return new TextDecoder().decode(secretBuffer);
}
