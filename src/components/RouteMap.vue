<template>
  <div class="map-container">
    <div ref="mapRef" class="map"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const props = defineProps({
  routes: {
    type: Array,
    default: () => [],
  },
  selectedRouteIndex: {
    type: Number,
    default: 0,
  },
})

const mapRef = ref(null)
let map = null
let mapLayers = []

const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4']

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})

watch([() => props.routes, () => props.selectedRouteIndex], () => {
  updateMap()
}, { deep: true })

const initMap = () => {
  if (!mapRef.value) return
  
  map = L.map(mapRef.value, {
    center: [20, 0],
    zoom: 2,
    zoomControl: true,
  })
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map)
  
  updateMap()
  
  nextTick(() => {
      if (map) map.invalidateSize();
  });
}

const clearMap = () => {
  mapLayers.forEach(layer => map.removeLayer(layer))
  mapLayers = []
}

const updateMap = () => {
  if (!map) return
  
  clearMap()
  
  if (props.routes.length === 0) return
  
  props.routes.forEach((route, index) => {
    drawRoute(route, index)
  })
  
  const selectedRoute = props.routes[props.selectedRouteIndex]
  if (selectedRoute) {
    drawRoute(selectedRoute, props.selectedRouteIndex, true)
  }

  setTimeout(() => {
    if (map) {
      fitBoundsForSelectedRoute()
      map.invalidateSize(); 
    }
  }, 50);
}

const fitBoundsForSelectedRoute = () => {
  const selectedRoute = props.routes[props.selectedRouteIndex]
  let points = [];
  
  const safeGetPoints = (route) => route.path_details
      .filter(airport => airport.latitude && airport.longitude) 
      .map(airport => [parseFloat(airport.latitude), parseFloat(airport.longitude)])

  if (selectedRoute && selectedRoute.path_details && selectedRoute.path_details.length > 0) {
    points = safeGetPoints(selectedRoute)
  } else if (props.routes.length > 0 && props.routes[0].path_details.length > 0) {
    points = safeGetPoints(props.routes[0])
  }
  
  if (points.length > 0) {
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [50, 50], animate: false }) 
  }
}

const drawRoute = (route, routeIndex, isSelectedOverride = false) => {
  if (!route.path_details || route.path_details.length < 2 || 
      route.path_details.some(a => isNaN(parseFloat(a.latitude)) || isNaN(parseFloat(a.longitude)))) {
      return
  }
  
  const isSelected = isSelectedOverride || (routeIndex === props.selectedRouteIndex)
  const color = colors[routeIndex % colors.length]
  const opacity = isSelected ? 0.9 : 0.2
  const weight = isSelected ? 5 : 2
  
  route.segments.forEach((segment, segIndex) => {
    const from = route.path_details[segIndex]
    const to = route.path_details[segIndex + 1]
    
    if (from && to) {
      const startCoords = [parseFloat(from.latitude), parseFloat(from.longitude)];
      const endCoords = [parseFloat(to.latitude), parseFloat(to.longitude)];
      
      const arcPoints = createArcPoints(
        startCoords, 
        endCoords
      )
      
      const polyline = L.polyline(arcPoints, {
        color: color,
        weight: weight,
        opacity: opacity,
        smoothFactor: 1,
        pane: 'overlayPane',
      }).addTo(map)
      
      mapLayers.push(polyline)
    }
  })
  
  if (isSelected) {
    route.path_details.forEach((airport, index) => {
      const lat = parseFloat(airport.latitude);
      const lng = parseFloat(airport.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      const isOrigin = index === 0
      const isDestination = index === route.path_details.length - 1
      
      let iconColor, iconHtml;
      if (isOrigin) {
        iconColor = '#4CAF50'; iconHtml = '✈';
      } else if (isDestination) {
        iconColor = '#F44336'; iconHtml = '⚑';
      } else {
        iconColor = color; iconHtml = '●';
      }

      const icon = L.divIcon({
        html: `<div style="
          background-color: ${iconColor};
          color: white;
          border: 3px solid white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        ">${iconHtml}</div>`,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      
      const marker = L.marker([lat, lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : 0
      })
        .bindPopup(createPopupContent(airport, route, index))
        .addTo(map)
      
      mapLayers.push(marker)
    })
  }
}

const createArcPoints = (start, end, numPoints = 100) => {
  const points = []
  const [startLatRad, startLngRad] = [start[0] * Math.PI / 180, start[1] * Math.PI / 180]
  const [endLatRad, endLngRad] = [end[0] * Math.PI / 180, end[1] * Math.PI / 180]
  
  const d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((startLatRad - endLatRad) / 2), 2) +
    Math.cos(startLatRad) * Math.cos(endLatRad) *
    Math.pow(Math.sin((startLngRad - endLngRad) / 2), 2)
  ))
  
  if (d === 0) return [start, end]
  
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints
    const a = Math.sin((1 - f) * d) / Math.sin(d)
    const b = Math.sin(f * d) / Math.sin(d)
    const x = a * Math.cos(startLatRad) * Math.cos(startLngRad) + b * Math.cos(endLatRad) * Math.cos(endLngRad)
    const y = a * Math.cos(startLatRad) * Math.sin(startLngRad) + b * Math.cos(endLatRad) * Math.sin(endLngRad)
    const z = a * Math.sin(startLatRad) + b * Math.sin(endLatRad)
    
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI
    const lng = Math.atan2(y, x) * 180 / Math.PI
    
    points.push([lat, lng])
  }
  
  return points
}

