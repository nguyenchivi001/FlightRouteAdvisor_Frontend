<template>
  <v-card variant="outlined" color="warning-lighten-4">
    <v-card-title class="bg-warning">
      <v-icon class="mr-2">mdi-alert-circle-outline</v-icon>
      What-If Analysis: Hub Disruption Simulator
    </v-card-title>

    <v-card-text class="pt-4">
      <v-alert type="info" variant="tonal" density="compact" class="mb-4">
        <strong>Scenario:</strong> Simulate what happens if transfer hubs become unavailable 
        (weather, strikes, technical issues, etc.)
      </v-alert>

      <div class="mb-4">
        <div class="text-subtitle-2 mb-2">
          <v-icon size="small">mdi-airplane</v-icon>
          Current Route Path:
        </div>
        <v-chip
          v-for="(airport, idx) in route.path_details"
          :key="idx"
          size="small"
          :color="idx === 0 ? 'success' : (idx === route.path_details.length - 1 ? 'error' : 'primary')"
          class="ma-1"
        >
          {{ airport.iata }}
        </v-chip>
      </div>

      <div v-if="transferHubs.length > 0" class="mb-4">
        <div class="text-subtitle-2 mb-2">
          <v-icon size="small">mdi-map-marker</v-icon>
          Transfer Hubs in this route (click to simulate removal):
        </div>
        <v-chip
          v-for="hub in transferHubs"
          :key="hub"
          size="small"
          :color="selectedHubs.includes(hub) ? 'error' : 'grey'"
          :variant="selectedHubs.includes(hub) ? 'flat' : 'outlined'"
          class="ma-1"
          @click="toggleHub(hub)"
          style="cursor: pointer;"
        >
          <v-icon 
            start 
            size="x-small"
            :icon="selectedHubs.includes(hub) ? 'mdi-close-circle' : 'mdi-map-marker'"
          ></v-icon>
          {{ hub }}
        </v-chip>
      </div>

      <div v-else class="mb-4">
        <v-alert type="success" density="compact" variant="tonal">
          <v-icon start size="small">mdi-check-circle</v-icon>
          This is a direct flight with no transfer hubs. No what-if analysis needed!
        </v-alert>
      </div>

      <v-btn
        v-if="transferHubs.length > 0"
        color="warning"
        :loading="analyzing"
        :disabled="selectedHubs.length === 0 || analyzing"
        @click="analyzeWhatIf"
        block
        class="mb-4"
      >
        <v-icon start>mdi-chart-timeline-variant</v-icon>
        Simulate: What if {{ selectedHubs.join(', ') }} unavailable?
      </v-btn>

      <div v-if="whatIfResults">
        <v-divider class="my-4"></v-divider>

        <div class="text-h6 mb-3">
          <v-icon class="mr-2">mdi-chart-line</v-icon>
          Simulation Results
        </div>

        <v-alert v-if="!whatIfResults.path_exists" type="error" prominent class="mb-4">
          <v-row align="center">
            <v-col class="grow">
              <div class="text-h6">❌ Critical: No Alternative Route Found!</div>
              <div class="mt-2">
                Removing <strong>{{ selectedHubs.join(', ') }}</strong> makes this route impossible.
                <br>
                <strong>Recommendation:</strong> These hubs are critical for this route. 
                Consider booking flexible tickets or monitoring these hubs closely.
              </div>
            </v-col>
          </v-row>
        </v-alert>

        <div v-else>
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="h-100">
                <v-card-title class="text-subtitle-1 bg-success">
                  <v-icon start size="small">mdi-check-circle</v-icon>
                  Original Route (Normal Conditions)
                </v-card-title>
                <v-card-text>
                  <div class="mb-3">
                    <strong>Path:</strong>
                    <div class="mt-1">
                      <v-chip
                        v-for="(airport, idx) in whatIfResults.original_path.path"
                        :key="idx"
                        size="x-small"
                        class="ma-1"
                      >
                        {{ airport }}
                      </v-chip>
                    </div>
                  </div>

                  <v-simple-table density="compact">
                    <tbody>
                      <tr>
                        <td><v-icon size="small">mdi-clock</v-icon> Time:</td>
                        <td class="text-right font-weight-bold">
                          {{ whatIfResults.original_path.total_time.toFixed(1) }}h
                        </td>
                      </tr>
                      <tr>
                        <td><v-icon size="small">mdi-map-marker-distance</v-icon> Distance:</td>
                        <td class="text-right font-weight-bold">
                          {{ whatIfResults.original_path.total_distance.toLocaleString() }} km
                        </td>
                      </tr>
                      <tr>
                        <td><v-icon size="small">mdi-currency-usd</v-icon> Cost:</td>
                        <td class="text-right font-weight-bold">
                          ${{ whatIfResults.original_path.total_cost.toFixed(0) }}
                        </td>
                      </tr>
                      <tr>
                        <td><v-icon size="small">mdi-airplane-marker</v-icon> Stops:</td>
                        <td class="text-right font-weight-bold">
                          {{ whatIfResults.original_path.stops }}
                        </td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="h-100" color="warning-lighten-5">
                <v-card-title class="text-subtitle-1 bg-warning">
                  <v-icon start size="small">mdi-alert-circle</v-icon>
                  Alternative Route ({{ selectedHubs.join(', ') }} Unavailable)
                </v-card-title>
                <v-card-text>
                  <v-alert
                    v-if="hasInternationalTransfer(whatIfResults.alternative_path)"
                    type="error"
                    variant="tonal"
                    density="compact"
                    icon="mdi-passport"
                    class="mb-3"
                  >
                    This alternative route includes an **International Transfer**.
                  </v-alert>
                  <div class="mb-3">
                    <strong>New Path:</strong>
                    <div class="mt-1">
                      <v-chip
                        v-for="(airport, idx) in whatIfResults.alternative_path.path"
                        :key="idx"
                        size="x-small"
                        class="ma-1"
                        color="warning"
                      >
                        {{ airport }}
                      </v-chip>
                    </div>
                  </div>

                  <v-simple-table density="compact">
                    <tbody>
                      <tr>
                        <td><v-icon size="small">mdi-clock</v-icon> Time:</td>
                        <td class="text-right">
                          <strong>{{ whatIfResults.alternative_path.total_time.toFixed(1) }}h</strong>
                          <v-chip
                            size="x-small"
                            :color="whatIfResults.time_increase > 0 ? 'error' : 'success'"
                            class="ml-2"
                          >
                            {{ formatIncrease(whatIfResults.time_increase) }}h
                          </v-chip>
                        </td>
                      </tr>
                      <tr>
                        <td><v-icon size="small">mdi-map-marker-distance</v-icon> Distance:</td>
                        <td class="text-right">
                          <strong>{{ whatIfResults.alternative_path.total_distance.toLocaleString() }} km</strong>
                          <v-chip
                            size="x-small"
                            :color="whatIfResults.distance_increase > 0 ? 'error' : 'success'"
                            class="ml-2"
                          >
                            {{ formatIncrease(whatIfResults.distance_increase) }} km
                          </v-chip>
                        </td>
                      </tr>
                      <tr>
                        <td><v-icon size="small">mdi-currency-usd</v-icon> Cost:</td>
                        <td class="text-right">
                          <strong>${{ whatIfResults.alternative_path.total_cost.toFixed(0) }}</strong>
                          <v-chip
                            size="x-small"
                            :color="whatIfResults.cost_increase > 0 ? 'error' : 'success'"
                            class="ml-2"
                          >
                            {{ formatIncrease(whatIfResults.cost_increase, '$') }}
                          </v-chip>
                        </td>
                      </tr>
                      <tr>
                        <td><v-icon size="small">mdi-airplane-marker</v-icon> Stops:</td>
                        <td class="text-right">
                          <strong>{{ whatIfResults.alternative_path.stops }}</strong>
                          <v-chip
                            v-if="whatIfResults.stops_increase !== 0"
                            size="x-small"
                            :color="whatIfResults.stops_increase > 0 ? 'error' : 'success'"
                            class="ml-2"
                          >
                            {{ formatIncrease(whatIfResults.stops_increase) }}
                          </v-chip>
                        </td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-alert
            :type="getImpactSeverity()"
            variant="tonal"
            class="mt-4"
          >
            <div class="text-subtitle-1 font-weight-bold mb-2">
              {{ getImpactTitle() }}
            </div>
            <div>{{ getImpactMessage() }}</div>
          </v-alert>

          <v-card variant="outlined" class="mt-4" color="info-lighten-5">
            <v-card-title class="text-subtitle-1 bg-info">
              <v-icon start size="small">mdi-lightbulb</v-icon>
              Travel Recommendations
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="info">mdi-check</v-icon>
                  </template>
                  <v-list-item-title>
                    Monitor weather and operational status of <strong>{{ selectedHubs.join(', ') }}</strong>
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="info">mdi-check</v-icon>
                  </template>
                  <v-list-item-title>
                    Consider booking flexible tickets with free cancellation
                  </v-list-item-title>
                </v-list-item>
                <v-list-item v-if="whatIfResults.time_increase > 2">
                  <template v-slot:prepend>
                    <v-icon color="warning">mdi-alert</v-icon>
                  </template>
                  <v-list-item-title>
                    Significant delay ({{ whatIfResults.time_increase.toFixed(1) }}h) - plan extra buffer time
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="info">mdi-check</v-icon>
                  </template>
                  <v-list-item-title>
                    Alternative route via <strong>{{ getAlternativeHubsText() }}</strong>
                  </v-list-item-title>
                </v-list-item>
                <v-list-item v-if="hasInternationalTransfer(whatIfResults.alternative_path)">
                  <template v-slot:prepend>
                    <v-icon color="error">mdi-passport</v-icon>
                  </template>
                  <v-list-item-title class="font-weight-bold text-error">
                    **CRITICAL:** The alternative route requires International Transfer - Verify Visa/Entry requirements!
                  </v-list-item-title>
                </v-list-item>
                </v-list>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '@/services/api'

