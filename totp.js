function base32ToBytes(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  let bytes = [];

  base32 = base32.replace(/=+$/, "").toUpperCase();

  for (let i = 0; i < base32.length; i++) {
    bits += alphabet.indexOf(base32[i]).toString(2).padStart(5, "0");
  }

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }

  return new Uint8Array(bytes);
}

async function generateTOTP(secret) {
  const key = base32ToBytes(secret);
  const counter = Math.floor(Date.now() / 1000 / 30);

  const msg = new ArrayBuffer(8);
  new DataView(msg).setBigUint64(0, BigInt(counter));

  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );

  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, msg));
  const offset = sig[sig.length - 1] & 15;

  const code =
    ((sig[offset] & 127) << 24) |
    (sig[offset + 1] << 16) |
    (sig[offset + 2] << 8) |
    sig[offset + 3];

  return (code % 1000000).toString().padStart(6, "0");
}
