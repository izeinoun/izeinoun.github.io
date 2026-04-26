// ============================================================
// SPECIALTY HOME PAINTING — CHAT AGENT
// chat.js — client side chat logic, action handler, PDF modal
// ============================================================

// ---- CONFIGURATION ----
const PROXY_URL = 'https://script.google.com/macros/s/AKfycbxGD22hnOKDN7b_2ey8ygp_Kh4ScTr4GicmeMWLVmK80pV-B_sGHnH0507oDcHWOrdU8g/exec';
const EMAILJS_SERVICE = 'service_s9zggu9';
const EMAILJS_TEMPLATE = 'template_yrs9zfk';
const EMAILJS_PUBLIC_KEY = 'Tejd3zM9f6BJ9FpcE';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// ---- STATE ----
let chatHistory = [];
let customerEmail = '';
let customerName = '';
let currentQuote = null;
let chatOpen = false;

// ============================================================
// CHAT OPEN / CLOSE
// ============================================================
function openChat() {
  document.getElementById('chatOverlay').classList.add('active');
  document.getElementById('chatPopup').classList.add('active');
  document.getElementById('chatFab').style.display = 'none';
  chatOpen = true;

  if (chatHistory.length === 0) {
    setTimeout(() => {
      showBotMessage("👋 Hi! Welcome to Specialty Home Painting. How can we help you today?");
      showQuickButtons(['🖌️ Our Services', '💰 Get an Estimate', '📧 Email Us', '📞 Call Us']);
    }, 400);
  }
}

function closeChat() {
  document.getElementById('chatOverlay').classList.remove('active');
  document.getElementById('chatPopup').classList.remove('active');
  document.getElementById('chatFab').style.display = 'flex';
  chatOpen = false;
}

// ============================================================
// MESSAGE DISPLAY
// ============================================================
function showBotMessage(text) {
  const msgs = document.getElementById('chatMessages');
  const msg = document.createElement('div');
  msg.className = 'msg bot';
  msg.innerHTML = `<div class="msg-bubble">${text}</div>`;
  msgs.appendChild(msg);
  msgs.scrollTop = msgs.scrollHeight;
}

function showUserMessage(text) {
  const msgs = document.getElementById('chatMessages');
  const msg = document.createElement('div');
  msg.className = 'msg user';
  msg.innerHTML = `<div class="msg-bubble">${text}</div>`;
  msgs.appendChild(msg);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('chatMessages');
  const existing = document.getElementById('typingIndicator');
  if (existing) existing.remove();
  const typing = document.createElement('div');
  typing.className = 'msg bot';
  typing.id = 'typingIndicator';
  typing.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typingIndicator');
  if (t) t.remove();
}

// ============================================================
// INPUT AREA
// ============================================================
function showQuickButtons(options) {
  const area = document.getElementById('chatInputArea');
  const allOptions = options.includes('📧 Email Us') ? options : [...options, '📧 Email Us'];
  const buttonsHtml = allOptions.map(o =>
    `<button class="chat-option${o === '📧 Email Us' ? ' chat-option-persistent' : ''}" 
     onclick="handleQuickButton('${o.replace(/'/g, "\\'")}')">${o}</button>`
  ).join('');
  area.innerHTML = `
    <div class="chat-options">${buttonsHtml}</div>
    <div class="chat-input-wrap" style="margin-top:8px;">
      <input class="chat-input" id="chatInput" type="text" 
             placeholder="Or type your message..." autocomplete="off" 
             onkeydown="if(event.key==='Enter') sendMessage()">
      <button class="chat-send" onclick="sendMessage()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>`;
  setTimeout(() => { const i = document.getElementById('chatInput'); if(i) i.focus(); }, 100);
}

function showTextInput() {
  const area = document.getElementById('chatInputArea');
  area.innerHTML = `
    <div class="chat-options">
      <button class="chat-option chat-option-persistent" 
              onclick="handleQuickButton('📧 Email Us')">📧 Email Us</button>
    </div>
    <div class="chat-input-wrap" style="margin-top:8px;">
      <input class="chat-input" id="chatInput" type="text" 
             placeholder="Type your message..." autocomplete="off"
             onkeydown="if(event.key==='Enter') sendMessage()">
      <button class="chat-send" onclick="sendMessage()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>`;
  setTimeout(() => { const i = document.getElementById('chatInput'); if(i) i.focus(); }, 100);
}

