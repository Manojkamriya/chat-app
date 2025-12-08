import { useState, useCallback, useEffect, useRef } from 'react';
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  exportPrivateKey,
  importPrivateKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  encryptPrivateKeyWithPassphrase,
  decryptPrivateKeyWithPassphrase,
  storeKeys,
  getStoredKeys,
  removeStoredKeys
} from '../utils/crypto';

const ENCRYPTION_VERSION = 1;

export function useCrypto(userId, socket, onKeyBackupNeeded) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [hasBackup, setHasBackup] = useState(false);
  const sharedKeysRef = useRef(new Map());
  const peerPublicKeysRef = useRef(new Map());

  const initializeKeys = useCallback(async () => {
    if (!userId) return;

    const storedKeys = getStoredKeys(userId);
    
    if (storedKeys) {
      try {
        const privKey = await importPrivateKey(storedKeys.privateKey);
        const pubKey = await importPublicKey(storedKeys.publicKey);
        setPrivateKey(privKey);
        setPublicKey(pubKey);
        setIsInitialized(true);
        
        if (socket) {
          socket.emit('registerPublicKey', { 
            publicKey: storedKeys.publicKey,
            version: ENCRYPTION_VERSION 
          });
        }
        return;
      } catch (error) {
        console.error('Failed to load stored keys:', error);
        removeStoredKeys(userId);
      }
    }

    try {
      const keyPair = await generateKeyPair();
      const exportedPublic = await exportPublicKey(keyPair.publicKey);
      const exportedPrivate = await exportPrivateKey(keyPair.privateKey);
      
      storeKeys(userId, exportedPublic, exportedPrivate);
      
      setPrivateKey(keyPair.privateKey);
      setPublicKey(keyPair.publicKey);
      setIsInitialized(true);
      
      if (socket) {
        socket.emit('registerPublicKey', { 
          publicKey: exportedPublic,
          version: ENCRYPTION_VERSION 
        });
      }
      
      if (onKeyBackupNeeded) {
        onKeyBackupNeeded();
      }
    } catch (error) {
      console.error('Failed to generate keys:', error);
    }
  }, [userId, socket, onKeyBackupNeeded]);

  useEffect(() => {
    if (userId) {
      initializeKeys();
    }
  }, [userId, initializeKeys]);

  useEffect(() => {
    if (!socket || !isInitialized) return;

    const handlePeerPublicKey = async ({ peerId, publicKey: peerPubKey }) => {
      try {
        const importedKey = await importPublicKey(peerPubKey);
        peerPublicKeysRef.current.set(peerId, importedKey);
        
        if (privateKey) {
          const sharedKey = await deriveSharedKey(privateKey, importedKey);
          sharedKeysRef.current.set(peerId, sharedKey);
        }
      } catch (error) {
        console.error('Failed to process peer public key:', error);
      }
    };

    socket.on('peerPublicKey', handlePeerPublicKey);

    return () => {
      socket.off('peerPublicKey', handlePeerPublicKey);
    };
  }, [socket, isInitialized, privateKey]);

  const getSharedKeyForPeer = useCallback(async (peerId, peerPublicKeyBase64) => {
    if (sharedKeysRef.current.has(peerId)) {
      return sharedKeysRef.current.get(peerId);
    }

    if (!privateKey) {
      throw new Error('Private key not initialized');
    }

    let peerPubKey = peerPublicKeysRef.current.get(peerId);
    
    if (!peerPubKey && peerPublicKeyBase64) {
      peerPubKey = await importPublicKey(peerPublicKeyBase64);
      peerPublicKeysRef.current.set(peerId, peerPubKey);
    }

    if (!peerPubKey) {
      throw new Error('Peer public key not available');
    }

    const sharedKey = await deriveSharedKey(privateKey, peerPubKey);
    sharedKeysRef.current.set(peerId, sharedKey);
    
    return sharedKey;
  }, [privateKey]);

  const encrypt = useCallback(async (message, peerId) => {
    if (!isInitialized) {
      return { plaintext: message, encrypted: false };
    }

    try {
      const sharedKey = await getSharedKeyForPeer(peerId);
      const { ciphertext, iv } = await encryptMessage(message, sharedKey);
      
      return {
        ciphertext,
        iv,
        version: ENCRYPTION_VERSION,
        encrypted: true
      };
    } catch (error) {
      console.warn('Encryption failed, sending plaintext:', error);
      return { plaintext: message, encrypted: false };
    }
  }, [isInitialized, getSharedKeyForPeer]);

  const decrypt = useCallback(async (encryptedData, senderId) => {
    if (!isInitialized || !encryptedData.encrypted) {
      return encryptedData.plaintext || encryptedData.message;
    }

    try {
      const sharedKey = await getSharedKeyForPeer(senderId);
      const decrypted = await decryptMessage(
        encryptedData.ciphertext,
        encryptedData.iv,
        sharedKey
      );
      
      if (decrypted === null) {
        return '[Unable to decrypt message]';
      }
      
      return decrypted;
    } catch (error) {
      console.warn('Decryption failed:', error);
      return '[Unable to decrypt message]';
    }
  }, [isInitialized, getSharedKeyForPeer]);

  const backupKeys = useCallback(async (passphrase) => {
    if (!privateKey || !publicKey) {
      throw new Error('Keys not initialized');
    }

    const encryptedData = await encryptPrivateKeyWithPassphrase(privateKey, passphrase);
    const exportedPublic = await exportPublicKey(publicKey);
    
    return {
      publicKey: exportedPublic,
      ...encryptedData
    };
  }, [privateKey, publicKey]);

  const restoreKeys = useCallback(async (backupData, passphrase) => {
    try {
      const restoredPrivateKey = await decryptPrivateKeyWithPassphrase(backupData, passphrase);
      
      if (!restoredPrivateKey) {
        throw new Error('Invalid passphrase');
      }

      const restoredPublicKey = await importPublicKey(backupData.publicKey);
      const exportedPrivate = await exportPrivateKey(restoredPrivateKey);
      
      storeKeys(userId, backupData.publicKey, exportedPrivate);
      
      setPrivateKey(restoredPrivateKey);
      setPublicKey(restoredPublicKey);
      setHasBackup(true);
      setIsInitialized(true);
      
      if (socket) {
        socket.emit('registerPublicKey', { 
          publicKey: backupData.publicKey,
          version: ENCRYPTION_VERSION 
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to restore keys:', error);
      return false;
    }
  }, [userId, socket]);

  const requestPeerPublicKey = useCallback((peerId) => {
    if (socket) {
      socket.emit('requestPublicKey', { peerId });
    }
  }, [socket]);

  const getPublicKeyBase64 = useCallback(async () => {
    if (!publicKey) return null;
    return await exportPublicKey(publicKey);
  }, [publicKey]);

  return {
    isInitialized,
    hasBackup,
    encrypt,
    decrypt,
    backupKeys,
    restoreKeys,
    requestPeerPublicKey,
    getPublicKeyBase64
  };
}

export default useCrypto;
