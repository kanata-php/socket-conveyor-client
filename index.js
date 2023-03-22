
class Conveyor {
    constructor(options) {
        this.options = {
            ...{
                protocol: 'ws',
                uri: '127.0.0.1',
                port: 8000,
                query: '',
                channel: null,
                listen: null,
                onOpen: this.onOpen.bind(this),
                onReady: () => {},
                onMessage: () => {}, // Message handler for only the data portion.
                onRawMessage: () => {}, // Message handler for the whole incoming object.
                onClose: () => this.onClose.bind(this),
                onCloseCallback: () => {},
                onError: () => {},
                reconnect: false,
                reconnectDelay: 5000,
                healthCheckInterval: 3000,
            },
            ...options
        };

        this.start();

        if (this.options.reconnect) {
            this.healthCheckInterval = setInterval(
                () => this.isClosed() ? this.onClose() : () => {},
                this.options.healthCheckInterval
            );
        }
    }

    isClosed() {
        return this.ws === null
            || 2 === this.ws.readyState // closing
            || 3 === this.ws.readyState // close
    }

    start() {
        this.ws = new WebSocket(this.options.protocol + '://' + this.options.uri + ':' + this.options.port + this.options.query);
        this.bindEvents();
    }

    bindEvents() {
        if (this.isClosed()) return;
        this.ws.onopen = this.options.onOpen;
        this.ws.onclose = this.options.onClose;
        this.ws.onerror = this.options.onError;
        this.ws.onmessage = this.baseOnMessage.bind(this);
    }

    onOpen(e) {
        this.connectChannel();
        this.addListeners();
        this.options.onReady();
    }

    onClose(e) {
        this.options.onCloseCallback();
        if (!this.options.reconnect) return;
        this.ws = null;
        setTimeout(() => this.start(), this.options.reconnectDelay);
    }

    baseOnMessage(e) {
        this.options.onRawMessage(e.data);
        const parsedData = JSON.parse(e.data);
        this.options.onMessage(parsedData.data);
    }

    send(message, action) {
        if (typeof action === 'undefined') {
            action = 'base-action';
        }

        this.rawSend(JSON.stringify({
            'action': action,
            'data': message,
        }));
    }

    rawSend(message) {
        if (this.isClosed()) return;
        this.ws.send(message);
    }

    connectChannel() {
        if (this.options.channel === null) {
            return;
        }

        this.rawSend(JSON.stringify({
            'action': 'channel-connect',
            'channel': this.options.channel,
        }));
    }

    addListeners() {
        if (this.options.listen === null) {
            return;
        }

        if (this.options.listen.constructor !== Array) {
            console.error('"listen" option must be an array.');
            return;
        }

        this.options.listen.forEach((action) => this.listen(action));
    }

    assocUser(userId) {
        this.rawSend(JSON.stringify({
            'action': 'assoc-user-to-fd-action',
            'userId': userId,
        }));
    }

    listen(action) {
        this.rawSend(JSON.stringify({
            'action': 'add-listener',
            'listen': action,
        }));
    }
}

export default Conveyor;
