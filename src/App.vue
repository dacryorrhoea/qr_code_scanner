<template>
  <div id="main">
    <!-- Отображение карточки, если клиент Telegram и API обновлены -->
    <v-card v-if="is_telegram_client && is_telegram_api_updated" class="mx-auto" max-width="600">
    </v-card>
    <!-- Компонент с сообщением о требованиях -->
    <RequirementsMessage :is-telegram-client="is_telegram_client" :is-telegram-api-updated="is_telegram_api_updated" />
  </div>
</template>

<script>
// Импорт вспомогательных функций и компонентов
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
      is_telegram_client: false, // Флаг наличия клиента Telegram
      is_telegram_api_updated: false, // Флаг обновлённого API Telegram
      last_code: null, // Последний отсканированный QR-код
      show_history: false, // Отображение истории
      cloud_storage_keys: [], // Ключи облачного хранилища
      cloud_storage_values: {}, // Значения облачного хранилища
      enriched_values: {}, // Обогащённые значения QR-кодов
      is_continuous_scan: false, // Флаг непрерывного сканирования
      expanded_panels: [0], // Развернутые панели (по умолчанию первая)
    };
  },
  created() {
    // Настройка кнопки главного экрана
    this.TMA.MainButton.setText("Сканировать QR-код");
    this.TMA.onEvent('qrTextReceived', this.processQRCode);
    this.TMA.onEvent('mainButtonClicked', this.mainButtonClicked);
    
    // Проверка версии API Telegram
    this.is_telegram_api_updated = this.TMA.isVersionAtLeast('6.9');
    if (this.TMA.platform != "unknown") {
      this.is_telegram_client = true;
    }
    if (this.is_telegram_client && this.is_telegram_api_updated) {
      this.TMA.MainButton.show(); // Показываем кнопку
      // this.loadStorage(); // Загружаем данные из облачного хранилища
    }
  },
  mounted() {
    // Уведомляем Telegram Mini App о готовности
    this.TMA.ready();
  },
  methods: {
    // Загрузка данных из облачного хранилища
    loadStorage() {
      this.TMA.CloudStorage.getKeys(this.processKeys);
    },
    
    // Обработка полученных ключей из облачного хранилища
    processKeys(error, data) {
      if (error) {
        this.TMA.showAlert(error);
        return;
      }
      data.sort((a, b) => b - a); // Сортировка по убыванию времени
      this.cloud_storage_keys = data;
      this.TMA.CloudStorage.getItems(data, this.processItems);
    },
    
    // Обработка полученных значений из облачного хранилища
    processItems(error, data) {
      if (error) {
        this.TMA.showAlert(error);
        return;
      }
      this.cloud_storage_values = data;
      this.enrichValues(data);
    },
    
    // Удаление ключа из облачного хранилища
    removeKey(key) {
      for (let index = 0; index < this.cloud_storage_keys.length; index++) {
        if (this.cloud_storage_keys[index] === key) {
          this.cloud_storage_keys.splice(index, 1);
          delete this.cloud_storage_values[key];
          break;
        }
      }
      this.TMA.CloudStorage.removeItem(key);
    },
    
    // Обогащение значения QR-кода доп. информацией
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
      for (let key in data) {
        this.enrichValue(key);
      }
    },
    
    // Добавление QR-кода в облачное хранилище
    addToStorage(value) {
      const timestamp = new Date().getTime();
      this.TMA.CloudStorage.setItem(timestamp, value);
      this.cloud_storage_keys.unshift(timestamp.toString());
      this.cloud_storage_values[timestamp] = value;
      return timestamp;
    },
    
    // Обработка полученного QR-кода
    processQRCode(data) {
      if (data.data.length > 4096) {
        this.TMA.showAlert('Ошибка: QR-код слишком длинный');
        return;
      }
      if (data.data == this.last_code) {
        return;
      }
      
      this.hapticImpact();

      this.TMA.sendData(data.data); // Отправка данных в Telegram-бот

      this.TMA.closeScanQrPopup();
      this.TMA.close(); // Закрытие мини-приложения
    },
    
    // Вибрация при обнаружении QR-кода
    hapticImpact() {
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
  word-wrap: break-word;
}
</style>
