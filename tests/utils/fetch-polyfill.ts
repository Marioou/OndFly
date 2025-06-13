import { default as nodeFetch } from 'node-fetch';

// Only set up polyfills if we're in a Node.js environment and fetch is not available
if (!globalThis.fetch) {
    const fetchPolyfill = nodeFetch.bind(globalThis);
    // @ts-ignore
    globalThis.fetch = fetchPolyfill;
    // @ts-ignore
    globalThis.Headers = nodeFetch.Headers;
    // @ts-ignore
    globalThis.Request = nodeFetch.Request;
    // @ts-ignore
    globalThis.Response = nodeFetch.Response;
}

export default nodeFetch;
