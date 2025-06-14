const qrInputs = document.getElementById('qrInputs');
let currentType = 'url'; // default
let uploadTask = null;   // for canceling PDF upload

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
        <small class="text-muted">Select a PDF file (max 10MB) to upload and generate QR Code.</small>
      `;
      break;
  }
  qrInputs.innerHTML = html;
}

// Generate QR Code
async function generateQR() {
  let qrText = '';
  const qrCodeContainer = document.getElementById('qrcode');
  qrCodeContainer.innerHTML = '';

  const loaderModal = new bootstrap.Modal(document.getElementById('loaderModal'));
  loaderModal.show();

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
      if (!pdfFile) {
        loaderModal.hide();
        return alert("Please upload a PDF file.");
      }

      // Validate file type and size
      if (pdfFile.type !== "application/pdf") {
        loaderModal.hide();
        return alert("Invalid file type. Please upload a PDF.");
      }
      if (pdfFile.size > 10 * 1024 * 1024) {
        loaderModal.hide();
        return alert("File too large. Max size is 10MB.");
      }

      try {
        const progressContainer = document.getElementById('uploadProgressContainer');
        const progressBar = document.getElementById('uploadProgressBar');
        const cancelBtn = document.getElementById('cancelUploadBtn');

        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';

        const storageRef = firebase.storage().ref(`pdfs/${Date.now()}_${pdfFile.name}`);
        uploadTask = storageRef.put(pdfFile);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;
          },
          (error) => {
            progressContainer.style.display = 'none';
            loaderModal.hide();
            alert("Upload canceled or failed.");
          },
          async () => {
            const fileURL = await uploadTask.snapshot.ref.getDownloadURL();
            progressContainer.style.display = 'none';
            finalizeQR(fileURL);
          }
        );

        cancelBtn.onclick = () => {
          if (uploadTask) {
            uploadTask.cancel();
            uploadTask = null;
            progressContainer.style.display = 'none';
            loaderModal.hide();
            alert("Upload canceled.");
          }
        };

        return;
      } catch (err) {
        loaderModal.hide();
        return alert("Upload failed. Try again.");
      }
  }

  if (!qrText) {
    loaderModal.hide();
    return alert("Please fill in the required fields!");
  }

  finalizeQR(qrText);
}

// Final QR rendering helper
function finalizeQR(qrText) {
  const qrCodeContainer = document.getElementById('qrcode');
  qrCodeContainer.innerHTML = '';
  currentURL = qrText;

  setTimeout(() => {
    currentQR = new QRCode(qrCodeContainer, {
      text: qrText,
      width: 250,
      height: 250,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    const loaderModal = bootstrap.Modal.getInstance(document.getElementById('loaderModal'));
    loaderModal.hide();
  }, 1000);
}

// Initial call
renderInputs(currentType);

// Download QR logic
function downloadQR() {
  const format = document.getElementById('formatSelect').value;
  const qrContainer = document.getElementById('qrcode');
  const img = qrContainer.querySelector('img');
  const canvas = qrContainer.querySelector('canvas');

  if (!img && !canvas) {
    return alert("Please generate a QR code first!");
  }

  let dataUrl;
  if (img) {
    dataUrl = img.src;
  } else {
    dataUrl = canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png');
  }

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `qr-code.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function showToast(message, type = 'success') {
  const toastEl = document.getElementById('toastMessage');
  const toastBody = document.getElementById('toastBody');

  // Set message
  toastBody.textContent = message;

  // Set color type
  toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning');
  if (type === 'error') {
    toastEl.classList.add('bg-danger');
  } else if (type === 'warning') {
    toastEl.classList.add('bg-warning');
  } else {
    toastEl.classList.add('bg-success');
  }

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
