'use strict';

const axios = require('axios');

const Stream = require('./stream');
const { HOST } = require('./settings');

class Streamkit {
  constructor(token) {
    this._token = token;
  }

  _headers() {
    return {
      headers: { 'Authorization': 'Bearer ' + this._token
      }
    };
  }

  createStream(name, endpoint, streamType, frequency, headers) {
    try {
      return axios.post(`${HOST}/streams`,
                        { name: name,
                          endpoint: endpoint,
                          type: streamType,
                          frequency: frequency,
                          headers: JSON.stringify(typeof(headers) === 'string'
                                                ? [headers]
                                                : headers) },
                        this._headers());
    } catch(error) {
      return Promise.reject(error);
    }      
  }

  streams() {
    try {
      return axios.get(`${HOST}/streams`, this._headers())
                  .then(response => {
                    const streams = response.data.streams;
                    return streams.map(stream => new Stream(stream,
                                                            this._headers()));
                  });
    } catch(error) {
      return Promise.reject(error);
    }
  }

  quota() {
    try {
      return axios.get(`${HOST}/quota`, this._headers());
    } catch(error) {
      return Promise.reject(error);
    }
  }
}

module.exports = function(token) {
  return new Streamkit(token);
}

