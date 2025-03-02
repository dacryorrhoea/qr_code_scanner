<template>
  <div id="main">
  </div>
</template>

<script>
export default {
  created() {
    this.TMA.onEvent('qrTextReceived', this.processQRCode);
  },
  mounted() {
    this.TMA.ready();
    this.TMA.showScanQrPopup({text: ""});
  },
  methods: {
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
