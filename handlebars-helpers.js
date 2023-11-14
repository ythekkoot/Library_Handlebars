module.exports = {
  ifeq: function(a, b, options){
    if (a === b) {
      return options.fn(this);
      }
    return options.inverse(this);
  },
  bar: function(){
    return "BAR!";
  },

  not: function(obj) {
    return !obj;
  },

  ne: function( a, b ) {
    var next =  arguments[arguments.length-1];
    return (a !== b) ? next.fn(this) : next.inverse(this);
  }
};