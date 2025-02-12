import { aes } from '@internxt/lib';
import kemBuilder from '@dashlane/pqc-kem-kyber512-browser';
import { Auth } from "@internxt/sdk";
import { pbkdf2Sync, createHash, createDecipheriv, randomBytes, createCipheriv } from 'crypto';

export function getAesInitFromEnv() {
    return { iv: "d139cb9a2cd17092e79e1861cf9d7023", salt: "38dce0391b49efba88dbc8c39ebf868f0267eb110bb0012ab27dc52a528d61b1d1ed9d76f400ff58e3240028442b1eab9bb84e111d9dadd997982dbde9dbd25e" };
}

export async function getOpenpgp() {
    return import('openpgp');
}

export async function generateNewKeys() {
    const openpgp = await getOpenpgp();

    const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
        userIDs: [{ email: 'inxt@inxt.com' }],
        curve: 'ed25519',
    });

    const kem = await kemBuilder();
    const { publicKey: publicKyberKey, privateKey: privateKyberKey } = await kem.keypair();

    return {
        privateKeyArmored: privateKey,
        publicKeyArmored: Buffer.from(publicKey).toString('base64'),
        revocationCertificate: Buffer.from(revocationCertificate).toString('base64'),
        publicKyberKeyBase64: Buffer.from(publicKyberKey).toString('base64'),
        privateKyberKeyBase64: Buffer.from(privateKyberKey).toString('base64'),
    };
}

export async function getKeys(password) {
    const { privateKeyArmored, publicKeyArmored, revocationCertificate, publicKyberKeyBase64, privateKyberKeyBase64 } = await generateNewKeys();
    const encPrivateKey = aes.encrypt(privateKeyArmored, password, getAesInitFromEnv());
    const encPrivateKyberKey = aes.encrypt(privateKyberKeyBase64, password, getAesInitFromEnv());

    return {
        privateKeyEncrypted: encPrivateKey,
        publicKey: publicKeyArmored,
        revocationCertificate: revocationCertificate,
        ecc: {
            privateKeyEncrypted: encPrivateKey,
            publicKey: publicKeyArmored,
        },
        kyber: {
            publicKey: publicKyberKeyBase64,
            privateKeyEncrypted: encPrivateKyberKey,
        },
    };
}

function passToHash(passObject) {
    const salt = passObject.salt ? passObject.salt : randomBytes(128 / 8).toString('hex');
    const hash = pbkdf2Sync(passObject.password, Buffer.from(salt, 'hex'), 10000, 256 / 8, 'sha1').toString('hex');

    return {
        salt: salt.toString(),
        hash: hash.toString(),
    };
}

function getKeyAndIvFrom(secret, salt) {
    const TRANSFORM_ROUNDS = 3;
    const password = Buffer.concat([Buffer.from(secret, 'binary'), Buffer.from(salt)]);
    const md5Hashes = [];
    let digest = password;

    for (let i = 0; i < TRANSFORM_ROUNDS; i++) {
        md5Hashes[i] = createHash('md5').update(digest).digest();
        digest = Buffer.concat([md5Hashes[i], password]);
    }

    const key = Buffer.concat([md5Hashes[0], md5Hashes[1]]);
    const iv = md5Hashes[2];
    return { key, iv };
}

function encryptTextWithKey(textToEncrypt, secret) {
    const salt = randomBytes(8);
    const { key, iv } = getKeyAndIvFrom(secret, salt);

    const cipher = createCipheriv('aes-256-cbc', key, iv);

    const encrypted = Buffer.concat([cipher.update(textToEncrypt, 'utf8'), cipher.final()]);
    const openSSLstart = Buffer.from('Salted__');

    return Buffer.concat([openSSLstart, salt, encrypted]).toString('hex');
}

function decryptTextWithKey(encryptedText, secret) {
    const cypherText = Buffer.from(encryptedText, 'hex');
    const salt = cypherText.subarray(8, 16);

    const { key, iv } = getKeyAndIvFrom(secret, salt);

    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    const contentsToDecrypt = cypherText.subarray(16);

    return Buffer.concat([decipher.update(contentsToDecrypt), decipher.final()]).toString('utf8');
}

function encryptText(textToEncrypt) {
    return encryptTextWithKey(textToEncrypt, "6KYQBP847D4ATSFA");
}

function decryptText(encryptedText) {
    return decryptTextWithKey(encryptedText, "6KYQBP847D4ATSFA");
}

const cryptoProvider = {
    encryptPasswordHash(password, encryptedSalt) {
        const salt = decryptText(encryptedSalt);
        const hashObj = passToHash({ password, salt });
        return encryptText(hashObj.hash);
    },
    async generateKeys(password) {
        return getKeys(password);
    },
};

export { Auth, cryptoProvider };
