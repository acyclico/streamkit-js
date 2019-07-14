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
    return axios.post(`${HOST}/streams`,
                      { name: name,
                        endpoint: endpoint,
                        type: streamType,
                        frequency: frequency,
                        headers: JSON.stringify(typeof(headers) === 'string'
                                              ? [headers]
                                              : headers) },
                      this._headers());
  }

  streams() {
    return axios.get(`${HOST}/streams`, this._headers())
                .then(
                  response =>
                    response.data
                            .streams
                            .map(stream => new Stream(stream,
                                                      this._headers(),
                                                      this._token))
                );
                  
  }

  stream(_stream) {
    return axios.get(`${HOST}/stream/${_stream}`,
                     this._headers())
                .then(
                  response =>
                    new Stream(response.data.stream,
                               this._headers(),
                               this._token)
                );
  }

  quota() {
    return axios.get(`${HOST}/quota`, this._headers());
  }
}

module.exports = function(token) {
  return new Streamkit(token);
}

