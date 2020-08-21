Object.size = function (obj) {
  var size = 0,
    key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

PubSub = {
  enable: function (target) {
    (target.subscribe = function (event, callback) {
      this.subscribers = this.subscribers || {};
      this.subscribers[event] = this.subscribers[event] || [];
      this.subscribers[event].push(callback);
    }),
      (target.publish = function (event) {
        if (this.subscribers && this.subscribers[event]) {
          var subs = this.subscribers[event],
            args = [].slice.call(arguments, 1),
            n,
            max;
          for (n = 0, max = subs.length; n < max; n++)
            subs[n].apply(target, args);
        }
      });
  }
};

Element.prototype.remove = function () {
  this.parentElement.removeChild(this);
};
NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
  for (var i = this.length - 1; i >= 0; i--) {
    if (this[i] && this[i].parentElement) {
      this[i].parentElement.removeChild(this[i]);
    }
  }
};
