let currentQR; // Global reference to the QRCode instance
let currentURL = ''; // Store URL for SVG rendering

function generateQR() {
  const url = document.getElementById('urlInput').value.trim();
  const qrCodeContainer = document.getElementById('qrcode');

  if (!url) {
    alert("Please enter a valid URL.");
    return;
  }

  qrCodeContainer.innerHTML = "";
  currentURL = url; // Store current URL for SVG

  const loaderModal = new bootstrap.Modal(document.getElementById('loaderModal'));
  loaderModal.show();

  setTimeout(() => {
    currentQR = new QRCode(qrCodeContainer, {
      text: url,
      width: 250,
      height: 250,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    loaderModal.hide();
  }, 1000);
}

function downloadQR() {
  const format = document.getElementById('formatSelect').value;
  const qrCodeImage = document.querySelector('#qrcode img') || document.querySelector('#qrcode canvas');

  if (!qrCodeImage) {
    alert("Please generate a QR code first.");
    return;
  }

  if (format === 'svg') {
    // Use third-party lib for SVG if using qrcodejs (doesn’t support SVG natively)
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "250");
    svg.setAttribute("height", "250");
    svg.setAttribute("viewBox", "0 0 250 250");

    const qrCanvas = document.querySelector('#qrcode canvas');
    const ctx = qrCanvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, qrCanvas.width, qrCanvas.height).data;

    for (let y = 0; y < qrCanvas.height; y++) {
      for (let x = 0; x < qrCanvas.width; x++) {
        const i = (y * qrCanvas.width + x) * 4;
        const isBlack = imageData[i] === 0;

        if (isBlack) {
          const rect = document.createElementNS(svgNS, 'rect');
          rect.setAttribute('x', x);
          rect.setAttribute('y', y);
          rect.setAttribute('width', 1);
          rect.setAttribute('height', 1);
          rect.setAttribute('fill', '#000');
          svg.appendChild(rect);
        }
      }
    }

    const svgBlob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'qrcode.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } else {
    // For PNG and JPG
    const padding = 20;
    const canvas = document.createElement('canvas');
    canvas.width = qrCodeImage.width + padding * 2;
    canvas.height = qrCodeImage.height + padding * 2;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(qrCodeImage, padding, padding);

    const link = document.createElement('a');
    link.href = canvas.toDataURL(`image/${format}`);
    link.download = `qrcode.${format}`;
    link.click();
  }
}
