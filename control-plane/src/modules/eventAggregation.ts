import { INFLUXDB_BUCKET, INFLUXDB_ORG, client } from './influx'

const queryClient = client?.getQueryApi(INFLUXDB_ORG)

type TimeRange = {
  start: Date
  stop: Date
}
const buildRange = (range: TimeRange) => `range(start: ${range.start.toISOString()}, stop: ${range.stop.toISOString()})`

type JobComposite = {
  clusterId: string
  serviceName: string
  fnName: string 
}
const buildJobFilter = (target: JobComposite) => `filter(fn: (r) => r["clusterId"] == "${target.clusterId}" and r["service"] == "${target.serviceName}" and r["function"] == "${target.fnName}")`

// Build a flux query to get the average latency for a given function over a given time range
export const avgLatencyQuery = (target: JobComposite, range: TimeRange) => `from(bucket: "${INFLUXDB_BUCKET}")
  |> ${buildRange(range)}
  |> filter(fn: (r) => r["_measurement"] == "jobResulted")
  |> ${buildJobFilter(target)}
  |> filter(fn: (r) => r["resultType"] == "resolution" or r["resultType"] == "rejection")
  |> filter(fn: (r) => r["_field"] == "functionExecutionTime")
  |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
`

// Build a flux query to get the total number of calls for a given function over a given time range
export const resultCountQuery = (target: JobComposite, range: TimeRange) => `from(bucket: "${INFLUXDB_BUCKET}")
  |> ${buildRange(range)}
  |> filter(fn: (r) => r["_measurement"] == "jobResulted")
  |> ${buildJobFilter(target)}
  |> filter(fn: (r) => r["resultType"] == "resolution" or r["resultType"] == "rejection")
  |> filter(fn: (r) => r["_field"] == "functionExecutionTime")
  |> count()
`

export const executeQuery = async (query: string): Promise<any> => {
  const data = await queryClient?.collectRows(query)

  return data?.map((result) => {
    return result
  })
}
