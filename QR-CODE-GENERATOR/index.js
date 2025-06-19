
// ============================
// QR Code Generator Module
// ============================
(function () {
  const qrInputs = document.getElementById('qrInputs');
  let currentType = 'url';

  function renderInputs(type) {
    let html = '';
    switch (type) {
      case 'url':
        html = `<input type="text" id="urlInput" class="form-control mb-3" placeholder="Enter URL here">`; break;
      case 'email':
        html = `
          <input type="email" id="emailInput" class="form-control mb-2" placeholder="Enter email">
          <input type="text" id="subjectInput" class="form-control mb-2" placeholder="Subject">
          <textarea id="bodyInput" class="form-control mb-2" placeholder="Message"></textarea>`; break;
      case 'phone':
        html = `<input type="tel" id="phoneInput" class="form-control mb-3" placeholder="Enter phone number">`; break;
      case 'sms':
        html = `
          <input type="tel" id="smsPhoneInput" class="form-control mb-2" placeholder="Enter phone number">
          <textarea id="smsBodyInput" class="form-control mb-2" placeholder="Message"></textarea>`; break;
      case 'wifi':
        html = `
          <input type="text" id="ssidInput" class="form-control mb-2" placeholder="SSID">
          <input type="password" id="passwordInput" class="form-control mb-2" placeholder="Password">
          <select id="encryptionInput" class="form-select mb-2">
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">No Password</option>
          </select>`; break;
      case 'pdf':
        html = `
          <input type="file" id="pdfInput" class="form-control mb-3" accept="application/pdf">
          <small class="text-muted">Select a PDF file to generate QR Code.</small>`; break;
    }
    qrInputs.innerHTML = html;
  }

  window.generateQR = function () {
    let qrText = '';
    switch (currentType) {
      case 'url':
        qrText = document.getElementById('urlInput').value.trim(); break;
      case 'email':
        const email = document.getElementById('emailInput').value.trim();
        const subject = encodeURIComponent(document.getElementById('subjectInput').value.trim());
        const body = encodeURIComponent(document.getElementById('bodyInput').value.trim());
        qrText = `mailto:${email}?subject=${subject}&body=${body}`; break;
      case 'phone':
        qrText = `tel:${document.getElementById('phoneInput').value.trim()}`; break;
      case 'sms':
        const phone = document.getElementById('smsPhoneInput').value.trim();
        const message = encodeURIComponent(document.getElementById('smsBodyInput').value.trim());
        qrText = `SMSTO:${phone}:${message}`; break;
      case 'wifi':
        const ssid = document.getElementById('ssidInput').value.trim();
        const password = document.getElementById('passwordInput').value.trim();
        const enc = document.getElementById('encryptionInput').value;
        qrText = `WIFI:T:${enc};S:${ssid};P:${password};;`; break;
      case 'pdf':
        const pdfFile = document.getElementById('pdfInput').files[0];
        if (!pdfFile) return alert("Please upload a PDF file.");
        qrText = URL.createObjectURL(pdfFile); break;
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
  };

  document.querySelectorAll('#qrTypeTabs .nav-link').forEach(tab => {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelectorAll('#qrTypeTabs .nav-link').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      currentType = this.dataset.type;
      renderInputs(currentType);
    });
  });

  renderInputs(currentType);
})();

// ============================
// QR Download Utility Module
// ============================
(function () {
  window.downloadQR = function () {
    const format = document.getElementById('formatSelect').value;
    const qrContainer = document.getElementById('qrcode');
    const canvas = qrContainer.querySelector('canvas');

    if (!canvas) return alert("Please generate a QR code first!");

    const originalSize = canvas.width;
    const padding = 20;
    const scale = 4;
    const finalSize = (originalSize + 2 * padding) * scale;

    const paddedCanvas = document.createElement('canvas');
    paddedCanvas.width = finalSize;
    paddedCanvas.height = finalSize;

    const ctx = paddedCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, finalSize, finalSize);

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
  };
})();

// ============================
// Mobile Navigation & Overlay Module
// ============================
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu li a');
    const overlay = document.querySelector('.nav-overlay');

    function toggleMenu() {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.classList.toggle('no-scroll');
      if (overlay) overlay.classList.toggle('active');
    }

    if (hamburger && navMenu) {
      hamburger.addEventListener('click', toggleMenu);
    }

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navMenu.classList.contains('active')) {
          toggleMenu();
        }
      });
    });

    if (overlay) {
      overlay.addEventListener('click', toggleMenu);
    }
  });
})();
