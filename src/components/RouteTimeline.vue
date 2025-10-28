<template>
  <v-card variant="outlined" class="mt-4">
    <v-card-title>
      <v-icon class="mr-2">mdi-timeline</v-icon>
      Flight Path Details
    </v-card-title>
    <v-card-text>
      <v-timeline density="compact" side="end">
        <v-timeline-item
          v-for="(airport, idx) in route.path_details"
          :key="idx"
          :dot-color="idx === 0 ? 'success' : (idx === route.path_details.length - 1 ? 'error' : 'primary')"
          size="small"
        >
          <template v-slot:icon>
            <v-icon size="small">
              {{ idx === 0 ? 'mdi-airplane-takeoff' : (idx === route.path_details.length - 1 ? 'mdi-airplane-landing' : 'mdi-airplane') }}
            </v-icon>
          </template>
          
          <v-card>
            <v-card-title class="text-subtitle-1">
              <v-chip size="small" :color="idx === 0 ? 'success' : (idx === route.path_details.length - 1 ? 'error' : 'primary')" class="mr-2">
                {{ airport.iata }}
              </v-chip>
              {{ airport.name }}
            </v-card-title>
            <v-card-subtitle>
              <v-icon size="small">mdi-map-marker</v-icon>
              {{ airport.city }}, {{ airport.country }}
            </v-card-subtitle>
            
            <v-card-text v-if="idx < route.segments.length">
              <v-divider class="mb-3"></v-divider>
              <div class="text-subtitle-2 mb-2">
                <v-icon size="small">mdi-airplane</v-icon>
                Flight to {{ route.path_details[idx + 1].iata }}
              </div>
              <v-chip size="small" color="primary" class="mr-2 mb-2">
                <v-icon start size="x-small">mdi-clock</v-icon>
                {{ route.segments[idx].time.toFixed(1) }}h
              </v-chip>
              <v-chip size="small" color="success" class="mr-2 mb-2">
                <v-icon start size="x-small">mdi-map-marker-distance</v-icon>
                {{ route.segments[idx].distance.toLocaleString() }} km
              </v-chip>
              <v-chip size="small" color="warning" class="mr-2 mb-2">
                <v-icon start size="x-small">mdi-currency-usd</v-icon>
                ${{ route.segments[idx].cost.toFixed(0) }}
              </v-chip>
              <v-chip v-if="route.segments[idx].airline !== 'N/A'" size="small" color="grey" class="mb-2">
                <v-icon start size="x-small">mdi-airplane</v-icon>
                {{ route.segments[idx].airline }}
              </v-chip>
            </v-card-text>
            
            <v-card-text v-if="idx > 0 && idx < route.path_details.length - 1" class="pt-0">
              <v-alert density="compact" type="info" variant="tonal">
                <v-icon start size="small">mdi-information</v-icon>
                Transfer time: ~90 minutes
              </v-alert>
            </v-card-text>
          </v-card>
        </v-timeline-item>
      </v-timeline>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  route: {
    type: Object,
    required: true,
  },
})
</script>