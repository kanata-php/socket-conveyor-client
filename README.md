<p align="center">
<img src="./imgs/logo.png"/>
</p>

<p>
  <a href="https://www.npmjs.com/package/socket-conveyor-client" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/socket-conveyor-client.svg">
  </a>
</p>


> A client for the php package kanata-php/socket-conveyor

### 🏠 [Homepage](https://github.com/kanata-php/socket-conveyor-client#readme)

## Prerequisites

- npm >=5.5.0
- node >=9.3.0

## Install

```sh
npm install socket-conveyor-client
```



## Description



This is a client for the [Socket Conveyor](https://github.com/kanata-php/socket-conveyor) PHP package..



## Usage



To use this package, once it is installed, the following example shows how it works.

```html
<div>
    <div><button onclick="connection.send('base', 'base-action')">Base Action</button></div>
    <div><button onclick="connection.send('first', 'example-first-action')">First Action</button></div>
    <div><button onclick="connection.send('second', 'example-second-action')">Second Action</button></div>
    <div id="output"></div>
</div>
<script type="module" type="text/javascript">

    // if this connection happens on a bundle, use it like this: import Conveyor from 'socket-conveyor-client';
    import Conveyor from './node_modules/socket-conveyor-client/index.js';

    var connection = new Conveyor({
        channel: 'actions-channel',
        listen: ['example-first-action'],
        onMessage: (e) => {
            document.getElementById('output').innerHTML = e;
        },
        onReady: () => {
            connection.send('Welcome!');
        },
    });

</script>
```

With the previous example your html client will try to connect to `ws://127.0.0.1:8000`. This client will connect to the channel `actions-channel`, and will listen to `example-first-action` actions. That said, any message sent to that **channel** and **action**, will be received at the `OnMessage` callback.

## Options

```
protocol: 'ws',
uri: '127.0.0.1',
port: 8000,

// Url query for connection.
query: '',

channel: null,
listen: null,
onOpen: this.onOpen.bind(this),
onReady: () => {},

// Message handler for only the data portion.
onMessage: () => {},

// Message handler for the whole incoming object.
onRawMessage: () => {},

// Callback triggered when closing connection. If overwritten the reconnection feature can be affected. 
onClose: () => this.onClose.bind(this),

// Callback for securely do something when connection is closed, without affecting default closing connection behavior.
onCloseCallback: () => {},

// Callback for reconnection feature. Useful if you need to renew a token before attempting again. You might also want to check the method `setOption` for this, so you can change options during this procedure.
onReconnectCallback: () => {},

onError: () => {},

// Settings for reconnection feature.
reconnect: false,
reconnectDelay: 5000,

// Interval for connection verification, so reconnection action can take place if reconnection active.
healthCheckInterval: 3000,
```

## Author

👤 **Savio Resende**

* Website: https://savioresende.com.br
* GitHub: [@lotharthesavior](https://github.com/lotharthesavior)

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2022 [Savio Resende](https://github.com/lotharthesavior).