const createPopupContent = (airport, route, index) => {
  let content = `
    <div style="min-width: 220px; font-family: 'Roboto', sans-serif;">
      <h3 style="margin: 0 0 8px 0; color: #1976D2;">
        ${airport.iata} - ${airport.name}
      </h3>
      <p style="margin: 4px 0; color: #666;">
        <strong>${airport.city}, ${airport.country}</strong>
      </p>
  `
  
  const isTransferPoint = index > 0 && index < route.path_details.length - 1;
  
  if (index === 0) {
    content += `<p style="margin: 8px 0 4px 0; color: #4CAF50; font-weight: bold;">✈ Origin</p>`
  } else if (index === route.path_details.length - 1) {
    content += `<p style="margin: 8px 0 4px 0; color: #F44336; font-weight: bold;">⚑ Destination</p>`
  } else if (isTransferPoint) {
    content += `<p style="margin: 8px 0 4px 0; color: #FF9800; font-weight: bold;">● Transfer Point</p>`
  
    if (airport.transfer) {
        const transferTime = airport.transfer.time.toFixed(1);
        const isInternational = airport.transfer.is_international;
        
        content += `
            <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">
            <p style="margin: 4px 0; font-weight: bold;">Transfer Details:</p>
            <table style="width: 100%; font-size: 13px;">
                <tr>
                    <td>Wait Time:</td>
                    <td style="text-align: right;"><strong>${transferTime} hours</strong></td>
                </tr>
        `;
        
        if (isInternational) {
             content += `
                <tr>
                    <td>Type:</td>
                    <td style="text-align: right; color: #C62828;">
                        <strong title="Requires Passport/Visa check">
                            <span style="font-size: 12px;"></span> International
                        </strong>
                    </td>
                </tr>
            `;
        } else {
             content += `
                <tr>
                    <td>Type:</td>
                    <td style="text-align: right; color: #1B5E20;">
                        <strong title="Domestic transfer">Domestic</strong>
                    </td>
                </tr>
            `;
        }
        content += `</table>`;
    }
  }
  
  if (index < route.segments.length) {
    const segment = route.segments[index]
    content += `
      <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">
      <p style="margin: 4px 0; font-weight: bold;">Next Flight Segment:</p>
      <table style="width: 100%; font-size: 13px;">
        <tr>
          <td>Distance:</td>
          <td style="text-align: right;"><strong>${segment.distance.toLocaleString()} km</strong></td>
        </tr>
        <tr>
          <td>Duration:</td>
          <td style="text-align: right;"><strong>${segment.time.toFixed(1)} hours</strong></td>
        </tr>
        <tr>
          <td>Cost:</td>
          <td style="text-align: right;"><strong>$${segment.cost.toFixed(0)}</strong></td>
        </tr>
      </table>
    `
  }
  
  content += '</div>'
  return content
}
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}

.map {
  width: 100%;
  height: 550px;
  border-radius: 4px;
}

:deep(.custom-marker) {
  background: transparent !important;
  border: none !important;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
}
</style>