const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";

export default function Promise(executor) {
  // store state which can be PENDING, FULFILLED or REJECTED
  this.state = PENDING;
  // store value or error once FULFILLED or REJECTED
  this.value = undefined;
  // store success & failure handlers attached by calling .then or .done
  this.handlers = [];

  const fulfill = (result) => {
    this.state = FULFILLED;
    this.value = result;
    this.handlers.forEach(this.handle);
    this.handlers = [];
  };

  const reject = (error) => {
    this.state = REJECTED;
    this.value = error;
    this.handlers.forEach(handle);
    this.handlers = [];
  };

  const resolve = (result) => {
    try {
      const then = getThen(result);
      if (then) {
        doResolve(then.bind(result), fulfill, reject);
        return;
      }
      fulfill(result);
    } catch (error) {
      reject(error);
    }
  };

  const handle = (handler) => {
    if (this.state === PENDING) {
      this.handlers.push(handler);
    } else {
      if (
        this.state === FULFILLED &&
        typeof handler.onFulfilled === "function"
      ) {
        handler.onFulfilled(this.value);
      }
      if (this.state === REJECTED && typeof handler.onRejected === "function") {
        handler.onRejected(this.value);
      }
    }
  };

  this.done = (onFulfilled, onRejected) => {
    // ensure we are always asynchronous
    setTimeout(() => {
      handle({ onFulfilled, onRejected });
    }, 0);
  };

  this.then = (onFulfilled, onRejected) => {
    return new Promise((resolve, reject) => {
      return this.done(
        (result) => {
          if (typeof onFulfilled === "function") {
            try {
              return resolve(onFulfilled(result));
            } catch (error) {
              return reject(error);
            }
          } else {
            return resolve(result);
          }
        },
        (error) => {
          if (typeof onRejected === "function") {
            try {
              return resolve(onRejected(error));
            } catch (error) {
              return reject(error);
            }
          } else {
            return reject(error);
          }
        }
      );
    });
  };

  doResolve(executor, resolve, reject);
}

// Check if a value is a Promise and, if it is, return the `then` method of that promise.
function getThen(value) {
  const t = typeof value;
  if (value & (t === "object" || t === "function")) {
    const then = value.then;
    if (typeof then === "function") {
      return then;
    }
  }
  return null;
}

// Take a potentially misbehaving resolver function and make sure
// onFulfilled and onRejected are only called once.
// Makes no guarantees about asynchrony.
function doResolve(fn, onFulfilled, onRejected) {
  let done = false;
  try {
    fn(
      (value) => {
        if (done) return;
        done = true;
        onFulfilled(value);
      },
      (reason) => {
        if (done) return;
        done = true;
        onRejected(reason);
      }
    );
  } catch (error) {
    if (done) return;
    done = true;
    onRejected(error);
  }
}
