import * as osu from 'node-os-utils'

type EventTypes =  'functionInvocation' | 'machineResourceProbe'
type Event = {
  timestamp: Date
  type: EventTypes
  tags?: Record<string, string>
  intFields?: Record<string, number>
}

type PublishEvents = (events: Event[]) => Promise<void>

export class Events {
  private metricsInterval?: NodeJS.Timeout;
  private eventBuffer: Event[] = []
  private publish: PublishEvents
  private systemProbeInterval: number
  private bufferFlushSize: number

  constructor(publish: PublishEvents, options?: {
    systemProbeInterval?: number
    bufferFlushSize?: number
  }) {
    this.publish = publish
    this.systemProbeInterval = options?.systemProbeInterval || 5000
    this.bufferFlushSize = options?.bufferFlushSize || 1000
  }

  public startResourceProbe() {
    if (this.metricsInterval) {
      return
    }

    this.metricsInterval = setInterval(async () => {
      const cpuUsage = await osu.cpu.usage()
      const memUsage = await osu.mem.info()

      this.eventBuffer.push({
        type: 'machineResourceProbe',
        timestamp: new Date(),
        intFields: {
          cpuPercentage: cpuUsage,
          memPercentage: memUsage.usedMemPercentage,
          memUsageByte: process.memoryUsage().rss
        }
      })

      this.flush()

    }, this.systemProbeInterval)
  }

  public stopResourceProbe() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = undefined
    }
  }

  public push(event: Event) {
    this.eventBuffer.push(event)
    this.flush()
  }

  public flush() {
    if (this.eventBuffer.length < this.bufferFlushSize) {
      return
    }

    // Do not await for the publish to finish
    this.publish(this.eventBuffer)

    this.eventBuffer = []
  }

}
