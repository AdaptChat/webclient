import Api from "./Api";
import {ReadyEvent, WsEvent} from "../types/ws";
import ApiCache from "./ApiCache";

/**
 * WebSocket endpoint
 */
export const WS_CONNECT_URI: string = 'wss://harmony.adapt.chat'

type WsEventHandler = (ws: WsClient, data: any) => any
export const WsEventHandlers: Record<string, WsEventHandler> = {
  hello(ws, _) {
    ws.sendIdentify()
    console.info('[WS] Connected to harmony')
  },
  ready(ws: WsClient, data: ReadyEvent) {
    ws.readyPromiseResolver?.(true)
    ws.api.cache = ApiCache.fromReadyEvent(data)
    console.info('[WS] Ready event received from harmony')
  },
}

/**
 * Implements a client for harmony (Adapt's websocket).
 */
export default class WsClient {
  api: Api;
  readyPromiseResolver?: (resolver: any) => void;

  private connection?: WebSocket;

  private pingInterval?: number;
  private shouldKeepAlive: boolean;

  constructor(api: Api) {
    this.api = api
    this.shouldKeepAlive = false
  }

  async initConnection() {
    this.shouldKeepAlive = true
    this.readyPromiseResolver = undefined
    this.clearPingInterval()

    const connection = new WebSocket(WS_CONNECT_URI)
    connection.onmessage = this.processMessage.bind(this)
    connection.onclose = () => {
      if (this.shouldKeepAlive) {
        console.debug('[WS] Connection closed, attempting reconnect...')
        this.reconnect()
      }
    }

    this.pingInterval = setInterval(this.sendPing.bind(this), 15000) as unknown as number
    this.connection = connection
  }

  async connect() {
    await this.initConnection()
    await new Promise((resolve) => this.readyPromiseResolver = resolve)
  }

  sendIdentify() {
    this.connection?.send(JSON.stringify({
      op: 'identify',
      token: this.api.token,
    }))
  }

  private sendPing() {
    this.connection?.send(JSON.stringify({ op: 'ping' }))
  }

  private processMessage(message: MessageEvent) {
    console.debug('[WS] Received message from harmony: ' + message)

    const json: WsEvent = JSON.parse(message.data)
    WsEventHandlers[json.event]?.(this, json.data)
  }

  private clearPingInterval() {
    clearInterval(this.pingInterval)
    this.pingInterval = undefined
  }

  private resetConnection() {
    this.connection?.close()
    this.connection = undefined
    this.clearPingInterval()
  }

  async reconnect() {
    this.resetConnection()
    await this.connect()
  }

  close() {
    this.shouldKeepAlive = false
    this.resetConnection()
  }
}
