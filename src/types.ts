import { WebSocket } from "ws";

interface client {
	[key: number]: WebSocket;
}

export { client };
