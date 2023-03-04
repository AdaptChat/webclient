import Api from "./Api";

export default class TypingKeepAlive {
  private lastTyping: number = 0

  constructor(private readonly api: Api, private readonly channelId: number) {}

  private elapsedSinceLastTyping() {
    return performance.now() - this.lastTyping
  }

  async ackTyping() {
    if (this.elapsedSinceLastTyping() < 10_000)
      return

    await this.sendTyping('PUT')
    this.lastTyping = performance.now()
  }

  async stop() {
    await this.sendTyping('DELETE')
    this.lastTyping = 0
  }

  private sendTyping(method: 'PUT' | 'DELETE') {
    return this.api.request(method, `/channels/${this.channelId}/typing`)
  }
}
