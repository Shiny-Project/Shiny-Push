'use strict';
module.exports = {
  sleep: delay => new Promise(resolve => setTimeout(resolve, delay)),
};
