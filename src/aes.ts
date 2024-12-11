import CryptoJS from "crypto-js";
import "dotenv/config";

const encrypt = (message: string) => {
	const encryptedText = CryptoJS.AES.encrypt(
		message,
		process.env.SECRET_KEY || ""
	).toString();

	return encryptedText;
};

const decrypt = (encryptedMessage: string) => {
	const bytes = CryptoJS.AES.decrypt(
		encryptedMessage,
		process.env.SECRET_KEY || ""
	);

	return bytes.toString(CryptoJS.enc.Utf8);
};

export { encrypt, decrypt };
