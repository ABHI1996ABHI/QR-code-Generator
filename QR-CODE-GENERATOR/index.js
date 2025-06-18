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
        <small class="text-muted">Select a PDF file to generate QR Code.</small>`;
      break;
  }
  qrInputs.innerHTML = html;
}

// Generate QR code
function generateQR() {
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
    case 'pdf':
      const pdfFile = document.getElementById('pdfInput').files[0];
      if (!pdfFile) return alert("Please upload a PDF file.");
      const pdfUrl = URL.createObjectURL(pdfFile);
      qrText = pdfUrl;
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

// Download QR with padding
function downloadQR() {
  const format = document.getElementById('formatSelect').value;
  const qrContainer = document.getElementById('qrcode');
  const canvas = qrContainer.querySelector('canvas');

  if (!canvas) {
    return alert("Please generate a QR code first!");
  }

  const originalCanvas = canvas;
  const originalSize = originalCanvas.width;
  const padding = 20; // adjust padding as needed

  const paddedCanvas = document.createElement('canvas');
  paddedCanvas.width = originalSize + 2 * padding;
  paddedCanvas.height = originalSize + 2 * padding;

  const ctx = paddedCanvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // white background
  ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);

  ctx.drawImage(originalCanvas, padding, padding);

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