function showQuoteButtons() {
  const area = document.getElementById('chatInputArea');
  area.innerHTML = `
    <div class="chat-options">
      <button class="chat-option chat-option-quote" onclick="viewQuote()">📄 View Quote</button>
      <button class="chat-option" onclick="handleQuickButton('Email me the quote')">📧 Email Quote</button>
      <button class="chat-option chat-option-persistent" onclick="handleQuickButton('📧 Email Us')">📧 Email Us</button>
    </div>
    <div class="chat-input-wrap" style="margin-top:8px;">
      <input class="chat-input" id="chatInput" type="text" 
             placeholder="Type your message..." autocomplete="off"
             onkeydown="if(event.key==='Enter') sendMessage()">
      <button class="chat-send" onclick="sendMessage()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>`;
  setTimeout(() => { const i = document.getElementById('chatInput'); if(i) i.focus(); }, 100);
}

// ============================================================
// HANDLE USER INPUT
// ============================================================
function handleQuickButton(value) {
  const map = {
    '🖌️ Our Services': 'Tell me about your services',
    '💰 Get an Estimate': 'I would like to get an estimate',
    '📧 Email Us': 'I would like to send an email',
    '📞 Call Us': 'How can I call you?'
  };
  const text = map[value] || value;
  processUserMessage(text);
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  if (!input || !input.value.trim()) return;
  const text = input.value.trim();
  input.value = '';
  processUserMessage(text);
}

// ============================================================
// MAIN MESSAGE PROCESSOR
// ============================================================
async function processUserMessage(text) {
  showUserMessage(text);
  showTextInput();

  // Detect email address typed by user
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(text)) {
    customerEmail = text;
    showTyping();
    setTimeout(() => {
      removeTyping();
      sendChatSummary(text);
    }, 800);
    return;
  }

  // Check if user wants to view/download quote
  if (text.toLowerCase().includes('view quote') || text.toLowerCase().includes('download')) {
    if (currentQuote) {
      generateAndShowPDF();
    } else {
      showBotMessage("I don't have a quote ready yet. Let me gather a few more details first.");
    }
    return;
  }

  // Add to history
  chatHistory.push({ role: 'user', content: text });

  // Call proxy
  showTyping();
  try {
    const params = new URLSearchParams({
      message: text,
      history: encodeURIComponent(JSON.stringify(chatHistory.slice(-10)))
    });

    const response = await fetch(PROXY_URL + '?' + params.toString());
    const data = await response.json();
    removeTyping();

    if (data.success && data.reply) {
      await handleReply(data.reply);
    } else {
      showBotMessage("Sorry, I'm having trouble connecting. Please call or text Issam directly at (904) 514-7016.");
      showTextInput();
    }
  } catch (err) {
    removeTyping();
    console.error('Proxy error:', err);
    showBotMessage("Sorry, I'm having trouble connecting. Please call or text Issam directly at (904) 514-7016.");
    showTextInput();
  }
}

