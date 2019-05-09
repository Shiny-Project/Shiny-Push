'use strict';

module.exports = {
  errorResponse(status, name, message) {
    return [
      status,
      {
        status: 'fail',
        error: {
          name,
          message,
        },
      },
    ];
  },
};
