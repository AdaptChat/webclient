import Api from "./Api";
import {ReadyEvent, WsEvent} from "../types/ws";

/**
 * WebSocket endpoint
 */
export const WS_CONNECT_URI: string = 'wss://harmony.adapt.chat'

type WsEventHandler = (ws: WsClient, data: any) => any
export const WsEventHandlers: Record<string, WsEventHandler> = {
  ready(ws: WsClient, data: ReadyEvent) {
    ws.$readyPromiseResolver?.(true)
  }
}

/**
 * Implements a client for harmony (Adapt's websocket).
 */
export default class WsClient {
  private api: Api;
  private connection?: WebSocket;

  private pingInterval?: number;
  private shouldKeepAlive: boolean;
  $readyPromiseResolver?: (resolver: any) => void;

  constructor(api: Api) {
    this.api = api
    this.shouldKeepAlive = false
  }

  async initConnection() {
    this.shouldKeepAlive = true
    this.$readyPromiseResolver = undefined
    this.clearPingInterval()

    const connection = new WebSocket(WS_CONNECT_URI)
    connection.onopen = this.sendIdentify.bind(this)
    connection.onmessage = this.processMessage.bind(this)
    connection.onclose = () => {
      if (this.shouldKeepAlive) {
        console.debug('[WS] Connection closed, attempting reconnect...')
        this.reconnect()
      }
    }

    this.pingInterval = setInterval(this.sendPing.bind(this), 15000)
    this.connection = connection
  }

  async connect() {
    await this.initConnection()
    await new Promise((resolve) => this.$readyPromiseResolver = resolve)
  }

  private sendIdentify() {
    this.connection?.send(JSON.stringify({
      event: 'identify',
      data: {
        token: this.api.token,
      },
    }))
  }

  private sendPing() {
    this.connection?.send(JSON.stringify({
      event: 'ping',
    }))
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
