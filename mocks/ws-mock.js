// Mock WebSocket implementation
class WebSocket {
  constructor() {
    this.readyState = 1; // OPEN
  }

  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

class WebSocketServer {
  constructor() {}
  on() {}
  close() {}
}

module.exports = WebSocket;
module.exports.WebSocket = WebSocket;
module.exports.WebSocketServer = WebSocketServer; 