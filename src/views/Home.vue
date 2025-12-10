<template>
  <div>
    <RouteSearchForm 
      @search="handleSearch"
      @error="handleError"
      :searching="searching"
    />

    <RouteResults 
      v-if="routes.length > 0"
      :routes="routes" 
    />

    <v-snackbar
      v-model="snackbar.show"
      :timeout="4000"
      :color="snackbar.color"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api'

import RouteSearchForm from '../components/RouteSearchForm.vue'
import RouteResults from '../components/RouteResults.vue' 

const searching = ref(false)
const routes = ref([])
const snackbar = ref({
  show: false,
  message: '',
  color: 'error',
})

const showSnackbar = (message, color = 'info') => {
  snackbar.value.message = message
  snackbar.value.color = color
  snackbar.value.show = true
}

const handleError = (message) => {
  showSnackbar(message, 'error')
}

const filterAndSortRoutes = (rawRoutes, criteria) => {
  if (!rawRoutes || rawRoutes.length === 0) return []
  const {
    maxTotalTime,
    maxTotalCost,
    stopsFilter,
    hideInternational,
    sortBy,
  } = criteria

  const filtered = rawRoutes.filter((r) => {
    if (maxTotalTime != null && maxTotalTime !== '' && (r.total_time ?? Infinity) > maxTotalTime) return false
    if (maxTotalCost != null && maxTotalCost !== '' && (r.total_cost ?? Infinity) > maxTotalCost) return false
    if (stopsFilter === 'direct' && (r.stops ?? 0) !== 0) return false
    if (stopsFilter === 'max1' && (r.stops ?? 0) > 1) return false
    if (hideInternational) {
      const hasIntl = r.path_details?.some(a => a.transfer?.is_international)
      if (hasIntl) return false
    }
    return true
  })

  const sortKeyMap = {
    time: 'total_time',
    cost: 'total_cost',
    distance: 'total_distance',
    stops: 'stops',
  }
  const key = sortKeyMap[sortBy] || 'total_time'

  filtered.sort((a, b) => {
    const av = a?.[key] ?? Infinity
    const bv = b?.[key] ?? Infinity
    return av - bv
  })

  return filtered
}

const handleSearch = async ({
  source,
  destination,
  kPaths,
  maxTotalTime,
  maxTotalCost,
  stopsFilter,
  hideInternational,
  sortBy,
}) => {
  if (!source || !destination) {
    handleError('Please select both origin and destination.')
    return
  }

  // Map UI filters to API params
  const costType = ['time', 'cost', 'distance'].includes(sortBy) ? sortBy : 'time'
  const maxStops = stopsFilter === 'direct' ? 0 : (stopsFilter === 'max1' ? 1 : null)

  searching.value = true
  routes.value = [] 
  try {
    const response = await api.findAlternativeRoutes(
      source,
      destination,
      costType,
      kPaths,
      maxStops
    )
    
    const rawRoutes = response.data.routes || []
    const filtered = filterAndSortRoutes(rawRoutes, {
      maxTotalTime,
      maxTotalCost,
      stopsFilter,
      hideInternational,
      sortBy,
    })

    routes.value = filtered
    
    if (filtered.length === 0) {
      showSnackbar('No routes match your filters.', 'warning')
    } else {
      showSnackbar(`Found ${filtered.length} route(s)!`, 'success')
    }

  } catch (error) {
    console.error('Error searching routes:', error)
    handleError(error.response?.data?.detail || 'An unexpected error occurred while searching for routes.')
  } finally {
    searching.value = false
  }
}
</script>