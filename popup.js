let mediaRecorder;
let audioChunks = [];
let audioContext;
let audioSource;
let audioDestination;
let mediaStreamDestination;

// Función para iniciar la captura de audio de la pestaña
function startCapture() {
  chrome.tabCapture.capture({audio: true}, (stream) => {
    if (!stream) {
      console.error('Error al capturar el audio');
      return;
    }

    // Crear el contexto de audio
    audioContext = new AudioContext();
    audioSource = audioContext.createMediaStreamSource(stream);

    // Crear un destino que permita reproducir el audio en los altavoces
    audioDestination = audioContext.destination;

    // Conectar el flujo capturado al destino para que se reproduzca
    audioSource.connect(audioDestination);

    // Crear un destino separado para la grabación
    mediaStreamDestination = audioContext.createMediaStreamDestination();
    audioSource.connect(mediaStreamDestination);

    // Usar el destino para capturar el audio y grabarlo
    mediaRecorder = new MediaRecorder(mediaStreamDestination.stream, { mimeType: 'audio/webm' });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioChunks = [];

      convertToWav(audioBlob);
    };

    mediaRecorder.start();
  });
}

// Función para detener la captura
function stopCapture() {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
}

// Convertir el blob a archivo .wav
function convertToWav(blob) {
  const reader = new FileReader();
  reader.readAsArrayBuffer(blob);
  reader.onloadend = () => {
    const audioBuffer = reader.result;
    
    const url = URL.createObjectURL(new Blob([audioBuffer], { type: 'audio/wav' }));
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audio.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
}

// Añadir event listeners a los botones
document.querySelector('.start-btn').addEventListener('click', startCapture);
document.querySelector('.stop-btn').addEventListener('click', stopCapture);
