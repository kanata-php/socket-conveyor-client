
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
                onClose: () => {},
                onError: () => {},
                reconnect: false,
                reconnectDelay: 5000,
            },
            ...options
        };

        if (this.options.reconnect) {
            this.ws = new WsReconnect({ reconnectDelay: this.options.reconnectDelay });
            this.ws.open(this.options.protocol + '://' + this.options.uri + ':' + this.options.port + this.options.query);
        } else {
            this.ws = new WebSocket(this.options.protocol + '://' + this.options.uri + ':' + this.options.port + this.options.query);
        }
        this.bindEvents();
    }

    bindEvents() {
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
