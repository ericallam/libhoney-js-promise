const Libhoney = require("libhoney");
const uuid = require("uuid");
const debug = require("debug")("libhoney-promise");

const wrapHoneyClient = options => {
  const promises = {};

  const responseCallback = responses => {
    responses.forEach(response => {
      const { metadata, status_code, error } = response;

      if (metadata.promiseId) {
        const promise = promises[metadata.promiseId];

        promises[metadata.promiseId] = undefined;

        if (promise) {
          clearTimeout(promise.timeoutId);

          if (error) {
            if (error.message.match(/event dropped due to sampling/)) {
              promise.resolve({ dropped: true });
            } else {
              promise.reject(error);
            }
          } else if (status_code === 200 || status_code === 202) {
            promise.resolve(response);
          } else {
            promise.reject(`Response from honeycomb.io was a ${status_code}`);
          }
        }
      }
    });
  };

  const triggerPromiseTimeout = promiseId => {
    const promise = promises[promiseId];
    promises[promiseId] = undefined;

    if (promise) {
      debug("Sending event to honeycomb.io timed out %s", promiseId);

      promise.reject(`Sending event to honeycomb.io timed out (5000ms)`);
    } else {
      debug(
        "Promise timeout triggered for promiseId %s but there was no promise present",
        promiseId
      );
    }
  };

  const honey = new Libhoney({ ...options, responseCallback });

  return {
    sendEventNow: data => {
      return new Promise((resolve, reject) => {
        const promiseId = uuid.v4();

        if (promises[promiseId]) {
          debug(
            `promiseId collision with existing promise ${promiseId}, sending event with immediately resolved promise`
          );

          const event = honey.newEvent();
          event.add(data);
          event.timestamp =
            data.timestamp || data.Timestamp || data["@timestamp"];
          event.send();

          return resolve(event);
        }

        // If the promise hasn't been resolved in 5 seconds, reject it with a timeout error
        const timeoutId = setTimeout(triggerPromiseTimeout, 5000, promiseId);

        promises[promiseId] = { resolve, reject, timeoutId };

        const event = honey.newEvent();
        event.add(data);
        event.timestamp =
          data.timestamp || data.Timestamp || data["@timestamp"];
        event.metadata = { promiseId };
        event.send();
      });
    }
  };
};
/**
 * Constructs a wrapped libhoney client in order to send events with a promise result,
 *
 * @param {Object} [opts] overrides for the defaults
 * @param {string} [opts.apiHost=https://api.honeycomb.io] - Server host to receive Honeycomb events.
 * @param {string} opts.proxy - The proxy to send events through.
 * @param {string} opts.writeKey - Write key for your Honeycomb team. (Required)
 * @param {string} opts.dataset - Name of the dataset that should contain this event. The dataset will be created for your team if it doesn't already exist.
 * @param {number} [opts.sampleRate=1] - Sample rate of data. If set, causes us to send 1/sampleRate of events and drop the rest.
 * @param {number} [opts.batchSizeTrigger=50] - We send a batch to the API when this many outstanding events exist in our event queue.
 * @param {number} [opts.batchTimeTrigger=100] - We send a batch to the API after this many milliseconds have passed.
 * @param {number} [opts.maxConcurrentBatches=10] - We process batches concurrently to increase parallelism while sending.
 * @param {number} [opts.pendingWorkCapacity=10000] - The maximum number of pending events we allow to accumulate in our sending queue before dropping them.
 * @param {number} [opts.maxResponseQueueSize=1000] - The maximum number of responses we enqueue before dropping them.
 * @param {boolean} [opts.disabled=false] - Disable transmission of events to the specified `apiHost`, particularly useful for testing or development.
 * @constructor
 * @example
 * import { createHoneyClient } from 'libhoney-promise';
 * const honey = createHoneyClient({
 *   writeKey: "YOUR_WRITE_KEY",
 *   dataset: "honeycomb-js-example",
 * });
 */
const createHoneyClient = (options = {}) => {
  return wrapHoneyClient(options);
};

module.exports = {
  createHoneyClient
};
