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

        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="costType"
              :items="costTypes"
              label="Optimize By"
              prepend-icon="mdi-tune"
              variant="outlined"
              density="comfortable"
            ></v-select>
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="maxStops"
              :items="maxStopsOptions"
              label="Maximum Stops"
              prepend-icon="mdi-map-marker-multiple"
              variant="outlined"
              density="comfortable"
            ></v-select>
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="kPaths"
              :items="[1, 3, 5, 10]"
              label="Number of Routes"
              prepend-icon="mdi-routes"
              variant="outlined"
              density="comfortable"
            ></v-select>
          </v-col>
        </v-row>

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
const costType = ref('time')
const maxStops = ref(null)
const kPaths = ref(5)

const sourceAirports = ref([])
const destinationAirports = ref([])
const loadingSource = ref(false)
const loadingDestination = ref(false)
const sourceSearch = ref('')
const destinationSearch = ref('')

const costTypes = [
  { title: 'Flight Time', value: 'time' },
  { title: 'Distance', value: 'distance' },
  { title: 'Cost', value: 'cost' },
]

const maxStopsOptions = [
  { title: 'No limit', value: null },
  { title: 'Direct only', value: 0 },
  { title: 'Max 1 stop', value: 1 },
  { title: 'Max 2 stops', value: 2 },
  { title: 'Max 3 stops', value: 3 },
]

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
    costType: costType.value,
    maxStops: maxStops.value,
    kPaths: kPaths.value,
  })
}
</script>