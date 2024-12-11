import { WebSocketServer, WebSocket } from "ws";
import { client } from "./types";
import express from "express";
import mongoose from "mongoose";
import user from "./schema/user";
import cors from "cors";
import "dotenv/config";
import { encrypt, decrypt } from "./aes";

const app = express();

//connecting to mongodb
mongoose
	.connect(process.env.MONGODB_URL || "")
	.then(() => console.log("Connected to MongoDB"))
	.catch((err) => console.log(err));

//middlewares for express server
app.use(express.json());
app.use(cors({ origin: "*" }));

//express routes
app.get("/", (req, res) => {
	res.send("Hello World!");
});

/*login route */
app.post("/login", async (req, res) => {
	const { email, password } = req.body;
	const customer = await user
		.findOne({ email: email })
		.populate({ path: "friends", select: "_id name email avatar" })
		.populate({ path: "requests", select: "_id name email avatar" });

	if (customer) {
		if (password === decrypt(customer.password)) {
			res.status(200).send({
				id: customer._id,
				name: customer.name,
				email: customer.email,
				avatar: customer.avatar,
				friends: customer.friends,
				requests: customer.requests,
			});
		} else {
			res.status(400).send("Email or Password incorrect");
		}
	} else {
		res.status(404).send("User not found");
	}
});

/*register route */
app.post("/register", async (req, res) => {
	const { name, email, password } = req.body;
	const encryptedPassword = encrypt(password);
	const avatar = `https://ui-avatars.com/api/?name=${name
		.split(" ")
		.join("+")}&background=random&rounded=true`;
	if (await user.findOne({ email: email })) {
		res.status(400).send("Email already exists");
	} else {
		user
			.create({ name, email, password: encryptedPassword, avatar })
			.then(() => {
				res.send("user registered");
			})
			.catch((err) => {
				res.status(400).send("server error");
				console.log(err);
			});
	}
});

/* Sending requests */
app.post("/send-request", async (req, res) => {
	const { id, friendId } = req.body;
	const friend = await user.findById(friendId);
	try {
		if (friend) {
			friend.requests.push(id);
			await friend.save();
			res.status(200).send("Friend request sent");
		} else {
			res.status(404).send("User not found");
		}
	} catch (err) {
		res.status(400).send("Server error");
	}
});

/*Accepting the requests */
app.post("/add-friend", async (req, res) => {
	const { id, friendId } = req.body;
	const customer = await user.findById(id);
	try {
		if (customer) {
			customer.friends.push(friendId);
			customer.requests = customer.requests.filter(
				(data) => data.toString() !== friendId
			);
			await customer.save();
			res.status(200).send("Friend request accepted");
		} else {
			res.status(400).send("Server error");
		}
	} catch (err) {
		res.status(400).send("Server error");
	}
});

//setting up the websocket server with express server
const wss = new WebSocketServer({
	server: app.listen(process.env.SERVER_PORT, () =>
		console.log(`Listening on port ${process.env.SERVER_PORT}`)
	),
});

const clients: client = {};

//websocket events
wss.on("connection", function connection(ws: WebSocket) {
	ws.on("error", (err) => {
		console.log(err);
	});

	ws.on("message", function message(data) {
		const message = JSON.parse(String(data));
		switch (message.type) {
			case "connect":
				clients[message.id] = ws;
				ws.send("user added");
				break;
			case "message":
				if (clients[message.to]) {
					clients[message.to]?.send(JSON.stringify(message));
				} else {
					ws.send("user is offline");
				}
				break;
			default:
				console.log("Error");
		}
	});

	ws.on("close", () => {
		Object.keys(clients).forEach((key: any) => {
			if (clients[key] === ws) {
				delete clients[key];
				console.log("Client disconnected");
			}
		});
	});
});
