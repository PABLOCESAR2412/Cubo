const encode = new TextEncoder();
const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toBase64 = (s: Uint8Array) => btoa(String.fromCharCode(...s));
async function masterKey(master: string) {
  const bytes = fromBase64(master);
  if (bytes.length !== 32) throw new Error("Cifrado no configurado.");
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encryptSecret(value: string, master: string, scope: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encode.encode(scope) },
    await masterKey(master),
    encode.encode(value),
  );
  return { ciphertext: toBase64(new Uint8Array(data)), iv: toBase64(iv) };
}
export async function decryptSecret(
  secret: { ciphertext: string; iv: string },
  master: string,
  scope: string,
) {
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(secret.iv), additionalData: encode.encode(scope) },
      await masterKey(master),
      fromBase64(secret.ciphertext),
    ),
  );
}
