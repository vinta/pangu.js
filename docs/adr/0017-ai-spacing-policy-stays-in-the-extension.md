# AI spacing policy stays in the extension

[ADR 0016](0016-hyphen-before-digit-gets-a-model-layer.md) introduced classification as an optional late fix. Core owns text capture and safe writes; the extension owns candidate detection, classification, and edits. This boundary lets another ambiguous shape reuse the same core machinery without putting model policy in the npm package.

The decisions:

1. **Two generic core hooks.** A callback receives text after spacing settles, and a method applies late fixes. One subscriber needs no event registry. The extension imports core's `pangu` singleton and reuses its observer and scheduler state.
2. **Snapshot checks make late writes safe.** Core applies a fix only while the node is connected and its text matches the snapshot used to compute the edit. The extension composes edits for each node before submitting them. We removed the batch deadline because abandoning a response did not cancel inference; it only discarded work. Slow results may still change unchanged text later.
3. **Page scanning and worker prompts stay in separate modules.** They share types and a shape identifier. A combined object would bundle unused prompt bytes into the content script and scanning code into the worker. The shipping prompt also stays independent of experiment tooling.
4. **Classification lives in the service worker.** That context provided the sampling controls used by our evaluations; the content-script probe did not. We disable classification when those controls are absent rather than silently change sampling. A shared base session avoids repeated initialization, and each candidate gets a fresh clone so earlier answers cannot influence it. Worker termination costs another initialization; we accept that cost instead of keeping the worker and model resident.

Prompt changes must pass the existing control cases as well as improve ambiguous cases. Label wording is part of the prompt, so translating labels requires evaluation too. Browser behavior and performance can be checked again when needed; API reference material and probe transcripts are not maintained here.
