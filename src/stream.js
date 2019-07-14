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
    return new Observable(subscriber => {
      try {
        axios.get(`${HOST}/events?stream=${this._name}&tail=${tail}`,
                  { ...this._headers,
                    responseType: 'stream' })
             .then(response => {
               const stream = response.data;
               let event = '';

               stream.on('data', chunk => {
                 let event_end = /\n\n/.exec(chunk);
                 if (event_end) {
                   event += chunk.slice(0, event_end.index);

                   subscriber.next(
                     JSON.parse(event.replace(/^event.*\ndata:/, '').trim())
                   );

                   event = chunk.slice(event_end.index + 2);
                 } else {
                   event += chunk;
                 }
               });
               stream.on('complete', completed => subscriber.complete(completed));
             });
      } catch(error) {
        subscriber.complete(error);
      }
    });
  }
}

module.exports = Stream;
