const uuid = require("uuid");
const { createHoneyClient } = require("../");

test("sending an event should return a promise that resolves to the response", () => {
  const honeyClient = createHoneyClient({
    writeKey: process.env.HONEYCOMBIO_WRITE_KEY,
    dataset: process.env.HONEYCOMBIO_DATASET
  });

  const spanId = uuid.v4();
  const traceId = uuid.v4();
  const timestamp = new Date().toJSON();

  return expect(
    honeyClient.sendEventNow({
      service_name: "LogTesting",
      level: "TRACE",
      name: "start-receipt-verification",
      "trace.span_id": spanId,
      "trace.trace_id": traceId,
      duration_ms: 6359.654862,
      timestamp: timestamp
    })
  ).resolves.toMatchObject({
    status_code: 202,
    duration: expect.any(Number),
    error: undefined
  });
});

test("sending an event with a custom dataset", () => {
  const honeyClient = createHoneyClient({
    writeKey: process.env.HONEYCOMBIO_WRITE_KEY,
    dataset: process.env.HONEYCOMBIO_DATASET
  });

  const spanId = uuid.v4();
  const traceId = uuid.v4();
  const timestamp = new Date().toJSON();

  return expect(
    honeyClient.sendEventNow({
      service_name: "LogTesting",
      level: "TRACE",
      name: "start-receipt-verification",
      "trace.span_id": spanId,
      "trace.trace_id": traceId,
      duration_ms: 6359.654862,
      timestamp: timestamp,
      dataset: "test-custom-event-dataset"
    })
  ).resolves.toMatchObject({
    status_code: 202,
    duration: expect.any(Number),
    error: undefined
  });
});

test("sending an event is dropped by being sampled should result in a resolved promise", () => {
  const honeyClient = createHoneyClient({
    writeKey: process.env.HONEYCOMBIO_WRITE_KEY,
    dataset: process.env.HONEYCOMBIO_DATASET,
    sampleRate: Number.MAX_SAFE_INTEGER
  });

  const spanId = uuid.v4();
  const traceId = uuid.v4();
  const timestamp = new Date().toJSON();

  return expect(
    honeyClient.sendEventNow({
      service_name: "LogTesting",
      level: "TRACE",
      name: "start-receipt-verification",
      "trace.span_id": spanId,
      "trace.trace_id": traceId,
      duration_ms: 6359.654862,
      timestamp: timestamp
    })
  ).resolves.toMatchObject({ dropped: true });
});

test("sending an event that takes longer than 5 seconds to send should result in a rejected promise", () => {
  jest.setTimeout(10000);

  const honeyClient = createHoneyClient({
    writeKey: process.env.HONEYCOMBIO_WRITE_KEY,
    dataset: process.env.HONEYCOMBIO_DATASET,
    disabled: true
  });

  const spanId = uuid.v4();
  const traceId = uuid.v4();
  const timestamp = new Date().toJSON();

  return expect(
    honeyClient.sendEventNow({
      service_name: "LogTesting",
      level: "TRACE",
      name: "start-receipt-verification",
      "trace.span_id": spanId,
      "trace.trace_id": traceId,
      duration_ms: 6359.654862,
      timestamp: timestamp
    })
  ).rejects.toMatch("Sending event to honeycomb.io timed out");
});

test("sending many events works", () => {
  const honeyClient = createHoneyClient({
    writeKey: process.env.HONEYCOMBIO_WRITE_KEY,
    dataset: process.env.HONEYCOMBIO_DATASET
  });

  const eventCount = 1000;

  const allPromises = Array.from({ length: eventCount }).map((_e, i) => {
    const spanId = uuid.v4();
    const traceId = uuid.v4();
    const timestamp = new Date().toJSON();

    return honeyClient.sendEventNow({
      service_name: "LogTesting",
      level: "TRACE",
      name: "start-receipt-verification",
      "trace.span_id": spanId,
      "trace.trace_id": traceId,
      duration_ms: 100 + i,
      timestamp: timestamp
    });
  });

  return expect(Promise.all(allPromises)).resolves.toHaveLength(eventCount);
});

test("sending two events with the same spanId works", () => {
  const honeyClient = createHoneyClient({
    writeKey: process.env.HONEYCOMBIO_WRITE_KEY,
    dataset: process.env.HONEYCOMBIO_DATASET
  });

  const spanId = uuid.v4();
  const traceId = uuid.v4();

  const allPromises = [{ spanId, traceId }, { spanId, traceId }].map(
    (_e, i) => {
      const timestamp = new Date().toJSON();

      return honeyClient.sendEventNow({
        service_name: "LogTesting",
        level: "TRACE",
        name: "start-receipt-verification",
        "trace.span_id": spanId,
        "trace.trace_id": traceId,
        duration_ms: 100 + i,
        timestamp: timestamp
      });
    }
  );

  return expect(Promise.all(allPromises)).resolves.toHaveLength(2);
});
