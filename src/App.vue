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
    // Проверяем, является ли клиент Telegram
    this.is_telegram_api_updated = this.TMA.isVersionAtLeast('6.9');
    if (this.TMA.platform !== "unknown") {
      this.is_telegram_client = true;
    }
  },
  mounted() {
    this.TMA.ready();

    // Если Telegram-клиент поддерживает API, сразу открываем сканнер
    if (this.is_telegram_client && this.is_telegram_api_updated) {
      this.showQRScanner();
    }
  },
  methods: {
    showQRScanner() {
      this.TMA.showScanQrPopup({ text: "" });
    },
    processQRCode(data) {
      if (data.data.length > 4096) {
        this.TMA.showAlert('Error: QR code too long (max 4096 characters)');
        return;
      }
      this.hapticImpact();
      this.TMA.sendData(data.data);
      this.TMA.closeScanQrPopup();
      this.TMA.close();
    },
    hapticImpact() {
      this.TMA.HapticFeedback.impactOccurred("rigid");
      this.TMA.HapticFeedback.impactOccurred("heavy");
    }
  }
}
</script>
