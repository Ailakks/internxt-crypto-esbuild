import CryptoJS from 'crypto-js';
import { aes } from '@internxt/lib';
import kemBuilder from '@dashlane/pqc-kem-kyber512-browser';
import { Auth } from "@internxt/sdk";
import { Buffer } from 'buffer';

globalThis.Buffer = Buffer;

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
    const salt = passObject.salt ? CryptoJS.enc.Hex.parse(passObject.salt) : CryptoJS.lib.WordArray.random(128 / 8);
    const hash = CryptoJS.PBKDF2(passObject.password, salt, { keySize: 256 / 32, iterations: 10000 });

    return {
        salt: salt.toString(),
        hash: hash.toString(),
    };
}

function encryptTextWithKey(textToEncrypt, keyToEncrypt) {
    const bytes = CryptoJS.AES.encrypt(textToEncrypt, keyToEncrypt).toString();
    const text64 = CryptoJS.enc.Base64.parse(bytes);

    return text64.toString(CryptoJS.enc.Hex);
}

function decryptTextWithKey(encryptedText, keyToDecrypt) {
    if (!keyToDecrypt) {
        throw new Error('No key defined. Check .env file');
    }

    const reb = CryptoJS.enc.Hex.parse(encryptedText);
    const bytes = CryptoJS.AES.decrypt(reb.toString(CryptoJS.enc.Base64), keyToDecrypt);

    return bytes.toString(CryptoJS.enc.Utf8);
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
