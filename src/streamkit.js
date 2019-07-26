'use strict';

const axios = require('axios');

const Stream = require('./stream');
const { HOST } = require('./settings');

class Streamkit {
  constructor(token) {
    this._token = token;
  }

  _headers() {
    let headers = {};
    
    if (this._token) {
      headers['Authorization'] = `Bearer: ${this._token}`;
    }
    
    return headers;
  }

  createStream(name, endpoint, streamType, frequency, headers) {
    if (!this._token) throw 'This operation needs a valid token';
    
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
    if (!this._token) throw 'This operation needs a valid token';

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
    if (this._token) {
      return axios.get(`${HOST}/stream/${_stream}`,
                       this._headers())
                  .then(
                    response =>
                      new Stream(response.data.stream,
                                 this._headers(),
                                 this._token)
                  );
    } else {
      return Promise.resolve(new Stream({ name: _stream }));
    }
  }
  
  quota() {
    if (!this._token) throw 'This operation needs a valid token';
    
    return axios.get(`${HOST}/quota`, this._headers());
  }
}

module.exports = function(token) {
  return new Streamkit(token);
}