// ============================================================
// HANDLE CLAUDE REPLY — text or action JSON
// ============================================================
async function handleReply(reply) {
  // Try to parse as action JSON
  try {
    const trimmed = reply.trim();
    if (trimmed.startsWith('{')) {
      const action = JSON.parse(trimmed);
      if (action.action) {
        await handleAction(action);
        return;
      }
    }
  } catch(e) {
    // Not JSON — treat as regular chat reply
  }

  // Extract buttons if present
  const buttonMatch = reply.match(/\[BUTTONS:\s*([^\]]+)\]/);
  const cleanReply = reply.replace(/\[BUTTONS:[^\]]+\]/g, '').trim();

  // Check if reply contains an estimate — show quote buttons
  const hasEstimate = reply.includes('Total estimate') || 
                      reply.includes('total estimate') ||
                      reply.includes('Total:') ||
                      (reply.includes('$') && reply.includes('estimate')) ||
                      (reply.includes('$') && reply.includes('total'));

  chatHistory.push({ role: 'assistant', content: cleanReply });
  showBotMessage(cleanReply);

  // Build a quote from chat text if estimate detected but no action
  if (hasEstimate && !currentQuote) {
    // Try to extract dollar amounts from the reply
    const items = [];
    const lines = cleanReply.split('\n');
    let totalLow = 0;
    let totalHigh = 0;

    lines.forEach(line => {
      // Match lines with dollar amounts like "Bedroom (small, good) | $150–$180"
      const match = line.match(/([^|]+)\|\s*\$(\d+)[–-]\$?(\d+)/);
      if (match && !line.toLowerCase().includes('total')) {
        const desc = match[1].replace(/\*\*/g, '').trim();
        const low = parseInt(match[2]);
        const high = parseInt(match[3]);
        items.push({ description: desc, low, high });
        totalLow += low;
        totalHigh += high;
      }
      // Match total line
      const totalMatch = line.match(/total[^|]*\|\s*\*?\*?\$(\d+)[–-]\$?(\d+)/i);
      if (totalMatch) {
        totalLow = parseInt(totalMatch[1]);
        totalHigh = parseInt(totalMatch[2]);
      }
    });

    currentQuote = {
      items: items.length > 0 ? items : [{ description: 'See estimate above', low: totalLow, high: totalHigh }],
      total_low: totalLow,
      total_high: totalHigh,
      summary: cleanReply
    };
  }

  if (buttonMatch) {
    const buttons = buttonMatch[1].split('|').map(b => b.trim());
    if (hasEstimate) {
      showQuoteButtons();
    } else {
      showQuickButtons(buttons);
    }
  } else if (hasEstimate) {
    showQuoteButtons();
  } else {
    showTextInput();
  }
}

// ============================================================
// ACTION HANDLER — deterministic function dispatcher
// ============================================================
async function handleAction(action) {
  console.log('Action received:', action);

  switch(action.action) {

    case 'store_quote':
      currentQuote = action.data;
      if (action.data.name) customerName = action.data.name;
      if (action.data.email) customerEmail = action.data.email;
      // Show the estimate as a message
      showBotMessage(action.data.summary || 'Here is your estimate!');
      chatHistory.push({ role: 'assistant', content: action.data.summary || 'Here is your estimate!' });
      // Ask preference
      setTimeout(() => {
        showBotMessage("Would you like to download the quote as a PDF, or would you prefer I email it to you?");
        showQuoteButtons();
      }, 500);
      break;

    case 'generate_pdf':
      currentQuote = action.data || currentQuote;
      generateAndShowPDF();
      showBotMessage("Here's your quote! You can download it or I can email it to you. 📄");
      chatHistory.push({ role: 'assistant', content: "Here's your quote! You can download it or I can email it to you." });
      showQuoteButtons();
      break;

    case 'email_quote':
      const emailTarget = action.data?.email || customerEmail;
      if (!emailTarget) {
        showBotMessage("What's your email address? I'll send the quote right over.");
        showTextInput();
      } else {
        customerEmail = emailTarget;
        generateAndEmailPDF(emailTarget);
        showBotMessage(`📧 Quote sent to ${emailTarget}! Issam will follow up shortly.`);
        chatHistory.push({ role: 'assistant', content: `Quote sent to ${emailTarget}!` });
        showTextInput();
      }
      break;

    case 'send_email_customer':
      const custEmail = action.data?.email || customerEmail;
      if (custEmail) {
        sendEmailToCustomer(custEmail, action.data?.subject, action.data?.body);
        showBotMessage(`✅ Email sent to ${custEmail}! Issam will follow up within 15 minutes.`);
      } else {
        showBotMessage("What's your email address so I can send that over?");
      }
      showTextInput();
      break;

    case 'send_email_issam':
      sendEmailToIssam(action.data?.subject, action.data?.body);
      showBotMessage("✅ Message sent to Issam! He'll be in touch shortly.");
      chatHistory.push({ role: 'assistant', content: "Message sent to Issam!" });
      showTextInput();
      break;

    case 'collect_email':
      showBotMessage(action.data?.message || "What's your email address?");
      showTextInput();
      break;

    default:
      console.log('Unknown action:', action.action);
      showTextInput();
  }
}

