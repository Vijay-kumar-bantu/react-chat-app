import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	avatar: { type: String, required: true },
	friends: {
		type: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
		default: [],
	},
	requests: {
		type: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
		default: [],
	},
});

export default mongoose.model("user", userSchema);
