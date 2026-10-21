# Browser event loop

On-screen labels say **browser event loop**. This film does not describe Node.js phases.

## Snippet

```js
console.log("A");
setTimeout(() => {
  console.log("B");
}, 0);
Promise.resolve().then(() => {
  console.log("C");
});
console.log("D");
```

A browser prints `A`, then `D`, then `C`, then `B`.

## Claims

1. `console.log("A")` and `console.log("D")` run on the current call stack, in that source order. Neither callback runs between them.
2. `setTimeout(fn, 0)` does not call `fn` during this turn. It asks the host — the browser — to queue a task. The diagram calls that waiting line the task queue.
3. `Promise.resolve().then(fn)` queues a microtask (the promise reaction). The reaction stays off the stack while synchronous code is still running.
4. When that stack empties, the browser runs its microtask checkpoint before it takes the next task. `C` runs, and only then does the timer callback `B` run.

## Limits

- The model on screen is the call stack, one microtask queue, and one task queue. HTML keeps several task sources and may render between tasks. Those steps are outside this Short.
- A delay of `0` is not a claim that the timer fires in zero milliseconds. Nested timers are clamped. The claim is ordering: the microtask checkpoint happens before the next task.
- The same snippet also prints `A D C B` in Node.js. That coincidence is not a license to read Node’s `timers`, `pending callbacks`, `poll`, `check`, or `close` phases into this film.

## Sources

- MDN, [The event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop)
- MDN, [In depth: Microtasks and the JavaScript runtime environment](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth)
- HTML Living Standard, [event loop processing model](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)
