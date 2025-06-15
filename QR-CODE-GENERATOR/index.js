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

    case 'menu':
      html = `
        <label class="form-label">Choose one:</label>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="menuOption" id="menuUrlOption" checked>
          <label class="form-check-label" for="menuUrlOption">Enter Menu URL</label>
        </div>
        <input type="text" id="menuUrlInput" class="form-control mb-3" placeholder="https://your-restaurant.com/menu">

        <div class="form-check">
          <input class="form-check-input" type="radio" name="menuOption" id="menuPdfOption">
          <label class="form-check-label" for="menuPdfOption">Upload Menu File (PDF/Image)</label>
        </div>
        <input type="file" id="menuPdfInput" class="form-control mb-2" accept="application/pdf,image/*" disabled>

        <div class="progress my-2" style="height: 20px;">
          <div id="uploadProgress" class="progress-bar progress-bar-striped bg-info" role="progressbar" style="width: 0%">0%</div>
        </div>
        <button id="cancelUploadBtn" class="btn btn-sm btn-danger mb-2 d-none">Cancel Upload</button>
      `;
      break;
  }

  qrInputs.innerHTML = html;

  // Handle radio input toggle for menu
  if (type === 'menu') {
    document.getElementById('menuUrlOption').addEventListener('change', () => {
      document.getElementById('menuUrlInput').disabled = false;
      document.getElementById('menuPdfInput').disabled = true;
    });

    document.getElementById('menuPdfOption').addEventListener('change', () => {
      document.getElementById('menuUrlInput').disabled = true;
      document.getElementById('menuPdfInput').disabled = false;
    });
  }
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
    case 'menu':
      const isMenu = currentType === 'menu';
      const isPdf = isMenu ? document.getElementById('menuPdfOption').checked : true;
      const fileInput = isMenu ? document.getElementById('menuPdfInput') : document.getElementById('pdfInput');
      progressBar = document.getElementById('uploadProgress');
      cancelBtn = document.getElementById('cancelUploadBtn');

      if (isPdf) {
        const file = fileInput.files[0];
        if (!file) {
          loaderModal.hide();
          return alert("Please upload a file.");
        }
        const isPdfType = file.type === 'application/pdf';
        const isImageType = file.type.startsWith('image/');
        if (!isPdfType && !isImageType) {
          loaderModal.hide();
          return alert("Only PDF or image files are allowed.");
        }
        if (file.size > 10 * 1024 * 1024) {
          loaderModal.hide();
          return alert("File size exceeds 10MB.");
        }

        try {
          const folder = isMenu ? 'restaurant_menus' : 'pdfs';
          const storageRef = firebase.storage().ref(`${folder}/${Date.now()}_${file.name}`);
          uploadTask = storageRef.put(file);

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
          return alert("Upload failed. Please try again.");
        }

      } else {
        qrText = document.getElementById('menuUrlInput').value.trim();
        if (!qrText) {
          loaderModal.hide();
          return alert("Please enter the menu URL.");
        }
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

// Reset QR Code functionality
document.getElementById('resetBtn').addEventListener('click', () => {
  // Clear QR code preview
  const qrCodeContainer = document.getElementById('qrcode');
  qrCodeContainer.innerHTML = '';

  // Reset inputs to default tab
  document.querySelectorAll('#qrTypeTabs .nav-link').forEach(t => t.classList.remove('active'));
  const defaultTab = document.querySelector('#qrTypeTabs .nav-link[data-type="url"]');
  defaultTab.classList.add('active');
  currentType = 'url';
  renderInputs(currentType);

  // Reset progress bar and cancel upload
  if (progressBar) {
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
  }

  if (cancelBtn) {
    cancelBtn.classList.add('d-none');
  }

  // Reset any URL or input state
  currentURL = '';
});
