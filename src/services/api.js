import axios from 'axios'

// Lấy API URL từ biến môi trường, mặc định là http://localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
})

// Interceptor để xử lý lỗi tập trung
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Lỗi từ server (4xx, 5xx)
      console.error('API Error:', error.response.data)
    } else if (error.request) {
      // Lỗi mạng, Timeout, hoặc **CORS Block**
      console.error('Network Error (CORS/Timeout):', error.request)
    } else {
      // Lỗi thiết lập request
      console.error('Error:', error.message)
    }
    // Chuyển lỗi xuống component cha (Home.vue) để hiển thị Snackbar
    return Promise.reject(error)
  }
)

export default {
  // Airport endpoints
  searchAirports(query) {
    // GET /airports/search?q=query
    return api.get('/airports/search', { params: { q: query } })
  },

  getAirportInfo(iata) {
    return api.get(`/airports/${iata}`)
  },

  // Route endpoints
  // Sửa: Thêm tham số maxStops
  findAlternativeRoutes(source, destination, costType = 'time', kPaths = 5, maxStops = null) {
    // POST /routes/alternatives
    // max_stops sẽ là null (hoặc không tồn tại trong payload nếu là null) nếu không giới hạn
    const payload = {
      source,
      destination,
      cost_type: costType,
      k_paths: kPaths,
    }
    
    // Chỉ thêm max_stops vào payload nếu nó không phải là null (để phù hợp với pydantic Optional[int])
    if (maxStops !== null) {
      payload.max_stops = maxStops
    }
    
    return api.post('/routes/alternatives', payload)
  },

  // Hub endpoints
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

  // Graph endpoints
  getGraphStats() {
    return api.get('/graph/stats')
  },

  healthCheck() {
    return api.get('/health')
  },
}