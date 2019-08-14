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
    hour: 0,
    magnitude: "08"
  }

  constructor(props) {
    super(props);
    this.sk = streamkit();
  }

  async componentDidMount() {
    const measures = {};
    const stream = await this.sk.stream('mad_env');
    stream
      .events()
      .subscribe(event => {
        if (event.mad_env === undefined) return;
        const datas = event.mad_env.data.split('\n')
              .map(data => data.split(','));
        
        datas.forEach(data => {
          const regionId = data[0] + data[1] + data[2];
          const region = regions[regionId];
          const magnitudeId = data[3];
          const dataMeasures = data.splice(9);

          dataMeasures.forEach((measure, idx) => {
            if (idx % 2 === 1) return;

            const mIdx = idx / 2;
            
            if (measures[magnitudeId] === undefined)
              measures[magnitudeId] = [];
            if (measures[magnitudeId][mIdx] === undefined)
              measures[magnitudeId][mIdx] = [];

            measures[magnitudeId][mIdx].push({
              ...region,
              weight: parseInt(measure, 10)
            });            
          });
        });

        this.setState({ measures: measures });
      });
  }

  handleHourChange = (event) => {
    this.setState({ hour: event.target.value });
  }

  handleMagnitudeChange = (event) => {
    this.setState({ magnitude: event.target.value });
  }
  
  render() {
    const magnitude = this.state.magnitude;
    const measures = this.state.measures[magnitude]
                   ? this.state.measures[magnitude][this.state.hour]
                   : [];

    let maxIntensity = magnitude && this.state.measures[magnitude]
                     ? Math.max(
                       ...this.state.measures[magnitude].map(
                         measures => Math.max(...measures.map(m => m.weight))
                       )
                     )
                     : 0;
    
    const heatMapData = {
  		positions: measures,
		  options: {
			  radius: 100,
			  opacity: 0.7,
        dissipating: true,
        maxIntensity: maxIntensity
		  }
    };

    const magnitudeOptions = Object.keys(magnitudes).map(
      (magnitude, idx) => (
        <option key={magnitude} value={magnitude}>
          { magnitudes[magnitude] }
        </option>
      )
    );

    if (measures.length === 0)
      return (<div></div>);
    else
      return (
        <div style={{ display: 'flex', flexFlow: 'column', alignItems: 'center' }}>
          <div style={{ height: '75vh', width: '100vw' }}>
            <GoogleMapReact
              bootstrapURLKeys={{ key: 'AIzaSyB6SryPXJIvJZqT048WNRtPF1giiW8UCbg' }}
              defaultCenter={this.props.center}
              defaultZoom={this.props.zoom}
              heatmapLibrary={true}
              heatmap={heatMapData}
              options={{ zoomControl: false, minZoom: this.props.zoom, maxZoom: this.props.zoom }}
            >
            </GoogleMapReact>
          </div>
          <div className="magnitudeDetails">
            <select value={magnitude}
                    onChange={this.handleMagnitudeChange}
                    className="magnitudeSelector"
            >
              { magnitudeOptions }
            </select>
            <div className="hourSelector">
              <input type="range"
                     name="hour"
                     value={this.state.hour}
                     min="0"
                     max="23"
                     onChange={this.handleHourChange}
              />
              <div className="label">
                Today, {this.state.hour}h
              </div>
            </div>
          </div>
          
        </div>
      );
  }
}

export default MadridPollutionMap;
