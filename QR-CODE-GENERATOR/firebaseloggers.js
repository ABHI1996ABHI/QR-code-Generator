// Firebase Configuration
// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCROqgHyph59dt7iHdzbrThvNZzzKF8yA8",
  authDomain: "qrcode-generator-693bb.firebaseapp.com",
  projectId: "qrcode-generator-693bb",
  storageBucket: "qrcode-generator-693bb.firebasestorage.app",
  messagingSenderId: "672007661643",
  appId: "1:672007661643:web:dcb6304afcdaa1466185ce",
  measurementId: "G-K4JE3CQGCZ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Generate unique session ID for tracking user sessions
const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

// Utility function to get user info
function getUserInfo() {
  return {
    sessionId: sessionId,
    userAgent: navigator.userAgent,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    url: window.location.href,
    referrer: document.referrer || 'direct'
  };
}

// Log QR Code Generation
function logQRGeneration(qrType, content) {
  const logData = {
    ...getUserInfo(),
    action: 'qr_generated',
    qrType: qrType,
    content: content,
    contentLength: content ? content.length : 0
  };

  db.collection('qr_logs').add(logData)
    .then((docRef) => {
      console.log('QR Generation logged with ID: ', docRef.id);
    })
    .catch((error) => {
      console.error('Error logging QR generation: ', error);
    });
}

// new logs function 
function updateCurrentQRDataFromTab(tabElement) {
  // Remove active class from all tabs
  document.querySelectorAll('.nav-link').forEach(tab => tab.classList.remove('active'));

  // Add active to the clicked tab
  tabElement.classList.add('active');

  // Get QR type from data attribute
  const qrType = tabElement.getAttribute('data-type') || 'url';

  // Get content from relevant input (for now, assuming URL input)
  const content = document.getElementById('urlInput')?.value || '';

  // Update current QR data
  updateCurrentQRData(qrType, content);
}



// Log QR Code Download
function logQRDownload(format, qrType, content) {
  const logData = {
    ...getUserInfo(),
    action: 'qr_downloaded',
    format: format,
    qrType: qrType,
    content: content,
    contentLength: content ? content.length : 0
  };

  db.collection('qr_logs').add(logData)
    .then((docRef) => {
      console.log('QR Download logged with ID: ', docRef.id);
    })
    .catch((error) => {
      console.error('Error logging QR download: ', error);
    });
}

// Log page visit
function logPageVisit() {
  const logData = {
    ...getUserInfo(),
    action: 'page_visit'
  };

  db.collection('qr_logs').add(logData)
    .then((docRef) => {
      console.log('Page visit logged with ID: ', docRef.id);
    })
    .catch((error) => {
      console.error('Error logging page visit: ', error);
    });
}

// Enhanced logging functions that track current QR state
let currentQRData = {
  type: null,
  content: null
};

// Function to update current QR data (call this when QR type changes)
function updateCurrentQRData(type, content) {
  currentQRData.type = type;
  currentQRData.content = content;
}

// Wrapper function for QR generation logging
function logGeneration() {
  // Determine QR type based on active tab
  const activeTab = document.querySelector('.qr-option.active');
  let qrType = 'url'; // default
  let content = '';

  if (activeTab) {
    const tabText = activeTab.textContent.toLowerCase();
    if (tabText.includes('email')) qrType = 'email';
    else if (tabText.includes('phone')) qrType = 'phone';
    else if (tabText.includes('sms')) qrType = 'sms';
    else if (tabText.includes('wi-fi')) qrType = 'wifi';
    else if (tabText.includes('pdf')) qrType = 'pdf';
  }

  // Get content based on QR type
  const urlInput = document.getElementById('url');
  if (urlInput && urlInput.value) {
    content = urlInput.value;
  }

  logQRGeneration(qrType, content);
  updateCurrentQRData(qrType, content);
}

// Wrapper function for QR download logging
function logDownload() {
  const formatSelect = document.getElementById('formatSelect');
  const format = formatSelect ? formatSelect.value : 'png';
  
  logQRDownload(format, currentQRData.type, currentQRData.content);
}

// Initialize logging when page loads
document.addEventListener('DOMContentLoaded', function() {
  logPageVisit();
});

// Daily stats function (optional - for dashboard)
function getDailyStats(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return db.collection('qr_logs')
    .where('timestamp', '>=', startOfDay)
    .where('timestamp', '<=', endOfDay)
    .get()
    .then((querySnapshot) => {
      const stats = {
        totalVisits: 0,
        totalGenerations: 0,
        totalDownloads: 0,
        qrTypes: {},
        formats: {}
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data.action === 'page_visit') stats.totalVisits++;
        if (data.action === 'qr_generated') {
          stats.totalGenerations++;
          stats.qrTypes[data.qrType] = (stats.qrTypes[data.qrType] || 0) + 1;
        }
        if (data.action === 'qr_downloaded') {
          stats.totalDownloads++;
          stats.formats[data.format] = (stats.formats[data.format] || 0) + 1;
        }
      });

      return stats;
    });
}