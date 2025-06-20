// Firebase configuration - replace with your actual config
const firebaseConfig = {
  // Add your Firebase configuration here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase (make sure you have Firebase SDK loaded via CDN)
let app, storage;
if (typeof firebase !== 'undefined') {
  app = firebase.initializeApp(firebaseConfig);
  storage = firebase.storage();
} else {
  console.error('Firebase SDK not loaded. Please include Firebase CDN scripts.');
}

const qrInputs = document.getElementById('qrInputs');
let currentType = 'url'; // default

// Tab click handling
document.querySelectorAll('#qrTypeTabs .nav-link').forEach(tab => {
  tab.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelectorAll('#qrTypeTabs .nav-link').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    currentType = this.dataset.type;
    renderInputs(currentType);
  });
});

// Input renderer
function renderInputs(type) {
  let html = '';
  switch (type) {
    case 'url':
      html = `<input type="text" id="urlInput" class="form-control mb-3" placeholder="Enter URL here">`;
      break;
    case 'email':
      html = `
        <input type="email" id="emailInput" class="form-control mb-2" placeholder="Enter email">
        <input type="text" id="subjectInput" class="form-control mb-2" placeholder="Subject">
        <textarea id="bodyInput" class="form-control mb-2" placeholder="Message"></textarea>`;
      break;
    case 'phone':
      html = `<input type="tel" id="phoneInput" class="form-control mb-3" placeholder="Enter phone number">`;
      break;
    case 'sms':
      html = `
        <input type="tel" id="smsPhoneInput" class="form-control mb-2" placeholder="Enter phone number">
        <textarea id="smsBodyInput" class="form-control mb-2" placeholder="Message"></textarea>`;
      break;
    case 'wifi':
      html = `
        <input type="text" id="ssidInput" class="form-control mb-2" placeholder="SSID">
        <input type="password" id="passwordInput" class="form-control mb-2" placeholder="Password">
        <select id="encryptionInput" class="form-select mb-2">
          <option value="WPA">WPA/WPA2</option>
          <option value="WEP">WEP</option>
          <option value="nopass">No Password</option>
        </select>`;
      break;
    case 'pdf':
      html = `
        <input type="file" id="pdfInput" class="form-control mb-3" accept="application/pdf">
        <small class="text-muted">Select a PDF file to generate QR Code. File will be uploaded to Firebase Storage.</small>`;
      break;
  }
  qrInputs.innerHTML = html;
}

// Upload PDF to Firebase Storage
async function uploadPDFToFirebase(file) {
  try {
    if (!storage) {
      throw new Error('Firebase not initialized');
    }
    
    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `pdfs/${timestamp}_${file.name}`;
    
    // Create a reference to Firebase Storage
    const storageRef = storage.ref(fileName);
    
    // Upload the file
    const snapshot = await storageRef.put(file);
    
    // Get the download URL
    const downloadURL = await snapshot.ref.getDownloadURL();
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Generate QR code (Modified to handle PDF upload)
function generateQR() {
  // Handle PDF uploads asynchronously
  if (currentType === 'pdf') {
    generateQRForPDF();
    return;
  }
  
  // Handle other types synchronously
  let qrText = '';
  switch (currentType) {
    case 'url':
      qrText = document.getElementById('urlInput').value.trim();
      break;
    case 'email':
      const email = document.getElementById('emailInput').value.trim();
      const subject = encodeURIComponent(document.getElementById('subjectInput').value.trim());
      const body = encodeURIComponent(document.getElementById('bodyInput').value.trim());
      qrText = `mailto:${email}?subject=${subject}&body=${body}`;
      break;
    case 'phone':
      qrText = `tel:${document.getElementById('phoneInput').value.trim()}`;
      break;
    case 'sms':
      const phone = document.getElementById('smsPhoneInput').value.trim();
      const message = encodeURIComponent(document.getElementById('smsBodyInput').value.trim());
      qrText = `SMSTO:${phone}:${message}`;
      break;
    case 'wifi':
      const ssid = document.getElementById('ssidInput').value.trim();
      const password = document.getElementById('passwordInput').value.trim();
      const enc = document.getElementById('encryptionInput').value;
      qrText = `WIFI:T:${enc};S:${ssid};P:${password};;`;
      break;
  }

  if (!qrText) return alert("Please fill in the required fields!");

  const qrCodeContainer = document.getElementById('qrcode');
  qrCodeContainer.innerHTML = '';

  const loaderModal = new bootstrap.Modal(document.getElementById('loaderModal'));
  loaderModal.show();

  setTimeout(() => {
    new QRCode(qrCodeContainer, {
      text: qrText,
      width: 250,
      height: 250,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    loaderModal.hide();
  }, 1000);
}

// Separate async function for PDF handling
async function generateQRForPDF() {
  const pdfFile = document.getElementById('pdfInput').files[0];
  if (!pdfFile) return alert("Please upload a PDF file.");
  
  const loaderModal = new bootstrap.Modal(document.getElementById('loaderModal'));
  loaderModal.show();
  
  try {
    // Upload PDF to Firebase and get public URL
    const qrText = await uploadPDFToFirebase(pdfFile);
    
    const qrCodeContainer = document.getElementById('qrcode');
    qrCodeContainer.innerHTML = '';
    
    setTimeout(() => {
      new QRCode(qrCodeContainer, {
        text: qrText,
        width: 250,
        height: 250,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      loaderModal.hide();
    }, 500);
    
  } catch (error) {
    console.error('Error generating QR code:', error);
    alert('Error uploading PDF. Please try again.');
    loaderModal.hide();
  }
}

// Download with white margin, high resolution, and sharp quality
function downloadQR() {
  const format = document.getElementById('formatSelect').value;
  const qrContainer = document.getElementById('qrcode');
  const canvas = qrContainer.querySelector('canvas');

  if (!canvas) {
    return alert("Please generate a QR code first!");
  }

  const originalSize = canvas.width;
  const padding = 20;      // white space
  const scale = 4;         // upscale
  const finalSize = (originalSize + 2 * padding) * scale;

  const paddedCanvas = document.createElement('canvas');
  paddedCanvas.width = finalSize;
  paddedCanvas.height = finalSize;

  const ctx = paddedCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false; // keep QR crisp

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, finalSize, finalSize);

  // Draw QR code into padded canvas
  ctx.drawImage(
    canvas,
    0, 0, originalSize, originalSize,
    padding * scale, padding * scale,
    originalSize * scale, originalSize * scale
  );

  const dataUrl = paddedCanvas.toDataURL(
    format === 'jpeg' ? 'image/jpeg' : 'image/png'
  );

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `qr-code.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Initial render
renderInputs(currentType);

document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');

  hamburger.addEventListener('click', function () {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });
});