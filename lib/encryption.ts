/**
 * Encriptación AES-256-GCM para documentos legales sensibles.
 * La clave se almacena en variables de entorno — nunca en el código.
 */

const ALGO = "aes-256-gcm"
const KEY_HEX = process.env.DOCUMENT_ENCRYPTION_KEY ?? ""

function getKey(): Buffer {
  if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error(
      "DOCUMENT_ENCRYPTION_KEY inválida. Debe ser una cadena hex de 64 caracteres (32 bytes)."
    )
  }
  return Buffer.from(KEY_HEX, "hex")
}

/**
 * Encripta un buffer de archivo.
 * Retorna: IV (12 bytes) + AuthTag (16 bytes) + datos encriptados — todo concatenado.
 */
export function encryptBuffer(plainBuffer: Buffer): Buffer {
  const { createCipheriv, randomBytes } = require("crypto")
  const key = getKey()
  const iv = randomBytes(12) // 96 bits para GCM
  const cipher = createCipheriv(ALGO, key, iv)

  const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()])
  const authTag = cipher.getAuthTag() // 16 bytes

  // Formato: [IV 12b][AuthTag 16b][datos encriptados]
  return Buffer.concat([iv, authTag, encrypted])
}

/**
 * Desencripta un buffer previamente encriptado con encryptBuffer.
 */
export function decryptBuffer(encryptedBuffer: Buffer): Buffer {
  const { createDecipheriv } = require("crypto")
  const key = getKey()

  const iv = encryptedBuffer.subarray(0, 12)
  const authTag = encryptedBuffer.subarray(12, 28)
  const ciphertext = encryptedBuffer.subarray(28)

  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

/**
 * Genera una clave nueva para poner en .env.
 * Ejecutar una sola vez: node -e "require('./lib/encryption').generateKey()"
 */
export function generateKey(): void {
  const { randomBytes } = require("crypto")
  console.log("Nueva DOCUMENT_ENCRYPTION_KEY:")
  console.log(randomBytes(32).toString("hex"))
}
