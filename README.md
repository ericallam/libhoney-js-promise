# libhoney-promise

A wrapper for libhoney-js that provides support for sending events with a promises api

[![Version](https://img.shields.io/npm/v/libhoney-promise.svg)](https://npmjs.org/package/libhoney-promise)
[![Downloads/week](https://img.shields.io/npm/dw/libhoney-promise.svg)](https://npmjs.org/package/libhoney-promise)
[![License](https://img.shields.io/npm/l/libhoney-promise.svg)](https://github.com/solve-hq/libhoney-promise/blob/master/package.json)

## Installation

`libhoney-promise` specifies `libhoney` as a peer dependency, so you must also have `libhoney` installed in your project.

You can install both using `npm`:

```bash
npm install libhoney libhoney-promise --save
```

Using yarn:

```bash
yarn add libhoney libhoney-promise
```

## Usage

```javascript
const { createHoneyClient } = require("libhoney-promise");

const honeyClient = createHoneyClient({
  writeKey: "<YOUR WRITE KEY>",
  dataset: "<YOUR DATASET NAME>"
});

honeyClient
  .sendEventNow({
    service_name: "API",
    name: "get-foo",
    "trace.span_id": "span1234",
    "trace.trace_id": "trace1234",
    duration_ms: 145,
    timestamp: "2019-02-26T11:22:26.093Z"
  })
  .then(response => {
    console.log(response);
  });
```

`createHoneyClient` takes the same options as the [libhoney constructor](https://github.com/honeycombio/libhoney-js/blob/master/src/libhoney.js#L94), and returns a object with a single method for sending event data named `sendEventNow`.

### `sendEventNow`

Accepts a single `data` argument that is passed to a Libhoney event object.

If the `data` object has a `timestamp`, `@timestamp`, or `Timestamp` key, it will override the event timestamp.

Will return a `Promise` that is resolved when the event is successfully transmitted to the service. The promise is also resolved if the event was dropped because of sampling. The promise will be rejected if it was unable to be transmitted to the service, either by being throttled by the `Libhoney` client or by an unsuccessful response from the service.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate

### Running tests

The tests do not mock out `honeycomb.io` so you will need to provide your `writeKey` and `dataset` to the tests through environment variables. Create a `.env` file in the root of the project like so:

```
HONEYCOMBIO_WRITE_KEY=<YOUR WRITE KEY>
HONEYCOMBIO_DATASET=libhoney-js-promise-test
```

Then you can run the tests using `npm`:

```bash
npm test
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
