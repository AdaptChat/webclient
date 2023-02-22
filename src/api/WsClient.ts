import Api from "./Api";
import {MessageCreateEvent, ReadyEvent, WsEvent} from "../types/ws";
import ApiCache from "./ApiCache";
import Backoff from "./Backoff";

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
    ws.api.cache ??= ApiCache.fromReadyEvent(ws.api, data)
    console.info('[WS] Ready event received from harmony')
  },
  message_create(ws: WsClient, data: MessageCreateEvent) {
    let grouper = ws.api.cache?.messages?.get(data.message.channel_id)
    if (!grouper) return

    if (data.message.nonce)
      try {
        if (grouper.nonced.has(data.message.nonce)) {
          return grouper.ackNonce(data.message.nonce, data.message)
        }
      } catch (ignored) {}

    grouper.pushMessage(data.message)
  },
}

/**
 * Implements a client for harmony (Adapt's websocket).
 */
export default class WsClient {
  readyPromiseResolver?: (resolver: any) => void;

  private connection?: WebSocket;

  private pingInterval?: number;
  private shouldKeepAlive: boolean;

  constructor(public api: Api) {
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
        console.debug('[WS] Connection closed, attempting reconnect in ')
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
    console.debug('[WS] Sending identify to harmony')

    this.connection?.send(JSON.stringify({
      op: 'identify',
      token: this.api.token,
      device: '__TAURI__' in window ? 'desktop' : 'web',
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
