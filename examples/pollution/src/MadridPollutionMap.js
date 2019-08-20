import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import streamkit from 'streamkit-js';

import './MadridPollutionMap.css';
import regions from './regions';
import magnitudes from './magnitudes';

class MadridPollutionMap extends Component {
  static defaultProps = {
    center: {
      lat: 40.416775,
      lng: -3.703790
    },
    zoom: 13
  };
  
  state = {
    measures: {},
    time: 0,
    magnitude: "08"
  }

  constructor(props) {
    super(props);
    this.sk = streamkit();
  }

  async componentDidMount() {
    /* mad_env polls data each hour and we will */
    /* process events for the last days */
    const maxEvents = 24 * 2,
          measures = {},
          stream = await this.sk.stream('mad_env');

    stream
      .events(maxEvents)
      .subscribe(event => {
        if (event.mad_env === undefined) return;

        /* Events are retrieved in CSV format */
        /* and some processing is needed */
        const datas = event.mad_env
                           .data.split('\n')
                           .map(data => data.split(','));

        datas.forEach(data => {
          const regionId = data[0] + data[1] + data[2],
                region = regions[regionId],
                magnitudeId = data[3],
                dataMeasures = data.splice(9),
                date = data.slice(6, 9).join("/");
          
          if (measures[magnitudeId] === undefined)
              measures[magnitudeId] = [];

          for (let idx = 0; idx < dataMeasures.length; idx+=2) {
            if (dataMeasures[idx + 1] === 'N') continue;
            
            let measure = dataMeasures[idx];
            const hour = idx / 2,
                  timestamp = new Date(date + ` ${hour}:00`);
            
            if (measures[magnitudeId][timestamp] === undefined)
              measures[magnitudeId][timestamp] = [];

            if (
              measures[magnitudeId][timestamp]
                .find(i => i.name === region.name) === undefined
            )
              measures[magnitudeId][timestamp].push({
                ...region,
                weight: parseInt(measure, 10)
              });
          }
        });

        this.setState({
          measures: measures,
          time: Object.keys(measures[this.state.magnitude]).length - 1
        });
      });
  }

  handleTimeChange = (event) => {
    this.setState({ time: event.target.value });
  }

  handleMagnitudeChange = (event) => {
    this.setState({ magnitude: event.target.value });
  }

  renderMap(measures) {
    const maxIntensity =
          this.state.magnitude && this.state.measures[this.state.magnitude]
          ? Math.max(
            ...measures.map(
              measures => Math.max(...measures.map(m => m.weight))
            )
          )
          : 0;
    const mapData = {
  		positions: measures[this.state.time],
		  options: {
			  radius: 100,
			  opacity: 0.7,
        dissipating: true,
        maxIntensity: maxIntensity
		  }
    };

    return (
      <GoogleMapReact
        bootstrapURLKeys={{ key: 'AIzaSyB6SryPXJIvJZqT048WNRtPF1giiW8UCbg' }}
        defaultCenter={this.props.center}
        defaultZoom={this.props.zoom}
        heatmapLibrary={true}
        heatmap={mapData}
        options={{ zoomControl: false, minZoom: this.props.zoom, maxZoom: this.props.zoom }}
      >
      </GoogleMapReact>
    );
  }

  renderSelectors(measures, measuresTimes) {
    const magnitude = this.state.magnitude,
          magnitudeOptions = Object.keys(magnitudes).map(
            (magnitude, idx) => (
              <option key={magnitude} value={magnitude}>
                { magnitudes[magnitude] }
              </option>
            )
          );

    return (
      <div className="magnitudeDetails">
        <select value={magnitude}
                onChange={this.handleMagnitudeChange}
                className="magnitudeSelector"
                >
          { magnitudeOptions }
        </select>
        <div className="eventSelector">
          <input type="range"
                 name="time"
                 value={this.state.time}
                 min="0"
                 max={Object.keys(measures).length - 1}
                 onChange={this.handleTimeChange}
                 />
          <div className="label">
            { new Date(measuresTimes[this.state.time]).toLocaleString() }
          </div>
        </div>
      </div>
    );
  }
  
  render() {
    const magnitude = this.state.magnitude;
    
    if (this.state.measures[magnitude]) {
      const measures = Object.values(this.state.measures[magnitude]),
            measuresTimes = Object.keys(this.state.measures[magnitude]);
      
      return (
        <div className="container">
          <div className="mapContainer">
            { this.renderMap(measures) }
          </div>
          { this.renderSelectors(measures, measuresTimes) }
        </div>
      );
    } else {
      return (<div></div>);
    }
  }
}

export default MadridPollutionMap;
