<template>
  <v-row>
    <v-col cols="12" sm="6" md="3">
      <v-card variant="outlined">
        <v-card-text class="text-center">
          <v-icon color="primary" size="40">mdi-clock-outline</v-icon>
          <div class="text-h5 mt-2 font-weight-bold">{{ route.total_time.toFixed(1) }}h</div>
          <div class="text-caption text-grey">Total Time</div>
          <v-divider class="my-2"></v-divider>
          <div class="text-caption">
            <div>Flight: {{ route.total_flight_time.toFixed(1) }}h</div>
            <div>Transfer: {{ route.total_transfer_time.toFixed(1) }}h</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card variant="outlined">
        <v-card-text class="text-center">
          <v-icon color="success" size="40">mdi-map-marker-distance</v-icon>
          <div class="text-h5 mt-2 font-weight-bold">{{ route.total_distance.toLocaleString() }}</div>
          <div class="text-caption text-grey">Distance (km)</div>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card variant="outlined">
        <v-card-text class="text-center">
          <v-icon color="warning" size="40">mdi-currency-usd</v-icon>
          <div class="text-h5 mt-2 font-weight-bold">${{ route.total_cost.toFixed(0) }}</div>
          <div class="text-caption text-grey">Estimated Cost</div>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card variant="outlined">
        <v-card-text class="text-center">
          <v-icon color="info" size="40">mdi-airplane-marker</v-icon>
          <div class="text-h5 mt-2 font-weight-bold">{{ route.stops }}</div>
          <div class="text-caption text-grey">{{ route.stops === 1 ? 'Stop' : 'Stops' }}</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
const props = defineProps({
  route: {
    type: Object,
    required: true,
  },
})
</script>