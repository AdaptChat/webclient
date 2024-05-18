import Api from "./Api";

export default class TypingKeepAlive {
  private lastTyping: number = 0

  constructor(private readonly api: Api, private readonly channelId: bigint) {}

  private elapsedSinceLastTyping() {
    return performance.now() - this.lastTyping
  }

  async ackTyping() {
    if (this.elapsedSinceLastTyping() < 10_000)
      return

    this.lastTyping = performance.now()
    await this.sendTyping('PUT')
  }

  async stop() {
    await this.sendTyping('DELETE')
    this.lastTyping = 0
  }

  private sendTyping(method: 'PUT' | 'DELETE') {
    return this.api.request(method, `/channels/${this.channelId}/typing`)
  }
}
