const PBKDF2_ITERATIONS = 600000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

// --- Data Conversion Helper Functions ---

/**
 * Converts an ArrayBuffer (binary format) to a Base64 string (for JSON transmission).
 * @param {ArrayBuffer} buffer The buffer to convert.
 * @returns {string} The Base64 encoded string.
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Converts a string to an ArrayBuffer (to prepare it for encryption).
 * @param {string} str The string to convert.
 * @returns {ArrayBuffer} The ArrayBuffer representation.
 */
function stringToArrayBuffer(str) {
  return new TextEncoder().encode(str);
}


// --- Core Cryptographic Logic ---

/**
 * Derives a cryptographic key from a password and a salt using PBKDF2.
 * Used for both the Key Encryption Key (KEK) and the verification hash.
 * @param {string} password The user's password.
 * @param {Uint8Array} salt The random salt.
 * @param {string[]} keyUsage The allowed operations for the derived key (e.g., ['encrypt', 'decrypt']).
 * @returns {Promise<CryptoKey>} The derived key as a CryptoKey object.
 */
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

/**
 * Encrypts data using an AES-GCM key.
 * Prepends the Initialization Vector (IV) to the ciphertext as per the design.
 * @param {ArrayBuffer} data The data to encrypt.
 * @param {CryptoKey} key The encryption key (either the DEK or KEK).
 * @returns {Promise<ArrayBuffer>} A buffer containing the IV + ciphertext.
 */
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

  // Combine IV and ciphertext into a single buffer: [IV, ...encryptedData]
  const result = new Uint8Array(iv.length + encryptedData.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encryptedData), iv.length);

  return result.buffer;
}

/**
 * The main orchestrator function that follows your diagram step-by-step.
 * @param {string} secret The plaintext secret from the user.
 * @param {string} recoveryPassword The recovery password from the user.
 * @returns {Promise<object>} An object containing all cryptographic artifacts, ready to be sent to the API.
 */
export async function encryptAndPreparePayload(secret, recoveryPassword) {
  const dek = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const saltKek = window.crypto.getRandomValues(new Uint8Array(SALT_BYTES)); // Salt for the KEK
  const saltCr = window.crypto.getRandomValues(new Uint8Array(SALT_BYTES));  // Salt for the Recovery Password Hash

  const secretBuffer = stringToArrayBuffer(secret);
  const encryptedSecret = await encryptData(secretBuffer, dek);

  const kek = await deriveKeyFromPassword(recoveryPassword, saltKek, ['encrypt', 'decrypt']);

  const exportedDek = await window.crypto.subtle.exportKey('raw', dek);
  const encryptedDek = await encryptData(exportedDek, kek);

  const passwordHashCrKey = await deriveKeyFromPassword(recoveryPassword, saltCr, ['encrypt']); // Key usage is irrelevant here; we just need the raw bits.
  const passwordHashCr = await window.crypto.subtle.exportKey('raw', passwordHashCrKey);

  return {
    encryptedSecret: arrayBufferToBase64(encryptedSecret),
    encryptedDek: arrayBufferToBase64(encryptedDek),
    saltKek: arrayBufferToBase64(saltKek),
    saltCr: arrayBufferToBase64(saltCr),
    passwordHashCr: arrayBufferToBase64(passwordHashCr),
  };
}