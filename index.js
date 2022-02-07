
class Conveyor {
    constructor(options) {
        this.options = {
            ...{
                protocol: 'ws',
                uri: '127.0.0.1',
                port: 8000,
                channel: null,
                onOpen: this.onOpen.bind(this),
                onMessage: () => {},
                onClose: () => {},
                onError: () => {},
            },
            ...options
        };
        this.ws = new WebSocket(this.options.protocol + '://' + this.options.uri + ':' + this.options.port);
        this.bindEvents();
    }

    bindEvents() {
        this.ws.onopen = this.options.onOpen;
        this.ws.onclose = this.options.onClose;
        this.ws.onerror = this.options.onError;
        this.ws.onmessage = this.baseOnMessage.bind(this);
    }

    onOpen(e) {
        if (this.options.channel === null) {
            return;
        }

        this.connectToChannel(this.options.channel);
        this.addListeners();
        this.options.onReady();
    }

    baseOnMessage(e) {
        const parsedData = JSON.parse(e.data);

        this.options.onMessage(parsedData.data);
    }

    connectToChannel(channel) {
        this.ws.send(JSON.stringify({
            'action': 'channel-connect',
            'channel': channel,
        }));
    }

    send(message, action) {
        if (typeof action === 'undefined') {
            action = 'base-action';
        }

        this.ws.send(JSON.stringify({
            'action': action,
            'params': {'content': message}
        }));
    }

    addListeners() {
        if (typeof this.options.listen === 'undefined') {
            return;
        }

        if (this.options.listen.constructor !== Array) {
            console.error('"listen" option must be an array.');
            return;
        }

        this.options.listen.forEach((action) => this.listen(action));
    }

    listen(action) {
        this.ws.send(JSON.stringify({
            'action': 'add-listener',
            'listener': action,
        }));
    }
}

export default Conveyor;
