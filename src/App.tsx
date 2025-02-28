import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import './App.css';

function App() {
  const [qrData, setQrData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    const startScanning = async () => {
      try {
        // Проверяем доступность устройств камеры
        const devices = await codeReader.listVideoDevices();
        if (devices.length === 0) {
          throw new Error('No video devices found');
        }

        // Получаем первое доступное устройство камеры
        const videoDeviceId = devices[0].deviceId;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: videoDeviceId },
        });

        // Устанавливаем видео источник
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Сканирование QR-кода
        codeReader.decodeFromVideoDevice(videoDeviceId, videoRef.current, (result, err) => {
          if (result) {
            setQrData(result.getText());
          }
          if (err) {
            setError(`Error scanning: ${err}`);
            console.error(err);
          }
        });
      } catch (err) {
        setError(`Error accessing camera: ${err instanceof Error ? err.message : err}`);
        console.error(err);
      }
    };

    startScanning();

    return () => {
      codeReader.reset();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop()); // Останавливаем все потоки при размонтировании
      }
    };
  }, []);

  return (
    <div>
      <h1>Сканер QR-кода</h1>
      <div>
        <video ref={videoRef} width="100%" height="auto" autoPlay muted></video>
      </div>
      {error && <p>Error: {error}</p>}
      {qrData && <p>QR Code Data: {qrData}</p>}
    </div>
  );
}

export default App;
