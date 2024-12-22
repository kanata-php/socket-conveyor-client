
class Conveyor {
    constructor(options) {
        this.options = {
            protocol: 'ws',
            uri: '127.0.0.1',
            port: 8000,
            token: null,
            query: '',
            channel: null,
            onOpen: (e) => this.onOpen(e),
            onReady: () => {},
            onMessage: () => {},
            onRawMessage: () => {},
            onClose: (e) => this.onClose(e),
            onCloseCallback: () => {},
            onError: () => {},
            reconnect: false,
            reconnectDelay: 5000,
            heartBeat: true,
            heartBeatInterval: 10000,
            healthCheckInterval: 3000,
            userId: null,
            acknowledge: false,
            ...options
        };

        this.ws = null;
        this.start();

        // Last 20 messages with ack status
        this.messages = [];

        if (this.options.reconnect) {
            this.healthCheckInterval = setInterval(() => {
                if (this.isClosed()) {
                    this.onClose();
                }
            }, this.options.healthCheckInterval);
        }
    }

    isClosed() {
        return !this.ws || this.ws.readyState === WebSocket.CLOSED;
    }

    start() {
        if (!this.isClosed()) {
            return;
        }

        let url = `${this.options.protocol}://${this.options.uri}:${this.options.port}`;

        if (this.options.token) url += `?token=${this.options.token}`;
        if (this.options.token && this.options.query.length > 0) url += `&${this.options.query}`;
        if (!this.options.token && this.options.query.length > 0) url += `?${this.options.query}`;
        console.log(url);

        this.ws = new WebSocket(url);
        this.bindEvents();
    }

    bindEvents() {
        this.ws.onopen = this.options.onOpen;
        this.ws.onclose = this.options.onClose;
        this.ws.onerror = this.options.onError;
        this.ws.onmessage = (e) => this.baseOnMessage(e);
    }

    onOpen(e) {
        if (this.options.userId !== null) {
            this.assocUser(this.options.userId);
        }
        this.connectChannel();
        this.startHeartBeat();
        this.options.onReady();
    }

    onClose(e) {
        if (this.ws) {
            this.ws = null;
        }

        this.options.onCloseCallback();
        if (this.options.reconnect) {
            setTimeout(() => this.start(), this.options.reconnectDelay);
        }
    }

    baseOnMessage(e) {
        const parsedData = JSON.parse(e.data);

        if (this.options.acknowledge) {
            this.messages.map((message, index) => {
                if (parsedData.data === message.id) {
                    this.messages[index].ack = true;
                }
            });
        }

        this.options.onRawMessage(e.data);
        this.options.onMessage(parsedData.data, parsedData.fd);
    }

    send(message, action = 'base-action') {
        let data = {
            action,
            data: message,
        };

        if (!this.options.acknowledge) {
            this.rawSend(JSON.stringify(data));
            return;
        }

        data.id = crypto.randomUUID();

        if (this.messages.length >= 20) this.messages.shift();

        this.messages.push({
            id: data.id,
            data,
            ack: false,
        });

        this.rawSend(JSON.stringify(data));
    }

    rawSend(message) {
        if (this.isClosed()) {
            return;
        }

        this.ws.send(message);
    }

    connectChannel() {
        if (this.options.channel === null) {
            return;
        }

        this.rawSend(JSON.stringify({
            action: 'channel-connect',
            channel: this.options.channel,
            auth: this.options.token,
        }));
    }

    assocUser(userId) {
        this.rawSend(JSON.stringify({
            action: 'assoc-user-to-fd-action',
            userId,
        }));
    }

    startHeartBeat() {
        if (!this.options.heartBeat) {
            return;
        }

        this.heartBeatInterval = setInterval(() => {
            const pingFrame = new Uint8Array(2);
            pingFrame[0] = 0x89;
            pingFrame[1] = 0x00;
            this.ws.send(pingFrame);
        }, this.options.heartBeatInterval);
    }
}

export default Conveyor;
