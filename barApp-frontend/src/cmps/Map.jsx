import React, { useState } from 'react'
import GoogleMapReact from 'google-map-react'

function Marker() {
  return (
    <div className="branch-marker">
      <span className="marker-icon">📍</span>
    </div>
  )
}

const API_KEY =
  import.meta.env.GOOGLE_MAP_API || 'REDACTED_GOOGLE_API_KEY'

export function Map() {
  const [coordinates, setCoordinates] = useState({ lat: 32.0853, lng: 34.7818 })
  const [zoom, setZoom] = useState(8)

  function handleClick({ lat, lng }) {
    setCoordinates({ lat, lng })
  }
  const branches = [
    {
      city: 'Haifa',
      id: 101,
      position: {
        lat: 32.820789,
        lng: 34.963488,
      },
    },
    {
      city: 'Tel Aviv',
      id: 102,

      position: {
        lat: 32.071035,
        lng: 34.779118,
      },
    },
    {
      city: 'Jerusalem',
      id: 103,
      position: {
        lat: 31.773362,
        lng: 35.221193,
      },
    },
  ]

  return (
    // Important! Always set the container height explicitly
    <div>
      {branches.map(branch => {
        return (
          <button
            key={branch.city}
            onClick={() => {
              setCoordinates(branch.position)
              setZoom(12)
            }}
          >
            {branch.city}
          </button>
        )
      })}
      <div className="map" style={{ height: '60vh', width: '100%' }}>
        <GoogleMapReact
          bootstrapURLKeys={{ key: API_KEY }}
          center={coordinates}
          zoom={zoom}
          onClick={handleClick}
        >
          {branches.map(branch => {
            return (
              <Marker
                lat={branch.position.lat}
                lng={branch.position.lng}
                key={branch.id}
              />
            )
          })}
        </GoogleMapReact>
      </div>
    </div>
  )
}
