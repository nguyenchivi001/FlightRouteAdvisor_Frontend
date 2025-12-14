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

    <v-card
      v-if="lastSearchPayload"
      variant="outlined"
      class="mt-4"
    >
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-timer</v-icon>
        Algorithm Comparison
        <v-spacer />
        <v-btn
          color="primary"
          :loading="comparing"
          :disabled="comparing"
          @click="runComparison"
        >
          <v-icon class="mr-2">mdi-flash</v-icon>
          Compare now
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div class="text-body-2 text-medium-emphasis mb-3">
          Using last search: {{ lastSearchPayload?.source }} → {{ lastSearchPayload?.destination }} ({{ lastSearchPayload?.costType }}, max stops: {{ lastSearchPayload?.maxStops ?? 'No limit' }})
        </div>

        <v-alert
          v-if="compareResult && compareResult.results?.length === 0"
          type="warning"
          variant="tonal"
        >
          No comparison data.
        </v-alert>

        <v-row v-if="compareResult && compareResult.results?.length" dense>
          <v-col
            v-for="item in compareResult.results"
            :key="item.name"
            cols="12"
            md="6"
          >
            <v-card variant="outlined">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" :color="item.name === 'astar' ? 'deep-purple' : 'primary'">
                  {{ item.name === 'astar' ? 'mdi-star-outline' : 'mdi-routes' }}
                </v-icon>
                {{ item.name.toUpperCase() }}
                <v-spacer />
                <v-chip :color="item.found ? 'success' : 'error'" size="small" variant="flat">
                  {{ item.found ? 'Found' : 'No path' }}
                </v-chip>
              </v-card-title>
              <v-card-text>
                <div class="text-h6 font-weight-bold mb-2">{{ item.elapsed_ms }} ms</div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.route ? 'Stops: ' + item.route.stops + ' | Total time: ' + item.route.total_time + 'h' : 'No route details' }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-skeleton-loader
          v-if="comparing && !compareResult"
          type="card"
          class="mt-2"
        />
      </v-card-text>
    </v-card>

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
const comparing = ref(false)
const routes = ref([])
const compareResult = ref(null)
const lastSearchPayload = ref(null)
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
  compareResult.value = null
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
    lastSearchPayload.value = {
      source,
      destination,
      costType,
      maxStops,
      maxTotalTime,
      maxTotalCost,
      stopsFilter,
      hideInternational,
      sortBy,
    }
    
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

const runComparison = async () => {
  if (!lastSearchPayload.value) {
    showSnackbar('Please run a search first.', 'warning')
    return
  }
  const { source, destination, costType, maxStops } = lastSearchPayload.value

  comparing.value = true
  compareResult.value = null
  try {
    const resp = await api.compareAlgorithms(source, destination, costType, maxStops)
    compareResult.value = resp.data
    showSnackbar('Comparison completed.', 'success')
  } catch (error) {
    console.error('Error comparing algorithms:', error)
    showSnackbar(error.response?.data?.detail || 'Comparison failed.', 'error')
  } finally {
    comparing.value = false
  }
}
</script>