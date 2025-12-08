const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    ['deriveKey', 'deriveBits']
  );
  return keyPair;
}

export async function exportPublicKey(publicKey) {
  const exported = await window.crypto.subtle.exportKey('raw', publicKey);
  return bufferToBase64(exported);
}

export async function importPublicKey(base64Key) {
  const keyData = base64ToBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

export async function exportPrivateKey(privateKey) {
  const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
  return bufferToBase64(exported);
}

export async function importPrivateKey(base64Key) {
  const keyData = base64ToBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
}

export async function deriveSharedKey(privateKey, publicKey) {
  return await window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(message, sharedKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    sharedKey,
    data
  );
  
  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv)
  };
}

export async function decryptMessage(ciphertext, iv, sharedKey) {
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv: base64ToBuffer(iv) },
      sharedKey,
      base64ToBuffer(ciphertext)
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

export async function encryptPrivateKeyWithPassphrase(privateKey, passphrase) {
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const derivedKey = await deriveKeyFromPassphrase(passphrase, salt);
  
  const exportedKey = await window.crypto.subtle.exportKey('pkcs8', privateKey);
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    derivedKey,
    exportedKey
  );
  
  return {
    encryptedKey: bufferToBase64(encrypted),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv)
  };
}

export async function decryptPrivateKeyWithPassphrase(encryptedData, passphrase) {
  try {
    const { encryptedKey, salt, iv } = encryptedData;
    const derivedKey = await deriveKeyFromPassphrase(passphrase, base64ToBuffer(salt));
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv: base64ToBuffer(iv) },
      derivedKey,
      base64ToBuffer(encryptedKey)
    );
    
    return await window.crypto.subtle.importKey(
      'pkcs8',
      decrypted,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );
  } catch (error) {
    console.error('Failed to decrypt private key:', error);
    return null;
  }
}

async function deriveKeyFromPassphrase(passphrase, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function storeKeys(userId, publicKey, privateKey) {
  const keys = { publicKey, privateKey };
  localStorage.setItem(`e2e_keys_${userId}`, JSON.stringify(keys));
}

export function getStoredKeys(userId) {
  const stored = localStorage.getItem(`e2e_keys_${userId}`);
  return stored ? JSON.parse(stored) : null;
}

export function removeStoredKeys(userId) {
  localStorage.removeItem(`e2e_keys_${userId}`);
}

export function storeSessionKey(peerId, sharedKeyData) {
  sessionStorage.setItem(`session_key_${peerId}`, JSON.stringify(sharedKeyData));
}

export function getSessionKey(peerId) {
  const stored = sessionStorage.getItem(`session_key_${peerId}`);
  return stored ? JSON.parse(stored) : null;
}

export async function generateSymmetricKey() {
  return await window.crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportSymmetricKey(key) {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return bufferToBase64(exported);
}

export async function importSymmetricKey(base64Key) {
  const keyData = base64ToBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}