// ============================================================
// PDF GENERATION — using jsPDF
// ============================================================
function generateAndShowPDF() {
  if (!currentQuote) return;
  const pdfDataUrl = buildPDF();
  showPDFModal(pdfDataUrl);
}

function viewQuote() {
  if (!currentQuote) {
    showBotMessage("Let me generate your quote first. One moment...");
    generateAndShowPDF();
    return;
  }
  generateAndShowPDF();
}

function buildPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const green = [42, 92, 63];
  const charcoal = [28, 28, 26];
  const lightGray = [245, 244, 239];

  // Header background
  doc.setFillColor(...green);
  doc.rect(0, 0, 210, 40, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Specialty Home Painting', 20, 18);

  // Tagline
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Door Restoration · Drywall Repair · Interior Painting · Orlando, FL', 20, 26);

  // Contact
  doc.text('(904) 514-7016  |  issam@specialtyhomepainting.com  |  specialtyhomepainting.com', 20, 33);

  // Quote title
  doc.setTextColor(...charcoal);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTIMATE', 20, 55);

  // Date and quote number
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Date: ${today}`, 20, 63);
  doc.text(`Quote #: SHP-${Date.now().toString().slice(-6)}`, 20, 69);

  // Customer info
  if (customerName || customerEmail) {
    doc.setTextColor(...charcoal);
    doc.setFont('helvetica', 'bold');
    doc.text('Prepared for:', 120, 55);
    doc.setFont('helvetica', 'normal');
    if (customerName) doc.text(customerName, 120, 63);
    if (customerEmail) doc.text(customerEmail, 120, 69);
  }

  // Divider
  doc.setDrawColor(...green);
  doc.setLineWidth(0.5);
  doc.line(20, 75, 190, 75);

  // Line items
  let y = 90;
  doc.setFillColor(...lightGray);
  doc.rect(20, 80, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...charcoal);
  doc.text('Service', 22, 86);
  doc.text('Est. Low', 130, 86);
  doc.text('Est. High', 160, 86);

  doc.setFont('helvetica', 'normal');
  const items = currentQuote.items || [];
  items.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 250);
      doc.rect(20, y - 5, 170, 8, 'F');
    }
    doc.setTextColor(...charcoal);
    doc.text(item.description || '', 22, y);
    doc.text(`$${item.low || 0}`, 130, y);
    doc.text(`$${item.high || 0}`, 160, y);
    y += 10;
  });

  // Total
  y += 5;
  doc.setFillColor(...green);
  doc.rect(20, y - 5, 170, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL ESTIMATE', 22, y + 3);
  doc.text(`$${currentQuote.total_low || 0} — $${currentQuote.total_high || 0}`, 130, y + 3);

  // Notes
  y += 25;
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('* This is a ballpark estimate. Final price confirmed after free in-person visit.', 20, y);
  doc.text('* Prices include standard prep work and cleanup.', 20, y + 6);
  doc.text('* Drywall damage larger than 1 inch priced separately after photo review.', 20, y + 12);

  // Footer
  doc.setFillColor(...green);
  doc.rect(0, 275, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Thank you for considering Specialty Home Painting!', 105, 283, { align: 'center' });
  doc.text('We repair first, then refinish — no shortcuts, no painted-over problems.', 105, 289, { align: 'center' });

  return doc.output('datauristring');
}

// ============================================================
// PDF MODAL
// ============================================================
function showPDFModal(pdfDataUrl) {
  // Remove existing modal
  const existing = document.getElementById('pdfModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'pdfModal';
  modal.innerHTML = `
    <div class="pdf-modal-overlay" onclick="closePDFModal()"></div>
    <div class="pdf-modal-content">
      <div class="pdf-modal-header">
        <span class="pdf-modal-title">📄 Your Estimate</span>
        <div class="pdf-modal-actions">
          <button class="pdf-btn-download" onclick="downloadPDF()">⬇️ Download PDF</button>
          <button class="pdf-btn-email" onclick="promptEmailPDF()">📧 Email PDF</button>
          <button class="pdf-btn-close" onclick="closePDFModal()">✕</button>
        </div>
      </div>
      <iframe id="pdfFrame" src="${pdfDataUrl}" class="pdf-frame"></iframe>
    </div>`;
  document.body.appendChild(modal);

  // Store URL for download
  window._currentPdfUrl = pdfDataUrl;
}

function closePDFModal() {
  const modal = document.getElementById('pdfModal');
  if (modal) modal.remove();
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  // Rebuild and download
  const pdfUrl = buildPDF();
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = `Specialty-Home-Painting-Estimate-${Date.now()}.pdf`;
  link.click();
}

function promptEmailPDF() {
  closePDFModal();
  if (customerEmail) {
    generateAndEmailPDF(customerEmail);
    showBotMessage(`📧 Quote emailed to ${customerEmail}!`);
  } else {
    showBotMessage("What's your email address? I'll send the PDF quote right over.");
    showTextInput();
    window._pendingEmailPDF = true;
  }
}

function generateAndEmailPDF(email) {
  const pdfDataUrl = buildPDF();
  // Send via EmailJS with PDF note
  const summary = chatHistory
    .map(m => `${m.role === 'user' ? 'Customer' : 'Agent'}: ${m.content}`)
    .join('\n\n');

  emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
    name: customerName || 'Website Chat Visitor',
    email: email,
    customer_email: email,
    phone: 'See quote',
    service: currentQuote?.items?.map(i => i.description).join(', ') || 'See quote',
    message: `QUOTE REQUESTED\n\nEstimate Total: $${currentQuote?.total_low} - $${currentQuote?.total_high}\n\nCHAT SUMMARY:\n\n${summary}\n\n[PDF quote attached — Issam will send the PDF directly]`
  }).then(() => {
    console.log('Quote email sent');
  }).catch(err => {
    console.error('Email error:', err);
  });
}

