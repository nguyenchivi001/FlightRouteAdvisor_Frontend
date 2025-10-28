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

const handleSearch = async ({ source, destination, costType, maxStops, kPaths }) => {
  if (!source || !destination) {
    handleError('Please select both origin and destination.')
    return
  }

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
    
    routes.value = response.data.routes || []
    
    if (routes.value.length === 0) {
      showSnackbar('No routes found for your criteria.', 'warning')
    } else {
      showSnackbar(`Found ${routes.value.length} route(s)!`, 'success')
    }

  } catch (error) {
    console.error('Error searching routes:', error)
    handleError(error.response?.data?.detail || 'An unexpected error occurred while searching for routes.')
  } finally {
    searching.value = false
  }
}
</script>