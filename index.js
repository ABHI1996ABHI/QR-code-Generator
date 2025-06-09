  function generateQR() {
        const url = document.getElementById('urlInput').value;
        const qrCodeContainer = document.getElementById('qrcode');

        if (!url) {
            alert("Please enter a valid URL.");
            return;
        }

        qrCodeContainer.innerHTML = "";
        const loaderModal = new bootstrap.Modal(document.getElementById('loaderModal'));
        loaderModal.show();

        setTimeout(() => {
            new QRCode(qrCodeContainer, {
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
    const qrCodeImage = document.querySelector('#qrcode img');
    const format = document.getElementById('formatSelect').value;

    if (!qrCodeImage) {
        alert("Please generate a QR code first.");
        return;
    }

    const padding = 20; // Padding in pixels

    const canvas = document.createElement('canvas');
    canvas.width = qrCodeImage.width + padding * 2;
    canvas.height = qrCodeImage.height + padding * 2;

    const ctx = canvas.getContext('2d');

    // Fill background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw QR code image with padding
    ctx.drawImage(qrCodeImage, padding, padding);

    const link = document.createElement('a');
    link.href = canvas.toDataURL(`image/${format}`);
    link.download = `qrcode.${format}`;
    link.click();
}
