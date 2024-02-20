const crypto = require("crypto");

const generateSalt = () => crypto.randomBytes(saltSize);

/**
 * パスワードハッシュ値計算
 * @param {String} plain
 * @param {Buffer} salt
 * @return {Buffer}
 */
const calcHash = (plain, salt) => {
    const normalized = plain.normalize();
    const hash = crypto.scryptSync(normalized, salt, keyLen, { N, maxmem });
    if (!hash) {
        throw Error("ハッシュ計算エラー");
    }
    return hash;
};

module.exports = {
    generateSalt,
    calcHash
};