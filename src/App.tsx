import React, { useState, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import './App.css'

function App() {
  const [qrData, setQrData] = useState<string | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    // Получаем доступ к камере
    const videoElement = document.createElement('video');
    document.body.appendChild(videoElement);

    codeReader.decodeFromVideoDevice(null, videoElement, (result, error) => {
      if (result) {
        setQrData(result.getText());
      }
      if (error) {
        console.error(error);
      }
    });

    return () => {
      codeReader.reset();
      videoElement.remove();
    };
  }, []);

  return (
    <div>
      <h1>Сканер QR-кода</h1>
      {qrData && <p>QR Code Data: {qrData}</p>}
    </div>
  );
}

export default App
