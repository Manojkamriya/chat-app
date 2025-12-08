import { encode, decode } from '@msgpack/msgpack';

export function packMessage(data) {
  try {
    const encoded = encode(data);
    return encoded;
  } catch (error) {
    console.error('MessagePack encode error:', error);
    return null;
  }
}

export function unpackMessage(data) {
  try {
    if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      return decode(data);
    }
    return data;
  } catch (error) {
    console.error('MessagePack decode error:', error);
    return null;
  }
}

export function compressMessage(message) {
  const compressed = {
    m: message.message,
    s: message.sender_id || message.sender,
    r: message.receiver_id || message.receiver,
    t: message.timestamp,
    st: message.status,
    id: message.id,
  };
  
  if (message.reactions && Object.keys(message.reactions).length > 0) {
    compressed.rx = message.reactions;
  }
  
  if (message.ciphertext) {
    compressed.ct = message.ciphertext;
    compressed.iv = message.iv;
    compressed.enc = message.encrypted;
    compressed.v = message.version;
  }
  
  if (message.sender_avatar) {
    compressed.av = message.sender_avatar;
  }
  
  return compressed;
}

export function decompressMessage(compressed) {
  return {
    id: compressed.id,
    message: compressed.m,
    sender: compressed.s,
    sender_id: compressed.s,
    receiver: compressed.r,
    receiver_id: compressed.r,
    timestamp: compressed.t,
    status: compressed.st,
    reactions: compressed.rx || {},
    ciphertext: compressed.ct,
    iv: compressed.iv,
    encrypted: compressed.enc,
    version: compressed.v,
    sender_avatar: compressed.av,
    senderAvatar: compressed.av,
  };
}

export function estimateJSONSize(data) {
  return new Blob([JSON.stringify(data)]).size;
}

export function estimateMessagePackSize(data) {
  const encoded = encode(data);
  return encoded.byteLength;
}

export function getSizeReduction(data) {
  const jsonSize = estimateJSONSize(data);
  const msgpackSize = estimateMessagePackSize(data);
  const reduction = ((jsonSize - msgpackSize) / jsonSize * 100).toFixed(1);
  return {
    jsonSize,
    msgpackSize,
    reduction: `${reduction}%`
  };
}
