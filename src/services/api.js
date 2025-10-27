import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error('API Error:', error.response.data)
    } else if (error.request) {
      console.error('Network Error (CORS/Timeout):', error.request)
    } else {
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export default {
  searchAirports(query) {
    return api.get('/airports/search', { params: { q: query } })
  },

  getAirportInfo(iata) {
    return api.get(`/airports/${iata}`)
  },

  findAlternativeRoutes(source, destination, costType = 'time', kPaths = 5, maxStops = null) {
    const payload = {
      source,
      destination,
      cost_type: costType,
      k_paths: kPaths,
    }
    
    if (maxStops !== null) {
      payload.max_stops = maxStops
    }
    
    return api.post('/routes/alternatives', payload)
  },

  getTopHubs(metric = 'degree', topK = 20) {
    return api.get('/hubs/top', {
      params: { metric, top_k: topK },
    })
  },

  analyzeHubRemoval(source, destination, hubsToRemove) {
    return api.post('/hubs/removal-analysis', {
      source,
      destination,
      hubs_to_remove: hubsToRemove,
    })
  },

  findAlternativeHubs(source, destination, primaryHub, topK = 5) {
    return api.post('/hubs/alternatives', {
      source,
      destination,
      primary_hub: primaryHub,
      top_k: topK,
    })
  },

  getGraphStats() {
    return api.get('/graph/stats')
  },

  healthCheck() {
    return api.get('/health')
  },
}