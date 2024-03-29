function thirtyMinutesAgo() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - 30);
  return now;
}

export function fillDates<T extends { timestamp: Date }>(data: Array<T>): T[] {
  const sorted = data.sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  const earliestTimestamp = Math.min(
    sorted[0].timestamp.getTime(),
    thirtyMinutesAgo().getTime(),
  );
  const latestTimestamp = new Date().getTime();

  const dataApplicable = data.filter(
    (d) => d.timestamp?.getTime() >= earliestTimestamp,
  );

  const timestamps = dataApplicable
    .map((d) => d.timestamp.getTime())
    .filter((t) => t >= earliestTimestamp);

  const missingTimestamps = Array.from(
    { length: (latestTimestamp - earliestTimestamp) / 60000 },
    (_, i) => i * 60000 + earliestTimestamp,
  ).filter((timestamp) => !timestamps.includes(timestamp));

  return dataApplicable
    .concat(
      missingTimestamps.map((timestamp) => ({
        timestamp: new Date(timestamp),
      })) as T[],
    )
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
