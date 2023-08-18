import Promise from "./promise";
// const Promise = require("./promise");

function noop() {}

const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";

const value = "yes";
const reason = "no";

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

  expect(promise.state).toBe(PENDING);
});

it("transitions to FULFILLED state with a value", () => {
  const promise = new Promise((fulfill, reject) => {
    fulfill(value);
  });

  expect(promise.state).toBe(FULFILLED);
});

it("transitions to REJECTED state with a reason", () => {
  const promise = new Promise((fulfill, reject) => {
    reject(reason);
  });

  expect(promise.state).toBe(REJECTED);
});

it("should have a .then method", () => {
  const promise = new Promise(noop);
  expect(typeof promise.then).toBe("function");
});

it("should call the onFulfilled method when a promise is in a FULFILLED state", () => {
  const onFulfilled = jest.fn();
  const promise = new Promise((resolve, reject) => {
    resolve(value);
  }).then(onFulfilled);

  expect(onFulfilled).toHaveBeenCalled();
  expect(onFulfilled).toHaveBeenCalledWith(value);
});

it("should call the onRejected method when a promise is in a REJECTED state", () => {
  const onRejected = jest.fn();
  const promise = new Promise((resolve, reject) => {
    reject(reason);
  }).then(noop, onRejected);

  expect(onRejected).toHaveBeenCalled();
  expect(onRejected).toHaveBeenCalledWith(reason);
});

test("when a promise is fulfilled it should not be rejected with another value", () => {
  const onFulfilled = jest.fn();
  const onRejected = jest.fn();

  const promise = new Promise((resolve, reject) => {
    resolve(value);
    reject(reason);
  }).then(onFulfilled, onRejected);

  expect(onFulfilled.mock.calls.length).toBe(1);
  expect(onFulfilled.mock.calls[0][0]).toBe(value);
  expect(onRejected.mock.calls.length).toBe(0);
  expect(promise.state === FULFILLED);
});

test("when a promise is rejected it should not be fulfilled with another value", () => {
  const onFulfilled = jest.fn();
  const onRejected = jest.fn();

  const promise = new Promise((resolve, reject) => {
    reject(reason);
    resolve(value);
  }).then(onFulfilled, onRejected);

  expect(onFulfilled).toHaveBeenCalledTimes(0);
  expect(onRejected).toHaveBeenCalled();
  expect(onRejected).toHaveBeenCalledWith(reason);
  expect(promise.state === REJECTED);
});

test("when a executor fails the promise should transition to rejected state", () => {
  const onRejected = jest.fn();
  const reason = new Error("failed");
  const promise = new Promise(() => {
    throw reason;
  }).then(null, onRejected);

  expect(onRejected).toHaveBeenCalled();
  expect(onRejected).toHaveBeenCalledWith(reason);
  expect(promise.state === REJECTED);
});

it("should queue callbacks when the promise is not fulfilled immediately", (done) => {
  const onFulfilled = jest.fn();
  const promise = new Promise((resolve, reject) => {
    setTimeout(resolve, 1, value);
  }).then(onFulfilled);

  // should not be called immediately
  expect(onFulfilled).toHaveBeenCalledTimes(0);

  setTimeout(() => {
    expect(onFulfilled).toHaveBeenCalled();
    expect(onFulfilled).toHaveBeenCalledWith(value);
    done();
  }, 5);
});

it("if .then's onFulfilled is called without errors it should transition to FULFILLED", () => {
  const onFulfilled = jest.fn();
  new Promise((fulfill) => fulfill()).then(() => value).then(onFulfilled);

  expect(onFulfilled).toHaveBeenCalled();
  expect(onFulfilled).toHaveBeenCalledWith(value);
});

it("if .then's onRejected is called without errors it should transition to FULFILLED", () => {
  const onFulfilled = jest.fn();
  new Promise((fulfill, reject) => reject())
    .then(null, () => reason)
    .then(onFulfilled);

  expect(onFulfilled).toHaveBeenCalled();
  expect(onFulfilled).toHaveBeenCalledWith(reason);
});

it("if .then's onFulfilled is called and has an error it should transition to REJECTED", () => {
  const reason = new Error("I failed :(");
  const onRejected = jest.fn();
  new Promise((fulfill) => fulfill())
    .then(() => {
      throw reason;
    })
    .then(null, onRejected);
  expect(onRejected.mock.calls.length).toBe(1);
  expect(onRejected.mock.calls[0][0]).toBe(reason);
});

it("if a handler returns a promise, the previous promise should adopt the state of the returned promise", () => {
  const onFulfilled = jest.fn();
  new Promise((fulfill) => fulfill())
    .then(() => new Promise((resolve) => resolve(value)))
    .then(onFulfilled);
  expect(onFulfilled.mock.calls.length).toBe(1);
  expect(onFulfilled.mock.calls[0][0]).toBe(value);
});

it("if a handler returns a promise resolved in the future, the previous promise should adopt its value", (done) => {
  const onFulfilled = jest.fn();
  new Promise((fulfill) => setTimeout(fulfill, 0))
    .then(() => new Promise((resolve) => setTimeout(resolve, 0, value)))
    .then(onFulfilled);
  setTimeout(() => {
    expect(onFulfilled.mock.calls.length).toBe(1);
    expect(onFulfilled.mock.calls[0][0]).toBe(value);
    done();
  }, 10);
});
