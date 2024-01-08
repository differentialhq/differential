import { Point } from "@influxdata/influxdb-client"
import { writeClient } from "./influx"

type EventTypes = 'jobCreated' | 'jobResulted' | 'machinePing'
type Event = {
  type: EventTypes
  tags?: Record<string, string | null>
  intFields?: Record<string, number | null>
  stringFields?: Record<string, string | null >
  booleanFields?: Record<string, boolean | null >
}

export const writeEvent = (event: Event) => {
  const point = new Point(event.type)

  event.tags && Object.entries(event.tags).forEach(([key, value]) => {
    value != undefined && point.tag(key, value)
  })

  event.intFields && Object.entries(event.intFields).forEach(([key, value]) => {
    value !== undefined && point.intField(key, value)
  })

  event.stringFields && Object.entries(event.stringFields).forEach(([key, value]) => {
    value !== undefined && point.stringField(key, value)
  })

  event.booleanFields && Object.entries(event.booleanFields).forEach(([key, value]) => {
    value !== undefined && point.booleanField(key, value)
  })

  writeClient?.writePoint(point)
}

