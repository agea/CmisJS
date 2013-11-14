(function() {

  'use strict';

  var Promise = function() {
    this.thenTargets = [];
    this.pending = true;
  };

  var isPromise = function(promise) {
    return promise && promise instanceof Promise;
  }

  var isPseudoPromise = function(promise) {
    return promise && typeof promise.then == 'function';
  }

  Promise.prototype.resolve = function(promise, value) {
    if (promise === value) {
      throw new TypeError('resolve: arguments cannot be the same object')
    }
    if (promise === value) {
      throw new TypeError('resolve: arguments cannot be the same object')
    }
    if (isPromise(value) || isPseudoPromise(value)) {
      value.then(promise.fulfil.bind(promise), promise.reject.bind(promise))
    } else {
      promise.fulfil(value);
    }
  };

  Promise.prototype.handleThenTargets = function() {
    var callbackResult;
    var callback;
    var value;
    var i;

    for (i=0;i<this.thenTargets.length;++i) {
      if (this.fulfilled) {
        callback = this.thenTargets[i].onFulfilled;
        value = this.value;
      }
      if (this.rejected) {
        callback = this.thenTargets[i].onRejected;
        value = this.reason;
      }
      try {
        if (callback && typeof callback === 'function') {
          callbackResult = callback.apply(undefined, value);
        } else {
          callbackResult = this;
        }
        this.resolve(this.thenTargets[i], callbackResult);
      }
      catch(err) {
        this.thenTargets[i].reject(err);
      }
    }
    this.thenTargets = [];
  };

  Promise.prototype.handleThen = function() {
    if (!this.pending) {
      this.handleThenTargets();
    }
  };

  Promise.prototype.then = function(onFulfilled, onRejected) {
    var thenResult = new Promise();
    // The execution of then is asynchronous so we need to have this info available later.
    thenResult.onFulfilled = onFulfilled;
    thenResult.onRejected = onRejected;
    this.thenTargets.push(thenResult);
    setTimeout(this.handleThen.bind(this),0);
    return thenResult;
  };

  Promise.prototype.fulfil = function() {
    var i;
    var linkedPromise;
    if (this.rejected) {
      return;
    }
    this.fulfilled = true;
    this.pending = false;
    this.value = arguments;

    this.handleThenTargets();
  };

  Promise.prototype.reject = function() {
    var i;
    var linkedPromise;
    if (this.fulfilled) {
      return;
    }
    this.reason = arguments;
    this.rejected = true;
    this.pending = false;
    this.handleThenTargets();
  }

  this.Promise = Promise;

}).call(this);