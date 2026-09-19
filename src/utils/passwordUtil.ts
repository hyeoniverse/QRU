/**
 * 비회원 명함 비밀번호를 되돌릴 수 없는 형태로 만든다.
 *
 * 브라우저에서 계산하므로 이것만으로 본인 확인이 되지는 않는다.
 * 실제 확인은 서버(Cloud Functions)에서 같은 방식으로 다시 계산해
 * 비교해야 한다. 다만 저장된 값에서 원래 비밀번호를 되돌릴 수는 없다.
 *
 * 이전에는 번들에 포함되는 키로 AES 암호화를 했는데, 키가 공개되는 순간
 * 복호화가 가능해 해싱의 의미가 없었다.
 */
export interface PasswordDigest {
  algorithm: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  hash: string;
}

const ITERATIONS = 150_000;
const HASH_BITS = 256;
const SALT_BYTES = 16;

const toHex = (data: ArrayBuffer | Uint8Array): string => {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const fromHex = (hex: string): Uint8Array =>
  Uint8Array.from(hex.match(/.{2}/g) ?? [], (byte) => parseInt(byte, 16));

const derive = async (password: string, salt: Uint8Array, iterations: number) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    HASH_BITS
  );
};

export const hashPassword = async (password: string): Promise<PasswordDigest> => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);

  return {
    algorithm: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: toHex(salt),
    hash: toHex(hash),
  };
};

/** 저장된 digest 와 비교한다. (서버에서 쓰기 위한 구현) */
export const verifyPassword = async (
  password: string,
  digest: PasswordDigest
): Promise<boolean> => {
  const hash = await derive(password, fromHex(digest.salt), digest.iterations);
  return toHex(hash) === digest.hash;
};
