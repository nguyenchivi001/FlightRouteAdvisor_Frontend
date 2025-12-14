<template>
  <v-card class="mb-4">
    <v-card-title class="bg-primary">
      <v-icon class="mr-2">mdi-airplane-search</v-icon>
      Flight Route Search
    </v-card-title>
    
    <v-card-text class="pt-6">
      <v-form ref="formRef" v-model="valid">
        <v-row>
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="source"
              v-model:search="sourceSearch"
              :items="sourceAirports"
              :loading="loadingSource"
              item-title="display"
              item-value="iata"
              label="From (Origin)"
              placeholder="Type to search airports..."
              prepend-icon="mdi-airplane-takeoff"
              clearable
              no-filter
              :rules="[v => !!v || 'Required']"
              variant="outlined"
              density="comfortable"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :title="`${item.raw.iata} - ${item.raw.name}`"
                  :subtitle="`${item.raw.city}, ${item.raw.country}`"
                ></v-list-item>
              </template>
              
              <template v-slot:no-data>
                <v-list-item>
                  <v-list-item-title>
                    {{ sourceSearch && sourceSearch.length >= 2 ? 'No results found' : 'Type at least 2 characters to search...' }}
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>

          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="destination"
              v-model:search="destinationSearch"
              :items="destinationAirports"
              :loading="loadingDestination"
              item-title="display"
              item-value="iata"
              label="To (Destination)"
              placeholder="Type to search airports..."
              prepend-icon="mdi-airplane-landing"
              clearable
              no-filter
              :rules="[v => !!v || 'Required']"
              variant="outlined"
              density="comfortable"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :title="`${item.raw.iata} - ${item.raw.name}`"
                  :subtitle="`${item.raw.city}, ${item.raw.country}`"
                ></v-list-item>
              </template>
              
              <template v-slot:no-data>
                <v-list-item>
                  <v-list-item-title>
                    {{ destinationSearch && destinationSearch.length >= 2 ? 'No results found' : 'Type at least 2 characters to search...' }}
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>

        <v-card variant="outlined" class="mt-4">
          <v-card-title class="py-3 text-subtitle-1">
            <v-icon class="mr-2">mdi-filter-variant</v-icon>
            Filters & Sorting
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6" class="d-flex flex-column">
                <div class="text-subtitle-1 font-weight-semibold mb-2">Sort by</div>
                <v-btn-toggle v-model="sortBy" color="primary" density="comfortable" divided class="w-100">
                  <v-btn value="time">Time</v-btn>
                  <v-btn value="cost">Cost</v-btn>
                  <v-btn value="distance">Distance</v-btn>
                  <v-btn value="stops">Stops</v-btn>
                </v-btn-toggle>
              </v-col>
              <v-col cols="12" md="6" class="d-flex flex-column">
                <div class="text-subtitle-1 font-weight-semibold mb-2">Stops</div>
                <v-btn-toggle v-model="stopsFilter" color="primary" density="comfortable" divided class="w-100">
                  <v-btn value="any">Any</v-btn>
                  <v-btn value="direct">Direct</v-btn>
                  <v-btn value="max1">≤ 1 stop</v-btn>
                </v-btn-toggle>
              </v-col>
            </v-row>

            <v-row class="mt-2">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="maxTotalTime"
                  label="Max Total Time (hours)"
                  prepend-icon="mdi-clock-outline"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  min="0"
                  placeholder="e.g. 20"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="maxTotalCost"
                  label="Max Estimated Cost"
                  prepend-icon="mdi-currency-usd"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  min="0"
                  placeholder="e.g. 800"
                />
              </v-col>
            </v-row>

            <v-row class="mt-2" align="center">
              <v-col cols="12" md="6" class="d-flex flex-column">
                <v-select
                  v-model="kPaths"
                  :items="[1, 3, 5, 10]"
                  label="Number of Routes"
                  prepend-icon="mdi-routes"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center mt-2 mt-md-6">
                <v-switch
                  v-model="hideInternational"
                  label="Hide international transfers"
                  color="error"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-btn
          color="primary"
          size="large"
          block
          :loading="searching"
          :disabled="!valid || searching"
          @click="performSearch"
        >
          <v-icon class="mr-2">mdi-magnify</v-icon>
          Search Routes
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '../services/api'

const emit = defineEmits(['search', 'error'])
const props = defineProps({
    searching: {
        type: Boolean,
        default: false
    }
})

const formRef = ref(null)
const valid = ref(false)
const source = ref(null)
const destination = ref(null)
const kPaths = ref(5)
const maxTotalTime = ref(null)
const maxTotalCost = ref(null)
const stopsFilter = ref('any') // any | direct | max1
const hideInternational = ref(false)
const sortBy = ref('time') // time | cost | distance | stops

const sourceAirports = ref([])
const destinationAirports = ref([])
const loadingSource = ref(false)
const loadingDestination = ref(false)
const sourceSearch = ref('')
const destinationSearch = ref('')

const searchAirports = async (query, targetAirports, targetLoading) => {
    if (!query || query.length < 2) {
        targetAirports.value = []
        return
    }
    
    targetLoading.value = true
    try {
        const response = await api.searchAirports(query)
        targetAirports.value = response.data.results.map(airport => ({
            ...airport,
            display: `${airport.iata} - ${airport.name}`,
        }))
    } catch (error) {
        console.error('Error searching airports:', error)
        emit('error', 'Error searching airports.')
    } finally {
        targetLoading.value = false
    }
}

let sourceTimeout = null
watch(sourceSearch, (val) => {
  if (sourceTimeout) clearTimeout(sourceTimeout)
  sourceTimeout = setTimeout(() => searchAirports(val, sourceAirports, loadingSource), 300)
})

let destTimeout = null
watch(destinationSearch, (val) => {
  if (destTimeout) clearTimeout(destTimeout)
  destTimeout = setTimeout(() => searchAirports(val, destinationAirports, loadingDestination), 300)
})


const performSearch = async () => {
  if (!formRef.value) return
  
  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return
  
  emit('search', {
    source: source.value,
    destination: destination.value,
    kPaths: kPaths.value,
    maxTotalTime: maxTotalTime.value,
    maxTotalCost: maxTotalCost.value,
    stopsFilter: stopsFilter.value,
    hideInternational: hideInternational.value,
    sortBy: sortBy.value,
  })
}
</script>