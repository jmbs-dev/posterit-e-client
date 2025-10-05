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
