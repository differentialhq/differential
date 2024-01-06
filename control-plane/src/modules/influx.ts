import {InfluxDB, Point} from '@influxdata/influxdb-client'
import { invariant } from '../utils';

let _client: InfluxDB | undefined;
if (process.env.INFLUXDB_ENABLED) {
  const token = invariant(
    process.env.INFLUXDB_TOKEN,
    "INFLUXDB_TOKEN must be set"
  );

  const url = invariant(
    process.env.INFLUXDB_URL,
    "INFLUXDB_URL must be set"
  );

  _client = new InfluxDB({url, token})
} else {
  console.warn("INFLUXDB_ENABLED is not set, metrics will not be sent to influxdb");
}

export const INFLUXDB_ORG = 'differential';
export const INFLUXDB_BUCKET = 'differential';
export const client = _client;

