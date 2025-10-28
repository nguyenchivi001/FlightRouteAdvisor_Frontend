<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title class="d-flex align-center">
        <v-icon size="large" class="mr-2">mdi-airplane</v-icon>
        <span class="text-h5 font-weight-bold">Flight Route Advisor</span>
      </v-app-bar-title>
      
      <v-spacer></v-spacer>
      
      <v-btn icon @click="showStats = true">
        <v-icon>mdi-chart-box</v-icon>
      </v-btn>
      
      <v-btn icon href="https://openflights.org/data.html" target="_blank">
        <v-icon>mdi-database</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-4">
        <!-- Alerts -->
        <v-alert
          v-if="error"
          type="error"
          closable
          @click:close="error = null"
          class="mb-4"
        >
          {{ error }}
        </v-alert>
        
        <v-alert
          v-if="success"
          type="success"
          closable
          @click:close="success = null"
          class="mb-4"
        >
          {{ success }}
        </v-alert>

        <!-- Main Content -->
        <router-view 
          @routes-found="handleRoutesFound"
          @error="handleError"
        />
      </v-container>
    </v-main>

    <!-- Stats Dialog -->
    <v-dialog v-model="showStats" max-width="600">
      <v-card>
        <v-card-title class="bg-primary">
          <v-icon class="mr-2">mdi-chart-box</v-icon>
          Graph Statistics
        </v-card-title>
        
        <v-card-text class="pt-4">
          <v-progress-circular
            v-if="loadingStats"
            indeterminate
            color="primary"
            class="d-block mx-auto"
          ></v-progress-circular>
          
          <v-table v-else-if="graphStats">
            <tbody>
              <tr>
                <td class="font-weight-bold">
                  <v-icon class="mr-2">mdi-airplane</v-icon>
                  Airports:
                </td>
                <td class="text-right">
                  <v-chip color="primary">
                    {{ graphStats.num_airports?.toLocaleString() }}
                  </v-chip>
                </td>
              </tr>
              <tr>
                <td class="font-weight-bold">
                  <v-icon class="mr-2">mdi-routes</v-icon>
                  Routes:
                </td>
                <td class="text-right">
                  <v-chip color="success">
                    {{ graphStats.num_routes?.toLocaleString() }}
                  </v-chip>
                </td>
              </tr>
              <tr>
                <td class="font-weight-bold">
                  <v-icon class="mr-2">mdi-chart-line</v-icon>
                  Average Degree:
                </td>
                <td class="text-right">
                  <v-chip color="info">
                    {{ graphStats.avg_degree?.toFixed(2) }}
                  </v-chip>
                </td>
              </tr>
              <tr>
                <td class="font-weight-bold">
                  <v-icon class="mr-2">mdi-network</v-icon>
                  Connected:
                </td>
                <td class="text-right">
                  <v-chip :color="graphStats.is_connected ? 'success' : 'error'">
                    {{ graphStats.is_connected ? 'Yes' : 'No' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="showStats = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-footer app>
      <v-spacer></v-spacer>
      <span class="text-caption">
        &copy; 2025 Flight Route Advisor - Data from OpenFlights.org
      </span>
      <v-spacer></v-spacer>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from './services/api'

const error = ref(null)
const success = ref(null)
const showStats = ref(false)
const graphStats = ref(null)
const loadingStats = ref(false)

onMounted(async () => {
  try {
    await api.healthCheck()
  } catch (err) {
    error.value = 'Cannot connect to backend API. Please ensure the server is running.'
  }
})

const handleRoutesFound = (results) => {
  success.value = `Found ${results.routes.length} route(s) from ${results.source} to ${results.destination}`
  error.value = null
}

const handleError = (errorMsg) => {
  error.value = errorMsg
  success.value = null
}

const loadStats = async () => {
  loadingStats.value = true
  try {
    const response = await api.getGraphStats()
    graphStats.value = response.data
  } catch (err) {
    error.value = 'Failed to load statistics'
  } finally {
    loadingStats.value = false
  }
}

// Load stats when dialog opens
const watchStats = () => {
  if (showStats.value && !graphStats.value) {
    loadStats()
  }
}

// Watch showStats
import { watch } from 'vue'
watch(showStats, watchStats)
</script>