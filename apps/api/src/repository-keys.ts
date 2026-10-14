import { D1RepositoryStore } from "@cubo/database";

const encoder = new TextEncoder();
const concat = (...values: Uint8Array[]) => {
  const out = new Uint8Array(values.reduce((n, v) => n + v.length, 0));
  let offset = 0;
  for (const value of values) {
    out.set(value, offset);
    offset += value.length;
  }
  return out;
};
const number = (value: number) => {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value);
  return out;
};
const field = (value: Uint8Array) => concat(number(value.length), value);
const base64 = (value: Uint8Array) => btoa(String.fromCharCode(...value));
const decode = (value: string) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
async function encryptionKey(value: string): Promise<CryptoKey> {
  const raw = decode(value);
  if (raw.length !== 32) throw new Error("Clave maestra inválida.");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function generateProjectKey(db: D1Database, projectId: string, master: string) {
  const store = new D1RepositoryStore(db);
  const existing = await store.key(projectId);
  if (existing) return existing;
  const pair = (await crypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const publicRaw = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  if (!privateJwk.d) throw new Error("Clave no exportable.");
  const seed = decode(`${privateJwk.d.replace(/-/g, "+").replace(/_/g, "/")}=`);
  const publicBlob = concat(field(encoder.encode("ssh-ed25519")), field(publicRaw));
  const check = crypto.getRandomValues(new Uint32Array(1))[0];
  let privateBlob = concat(
    number(check),
    number(check),
    field(encoder.encode("ssh-ed25519")),
    field(publicRaw),
    field(concat(seed, publicRaw)),
    field(encoder.encode(`cubo-${projectId}`)),
  );
  const padding = 8 - (privateBlob.length % 8);
  privateBlob = concat(
    privateBlob,
    Uint8Array.from({ length: padding }, (_, i) => i + 1),
  );
  const blob = concat(
    encoder.encode("openssh-key-v1\0"),
    field(encoder.encode("none")),
    field(encoder.encode("none")),
    field(new Uint8Array()),
    number(1),
    field(publicBlob),
    field(privateBlob),
  );
  const privateKey = `-----BEGIN OPENSSH PRIVATE KEY-----\n${base64(blob)
    .match(/.{1,70}/g)
    ?.join("\n")}\n-----END OPENSSH PRIVATE KEY-----\n`;
  const id = crypto.randomUUID(),
    iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(`${projectId}:${id}`) },
    await encryptionKey(master),
    encoder.encode(privateKey),
  );
  return store.saveKey({
    id,
    projectId,
    publicKey: `ssh-ed25519 ${base64(publicBlob)} cubo-${projectId}`,
    fingerprint: `SHA256:${base64(new Uint8Array(await crypto.subtle.digest("SHA-256", publicBlob))).replace(/=+$/, "")}`,
    ciphertext: base64(new Uint8Array(encrypted)),
    iv: base64(iv),
    createdAt: new Date().toISOString(),
  });
}
export async function decryptProjectKey(
  key: Awaited<ReturnType<D1RepositoryStore["key"]>>,
  master: string,
): Promise<string> {
  if (!key) throw new Error("Conexión no configurada.");
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decode(key.iv),
        additionalData: encoder.encode(`${key.projectId}:${key.id}`),
      },
      await encryptionKey(master),
      decode(key.ciphertext),
    ),
  );
}
