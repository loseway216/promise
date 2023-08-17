import Promise from "./promise";
// const Promise = require("./promise");

function noop() {}

it("should receive a executor function", () => {
  const executor = jest.fn();
  const promise = new Promise(executor);

  // mock function should be called immediately
  expect(executor).toHaveBeenCalled();

  // arguments: resolve and reject function
  expect(typeof executor.mock.calls[0][0]).toBe("function");
  expect(typeof executor.mock.calls[0][1]).toBe("function");
});

it("should be in PENDING state", () => {
  const promise = new Promise(noop);

  expect(promise.state).toBe("PENDING");
});

it("transitions to FULFILLED state with a value", () => {
  const promise = new Promise((fulfill, reject) => {
    debugger;
    fulfill("yes");
  });

  expect(promise.state).toBe("FULFILLED");
});

it("transitions to REJECTED state with a reason", () => {
  const promise = new Promise((fulfill, reject) => {
    reject("no");
  });

  expect(promise.state).toBe("REJECTED");
});

it("should have a .then method", () => {
  const promise = new Promise(noop);
  expect(typeof promise.then).toBe("function");
});
