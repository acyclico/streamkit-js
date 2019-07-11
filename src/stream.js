'use strict';

const axios = require('axios');
const { Observable } = require('rxjs');

const { HOST } = require('./settings');

class Stream {
  constructor({ id, name, endpoint, stream_type }, headers) {
    this._id = id;
    this._name = name;
    this._endpoint = endpoint;
    this._type = stream_type;
    this._headers = headers;
  }

  events(tail=0) {
    return new Observable(observer => {
      try {
        axios.get(`${HOST}/events?stream=${this._name}&tail=${tail}`,
                  { ...this._headers,
                    responseType: 'stream' })
             .then(response => {
               const stream = response.data;
               
               stream.on('data', chunk => observer.next(chunk.toString('utf8')));
               stream.on('complete', completed => observer.complete(completed));
             });
      } catch(error) {
        observer.complete(error);
      }
    });
  }
}

module.exports = Stream;
