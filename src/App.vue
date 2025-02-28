<template>
  <div id="main">
    <v-card v-if="is_telegram_client && is_telegram_api_updated" class="mx-auto" max-width="600">
    </v-card>
    <RequirementsMessage :is-telegram-client="is_telegram_client" :is-telegram-api-updated="is_telegram_api_updated" />
  </div>
</template>

<script>
import RequirementsMessage from './components/RequirementsMessage.vue';

export default {
  components: {
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
    mainButtonClicked() {
      this.showQRScanner();
    },
    showQRScanner() {
      this.TMA.showScanQrPopup({text: ""});
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
