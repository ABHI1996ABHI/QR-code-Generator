const qrInputs = document.getElementById('qrInputs');
let currentType = 'url'; // default
let uploadTask = null; // for cancel upload
let progressBar = null;
let cancelBtn = null;

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
        <input type="file" id="pdfInput" class="form-control mb-2" accept="application/pdf">
        <div class="progress my-2" style="height: 20px;">
          <div id="uploadProgress" class="progress-bar progress-bar-striped bg-info" role="progressbar" style="width: 0%">0%</div>
        </div>
        <button id="cancelUploadBtn" class="btn btn-sm btn-danger mb-2 d-none">Cancel Upload</button>
        <small class="text-muted">Only PDF allowed. Max 10MB.</small>
      `;
      break;
  }
  qrInputs.innerHTML = html;
}

// Extend QR logic
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
      progressBar = document.getElementById('uploadProgress');
      cancelBtn = document.getElementById('cancelUploadBtn');

      if (!pdfFile) {
        loaderModal.hide();
        return alert("Please upload a PDF file.");
      }

      if (pdfFile.type !== 'application/pdf') {
        loaderModal.hide();
        return alert("Only PDF files are allowed.");
      }

      if (pdfFile.size > 10 * 1024 * 1024) {
        loaderModal.hide();
        return alert("File size exceeds 10MB.");
      }

      try {
        const storageRef = firebase.storage().ref(`pdfs/${Date.now()}_${pdfFile.name}`);
        uploadTask = storageRef.put(pdfFile);

        cancelBtn.classList.remove('d-none');
        cancelBtn.addEventListener('click', () => {
          if (uploadTask) uploadTask.cancel();
          cancelBtn.classList.add('d-none');
          loaderModal.hide();
          alert("Upload cancelled.");
        });

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            snapshot => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              progressBar.style.width = `${progress.toFixed(0)}%`;
              progressBar.textContent = `${progress.toFixed(0)}%`;
            },
            error => reject(error),
            async () => {
              const fileURL = await uploadTask.snapshot.ref.getDownloadURL();
              qrText = fileURL;
              resolve();
            }
          );
        });

      } catch (err) {
        loaderModal.hide();
        return alert("PDF upload failed. Please try again.");
      }

      break;
  }

  if (!qrText) {
    loaderModal.hide();
    return alert("Please fill in the required fields!");
  }

  currentURL = qrText;

  setTimeout(() => {
    new QRCode(qrCodeContainer, {
      text: qrText,
      width: 250,
      height: 250,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    if (progressBar) progressBar.style.width = "0%";
    if (cancelBtn) cancelBtn.classList.add('d-none');
    loaderModal.hide();
  }, 500);
}

// Initial render
renderInputs(currentType);

function downloadQR() {
  const format = document.getElementById('formatSelect').value;
  const qrContainer = document.getElementById('qrcode');
  const img = qrContainer.querySelector('img');
  const canvas = qrContainer.querySelector('canvas');

  if (!img && !canvas) return alert("Please generate a QR code first!");

  let dataUrl = img ? img.src : canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `qr-code.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
