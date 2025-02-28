<template>
  <div id="main">
    <v-card v-if="is_telegram_client && is_telegram_api_updated" class="mx-auto" max-width="600">
    </v-card>
    <RequirementsMessage :is-telegram-client="is_telegram_client" :is-telegram-api-updated="is_telegram_api_updated" />
  </div>
</template>

<script>
import { detectCodeType, prepareUrl, prepareCoordinate, prepareWifi, prepareVCard } from './helpers';
import AppSettings from "./components/AppSettings.vue"
import CardUrl from "./components/CardUrl.vue";
import CardGeo from "./components/CardGeo.vue";
import CardWifi from "./components/CardWifi.vue";
import CardVCard from "./components/CardVCard.vue"
import CardText from "./components/CardText.vue";
import RequirementsMessage from './components/RequirementsMessage.vue';

export default {
  components: {
    AppSettings,
    CardUrl,
    CardGeo,
    CardWifi,
    CardVCard,
    CardText,
    RequirementsMessage
  },
  data() {
    return {
      is_telegram_client: false,
      is_telegram_api_updated: false,
      last_code: null,
      show_history: true,
      // Cloud storage
      cloud_storage_keys: [],
      cloud_storage_values: {},
      enriched_values: {},
      is_continuous_scan: false,
      // Set the first element to expanded by default
      expanded_panels: [0],
    };
  },
  created() {
    // Binding function to the events types
    this.TMA.MainButton.setText("Scan QR code");
    this.TMA.onEvent('qrTextReceived', this.processQRCode);
    this.TMA.onEvent('mainButtonClicked', this.mainButtonClicked);

    // platform not updated if version is not 6.9 or greater
    this.is_telegram_api_updated = this.TMA.isVersionAtLeast('6.9');
    if (this.TMA.platform != "unknown") {
      this.is_telegram_client = true;
    }
    if (this.is_telegram_client && this.is_telegram_api_updated) {
      this.TMA.MainButton.show();
      this.loadStorage();
    }
  },
  mounted() {
    // Mini app ready
    this.TMA.ready();
  },
  methods: {
    // Cloud Storage methods
    loadStorage() {
      this.TMA.CloudStorage.getKeys(this.processKeys);
    },
    processKeys(error, data) {
      if (error) {
        this.TMA.showAlert(error);
        return;
      }
      //sort timestamps in descending order
      data.sort((a, b) => b - a);
      this.cloud_storage_keys = data;
      this.TMA.CloudStorage.getItems(data, this.processItems);
    },
    processItems(error, data) {
      if (error) {
        this.TMA.showAlert(error);
        return;
      }
      this.cloud_storage_values = data;
      this.enrichValues(data);
    },
    removeKey(key) {
      //TODO clean the enriched_values
      for (var index = 0; index < this.cloud_storage_keys.length; index++) {
        if (this.cloud_storage_keys[index] === key) {
          this.cloud_storage_keys.splice(index, 1);
          delete this.cloud_storage_values[key];
          break;
        }
      }
      this.TMA.CloudStorage.removeItem(key);
    },
    enrichValue(key) {
      this.enriched_values[key] = {};
      const code_type = detectCodeType(this.cloud_storage_values[key]);
      this.enriched_values[key]['type'] = code_type;

      if (code_type == "geo") {
        this.enriched_values[key]['info'] = prepareCoordinate(this.cloud_storage_values[key]);
      } else if (code_type == "wifi") {
        this.enriched_values[key]['info'] = prepareWifi(this.cloud_storage_values[key]);
      } else if (code_type == "vcard") {
        this.enriched_values[key]['info'] = prepareVCard(this.cloud_storage_values[key]);
      } else if (code_type == "url") {
        this.enriched_values[key]['info'] = prepareUrl(this.cloud_storage_values[key]);
      } else {
        this.enriched_values[key]['info'] = this.cloud_storage_values[key];
      }
    },
    enrichValues(data) {
      for (var key in data) {
        this.enrichValue(key);
      }
    },
    addToStorage(value) {
      // generate a key based on the timestamp
      const timestamp = new Date().getTime();
      this.TMA.CloudStorage.setItem(timestamp, value);
      // convert timestamp in string and add it to the array
      this.cloud_storage_keys.unshift(timestamp.toString());
      this.cloud_storage_values[timestamp] = value;
      return timestamp;
    },
    // Event Callback
    mainButtonClicked() {
      this.showQRScanner();
    },
    // QR scanner functions
    showQRScanner() {
      this.TMA.showScanQrPopup();
    },
    processQRCode(data) {
      if (data.data.length > 4096) {
        this.TMA.showAlert('Error cannot store QR codes longer than 4096 characters');
        return;
      }
      this.hapticImpact();
      this.TMA.sendData(data.data);
      this.TMA.closeScanQrPopup();
      this.TMA.close();
    },
    hapticImpact() {
      // makes the phone vibrate when QR is detected
      this.TMA.HapticFeedback.impactOccurred("rigid");
      this.TMA.HapticFeedback.impactOccurred("heavy");
    },
    // Utils
    formattedDate(timestamp) {
      // Create a Date object from the timestamp
      const date = new Date(parseInt(timestamp));

      // Extract day, month, year, hour, and minute components
      const day = date.getDate();
      const month = date.getMonth() + 1; // Months are zero-based, so add 1
      const year = date.getFullYear();
      const hour = date.getHours();
      const minute = date.getMinutes();
      const second = date.getSeconds();
      // Format the date as "dd/mm/yyyy hh:mm:ss"
      const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
      return formattedDate;
    },
    getIconFromType(key) {
      // check if key exists
      if (!this.enriched_values[key]) {
        return "mdi-text-box";
      }
      // check it key type exists
      if (!this.enriched_values[key]['type']) {
        return "mdi-text-box";
      }
      let type = this.enriched_values[key]['type'];
      if (type == "geo") {
        return "mdi-map-marker-outline";
      } else if (type == "wifi") {
        return "mdi-wifi";
      } else if (type == "vcard") {
        return "mdi-account";
      } else if (type == "url") {
        return "mdi-link";
      } else {
        return "mdi-text-box";
      }
    },
    limitLength(value, max_length) {
      if (value.length <= max_length) {
        return value;
      }
      return value.substring(0, max_length) + "...";
    }
  }
}
</script>

<style scoped>
#main {
  background-color: var(--tg-theme-bg-color, white);
  color: var(--tg-theme-text-color, black);
  /*https://stackoverflow.com/questions/1165497/how-to-prevent-text-from-overflowing-in-css*/
  word-wrap: break-word;
}
</style>
