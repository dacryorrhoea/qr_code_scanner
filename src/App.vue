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
    }
  },
  mounted() {
    this.TMA.ready();
  },
  methods: {
    // Event Callback
    mainButtonClicked() {
      this.showQRScanner();
    },
    // QR scanner functions
    showQRScanner() {
      // Sets QR message
      let par = {
        text: ""
      };
      this.TMA.showScanQrPopup(par);
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
