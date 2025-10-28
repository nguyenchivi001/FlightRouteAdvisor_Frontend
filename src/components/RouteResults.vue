<template>
  <v-card v-if="routes && routes.length > 0" class="mt-4">
    <v-card-title class="bg-primary">
      <v-icon class="mr-2">mdi-map-marker-path</v-icon>
      Found {{ routes.length }} Route(s)
    </v-card-title>
    
    <v-card-text>
      <v-tabs v-model="selectedRouteIndex" color="primary">
        <v-tab v-for="(route, index) in routes" :key="index" :value="index">
          Route {{ index + 1 }}
          <v-chip size="x-small" class="ml-2" color="primary">
            {{ route.stops }} stops
          </v-chip>
        </v-tab>
      </v-tabs>

      <v-window v-model="selectedRouteIndex">
        <v-window-item v-for="(route, index) in routes" :key="index" :value="index">
          <RouteSummaryCards :route="route" class="mt-4" />

          <v-card variant="outlined" class="mt-4">
            <v-card-title>
              <v-icon class="mr-2">mdi-map</v-icon>
              Flight Path Map
            </v-card-title>
            <v-card-text class="pa-0">
              <RouteMap :routes="routes" :selected-route-index="selectedRouteIndex" />
            </v-card-text>
          </v-card>

          <RouteTimeline :route="route" />

          <!-- 🌟 WHAT-IF ANALYSIS - Ngay sau timeline -->
          <WhatIfAnalysis 
            :route="route" 
            :source="getFirstAirport(route)"
            :destination="getLastAirport(route)"
            class="mt-4"
          />
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import RouteMap from './RouteMap.vue'
import RouteSummaryCards from './RouteSummaryCards.vue'
import RouteTimeline from './RouteTimeline.vue'
import WhatIfAnalysis from './WhatIfAnalysis.vue'

const props = defineProps({
  routes: {
    type: Array,
    default: () => [],
  },
})

const selectedRouteIndex = ref(0)

watch(() => props.routes, () => {
  selectedRouteIndex.value = 0
}, { deep: true })

const getFirstAirport = (route) => {
  return route.path_details?.[0]?.iata || null
}

const getLastAirport = (route) => {
  const details = route.path_details
  return details?.[details.length - 1]?.iata || null
}
</script>