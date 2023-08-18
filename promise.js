const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";

export default class Promise {
  constructor(executor) {
    this.state = PENDING;
    this.value = null;

    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    let done = false;

    const resolve = (result) => {
      if (done) return;
      done = true;
      this.state = FULFILLED;
      this.value = result;
      this.onFulfilledCallbacks.forEach((fn) => fn());
      this.onFulfilledCallbacks = [];
    };

    const reject = (reason) => {
      if (done) return;
      done = true;
      this.state = REJECTED;
      this.value = reason;
      this.onRejectedCallbacks.forEach((fn) => fn());
      this.onRejectedCallbacks = [];
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    return new Promise((resolve, reject) => {
      const wrappedOnFulfilled = () => {
        try {
          const fulfilledFromLastPromise = onFulfilled(this.value);
          if (fulfilledFromLastPromise instanceof Promise) {
            fulfilledFromLastPromise.then(resolve, reject);
          } else {
            resolve(fulfilledFromLastPromise);
          }
        } catch (error) {
          reject(error);
        }
      };

      const wrappedOnRejected = () => {
        try {
          const rejectedFromLastPromise = onRejected(this.value);
          if (rejectedFromLastPromise instanceof Promise) {
            rejectedFromLastPromise.then(resolve, reject);
          } else {
            reject(rejectedFromLastPromise);
          }
        } catch (error) {
          reject(error);
        }
      };

      if (this.state === PENDING) {
        this.onFulfilledCallbacks.push(wrappedOnFulfilled);
        this.onRejectedCallbacks.push(wrappedOnRejected);
      } else if (this.state === FULFILLED) {
        wrappedOnFulfilled();
      } else if (this.state === REJECTED) {
        wrappedOnRejected();
      }
    });
  }
}
