<template>
  <div id="main">
  </div>
</template>

<script>
export default {
  created() {
    this.TMA.MainButton.setText("Сканировать QR");
    this.TMA.onEvent('qrTextReceived', this.processQRCode);
    this.TMA.onEvent('mainButtonClicked', this.mainButtonClicked);
  },
  mounted() {
    this.TMA.ready();
    this.showQRScanner();
    this.TMA.MainButton.show();
  },
  methods: {
    mainButtonClicked() {
      this.showQRScanner();
    },
    showQRScanner() {
      this.TMA.showScanQrPopup({text: ""});
    },
    processQRCode(data) {
      // vibrate
      this.TMA.HapticFeedback.impactOccurred("rigid");
      this.TMA.HapticFeedback.impactOccurred("heavy");

      // send data and close
      this.TMA.sendData(data.data);
      this.TMA.closeScanQrPopup();
      this.TMA.close();
    },
  }
}
</script>
