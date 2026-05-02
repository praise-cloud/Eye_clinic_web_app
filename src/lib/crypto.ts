const ALGORITHM = 'AES-GCM'

async function getKey(): Promise<CryptoKey> {
    const salt = import.meta.env.VITE_APP_ENCRYPTION_SALT
    if (!salt) {
        throw new Error('Encryption salt is required. Please set VITE_APP_ENCRYPTION_SALT environment variable.')
    }
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(salt),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    )
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: new TextEncoder().encode('eyeclinic-v1'), iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: ALGORITHM, length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}

export async function encryptText(plaintext: string): Promise<string> {
    const key = await getKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        new TextEncoder().encode(plaintext)
    )
    const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)])
    return btoa(String.fromCharCode(...combined))
}

export async function decryptText(ciphertext: string): Promise<string> {
    try {
        const key = await getKey()
        const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
        const iv = combined.slice(0, 12)
        const data = combined.slice(12)
        const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, data)
        return new TextDecoder().decode(decrypted)
    } catch {
        return ciphertext // return as-is if not encrypted
    }
}
