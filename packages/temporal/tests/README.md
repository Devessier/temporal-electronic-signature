# Tests with Temporal TypeScript SDK

To note:

- A worker must be configured per test
- If test is complex (not only getting result of workflow), assertions relying on *handle* **must** live in async callback provided to `worker.runUntil()`. It will ensure the worker is destroyed after assertions, and launched before anyone.
