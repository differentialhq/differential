import { InfluxDB } from "@influxdata/influxdb-client";

const client = process.env.INFLUXDB_URL
  ? new InfluxDB({
      url: process.env.INFLUXDB_URL,
      token: process.env.INFLUXDB_TOKEN,
    })
  : undefined;

export const INFLUXDB_ORG = process.env.INFLUXDB_ORG;
export const INFLUXDB_BUCKET = process.env.INFLUXDB_BUCKET;

export const queryClient = INFLUXDB_ORG
  ? client?.getQueryApi(INFLUXDB_ORG)
  : undefined;

export const writeClient =
  INFLUXDB_ORG && INFLUXDB_BUCKET
    ? client?.getWriteApi(INFLUXDB_ORG, INFLUXDB_BUCKET, "ms")
    : undefined;