const props = defineProps({
  route: {
    type: Object,
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
})

const analyzing = ref(false)
const selectedHubs = ref([])
const whatIfResults = ref(null)

const hasInternationalTransfer = (routeData) => {
  if (!routeData.path_details) return false
  
  return routeData.path_details.some(airport => 
    airport.transfer && airport.transfer.is_international
  )
}

// Extract transfer hubs (exclude origin and destination)
const transferHubs = computed(() => {
  if (!props.route.path_details || props.route.path_details.length <= 2) {
    return []
  }
  return props.route.path_details
    .slice(1, -1)
    .map(airport => airport.iata)
})

const toggleHub = (hub) => {
  const index = selectedHubs.value.indexOf(hub)
  if (index >= 0) {
    selectedHubs.value.splice(index, 1)
  } else {
    selectedHubs.value.push(hub)
  }
  // Reset results when selection changes
  whatIfResults.value = null
}

const analyzeWhatIf = async () => {
  if (selectedHubs.value.length === 0) return

  analyzing.value = true
  whatIfResults.value = null

  try {
    const response = await api.analyzeHubRemoval(
      props.source,
      props.destination,
      selectedHubs.value
    )
    whatIfResults.value = response.data
  } catch (error) {
    console.error('Error analyzing hub removal:', error)
    // Show error to user
  } finally {
    analyzing.value = false
  }
}

const formatIncrease = (value, prefix = '') => {
  if (value > 0) return `+${prefix}${Math.abs(value).toFixed(value < 10 ? 1 : 0)}`
  if (value < 0) return `-${prefix}${Math.abs(value).toFixed(value > -10 ? 1 : 0)}`
  return '±0'
}

const getImpactSeverity = () => {
  if (!whatIfResults.value) return 'info'
  const timeIncrease = whatIfResults.value.time_increase
  if (timeIncrease > 5) return 'error'
  if (timeIncrease > 2) return 'warning'
  return 'success'
}

const getImpactTitle = () => {
  const severity = getImpactSeverity()
  if (severity === 'error') return 'High Impact: Significant Disruption'
  if (severity === 'warning') return 'Moderate Impact: Plan Accordingly'
  return 'Low Impact: Minimal Disruption'
}

const getImpactMessage = () => {
  if (!whatIfResults.value) return ''
  const timeIncrease = whatIfResults.value.time_increase
  const costIncrease = whatIfResults.value.cost_increase

  if (timeIncrease > 5) {
    return `Removing ${selectedHubs.value.join(', ')} causes major delays (${timeIncrease.toFixed(1)}h longer). Consider this hub critical for your journey.`
  }
  if (timeIncrease > 2) {
    return `Moderate impact with ${timeIncrease.toFixed(1)}h additional travel time and $${Math.abs(costIncrease).toFixed(0)} cost change.`
  }
  return `Minor impact with only ${timeIncrease.toFixed(1)}h additional time. Alternative route is viable.`
}

const getAlternativeHubsText = () => {
  if (!whatIfResults.value?.alternative_path?.path) return 'N/A'
  const altHubs = whatIfResults.value.alternative_path.path.slice(1, -1)
  return altHubs.join(', ') || 'Direct flight'
}
</script>

<style scoped>
.v-simple-table tbody tr:hover {
  background-color: transparent !important;
}
</style>