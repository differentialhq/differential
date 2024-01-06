import { Point } from "@influxdata/influxdb-client"
import { INFLUXDB_BUCKET, INFLUXDB_ORG, client } from "./influx"

export const writeClient = client?.getWriteApi(INFLUXDB_ORG, INFLUXDB_BUCKET , 'ms', {
  ...(process.env['NODE_ENV'] !== 'production' ? { flushInterval: 1000 } : {})
})

type EventTypes = 'jobCreated' | 'jobResulted' | 'machinePing'
type Event = {
  type: EventTypes
  tags?: Record<string, string>
  intFields?: Record<string, number>
  stringFields?: Record<string, string>
  booleanFields?: Record<string, boolean>
}

export const writeEvent = (event: Event) => {
  const point = new Point(event.type)

  event.tags && Object.entries(event.tags).forEach(([key, value]) => {
    point.tag(key, value)
  })

  event.intFields && Object.entries(event.intFields).forEach(([key, value]) => {
    point.intField(key, value)
  })

  event.stringFields && Object.entries(event.stringFields).forEach(([key, value]) => {
    point.stringField(key, value)
  })

  event.booleanFields && Object.entries(event.booleanFields).forEach(([key, value]) => {
    point.booleanField(key, value)
  })

  writeClient?.writePoint(point)
}