// ============================================================
// EMAIL FUNCTIONS
// ============================================================
function sendChatSummary(email) {
  const summary = chatHistory
    .map(m => `${m.role === 'user' ? 'Customer' : 'Agent'}: ${m.content}`)
    .join('\n\n');

  // Send to Issam
  emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
    name: customerName || 'Website Chat Visitor',
    email: 'issam@specialtyhomepainting.com',
    customer_email: email,
    phone: 'Not provided',
    service: 'Website Chat — New Lead',
    message: `New lead from website chat.\nCustomer email: ${email}\n\nCHAT SUMMARY:\n\n${summary}`
  });

  // Send copy to customer
  emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
    name: 'Specialty Home Painting',
    email: email,
    customer_email: 'issam@specialtyhomepainting.com',
    phone: '(904) 514-7016',
    service: 'Your Estimate Request — Specialty Home Painting',
    message: `Hi! Thank you for chatting with us.\n\nHere is a summary of your conversation:\n\n${summary}\n\nIssam will follow up with you shortly. You can also call or text at (904) 514-7016 or visit specialtyhomepainting.com`
  }).then(() => {
    showBotMessage(`✅ Your request has been sent! You should receive a copy at ${email}. Issam will follow up within 15 minutes. You can also call or text directly at (904) 514-7016. 😊`);
    showQuickButtons(['📄 View Quote', '📞 Call Issam', '✕ Close chat']);
  }).catch(err => {
    console.error('EmailJS error:', err);
    showBotMessage(`✅ Thanks! Issam will be in touch shortly at ${email}.`);
  });
}

function sendEmailToCustomer(email, subject, body) {
  emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
    name: customerName || 'Customer',
    email: 'issam@specialtyhomepainting.com',
    customer_email: email,
    phone: 'Not provided',
    service: subject || 'Follow up',
    message: body || 'Thank you for contacting Specialty Home Painting.'
  });
}

function sendEmailToIssam(subject, body) {
  const summary = chatHistory
    .map(m => `${m.role === 'user' ? 'Customer' : 'Agent'}: ${m.content}`)
    .join('\n\n');

  emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
    name: 'Website Chat',
    email: 'issam@specialtyhomepainting.com',
    customer_email: customerEmail || 'unknown',
    phone: 'Not provided',
    service: subject || 'Chat notification',
    message: body || summary
  });
}
