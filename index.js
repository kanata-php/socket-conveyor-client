
class Conveyor {
    constructor(options) {
        this.options = {
            protocol: 'ws',
            uri: '127.0.0.1',
            port: 8000,
            query: '',
            channel: null,
            listen: [],
            onOpen: (e) => this.onOpen(e),
            onReady: () => {},
            onMessage: () => {},
            onRawMessage: () => {},
            onClose: (e) => this.onClose(e),
            onCloseCallback: () => {},
            onError: () => {},
            reconnect: false,
            reconnectDelay: 5000,
            healthCheckInterval: 3000,
            ...options
        };

        this.ws = null;
        this.start();

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

        this.ws = new WebSocket(`${this.options.protocol}://${this.options.uri}:${this.options.port}${this.options.query}`);
        this.bindEvents();
    }

    bindEvents() {
        this.ws.onopen = this.options.onOpen;
        this.ws.onclose = this.options.onClose;
        this.ws.onerror = this.options.onError;
        this.ws.onmessage = (e) => this.baseOnMessage(e);
    }

    onOpen(e) {
        this.connectChannel();
        this.addListeners();
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
        this.options.onRawMessage(e.data);
        const parsedData = JSON.parse(e.data);
        this.options.onMessage(parsedData.data);
    }

    send(message, action = 'base-action') {
        this.rawSend(JSON.stringify({ action, data: message }));
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
        this.rawSend(JSON.stringify({ action: 'channel-connect', channel: this.options.channel }));
    }

    addListeners() {
        if (!Array.isArray(this.options.listen)) {
            console.error('"listen" option must be an array.');
            return;
        }
        this.options.listen.forEach((action) => this.listen(action));
    }

    assocUser(userId) {
        this.rawSend(JSON.stringify({ action: 'assoc-user-to-fd-action', userId }));
    }

    listen(action) {
        this.rawSend(JSON.stringify({ action: 'add-listener', listen: action }));
    }
}

export default Conveyor;
