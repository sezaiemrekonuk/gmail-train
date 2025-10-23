document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('emailForm');
  const statusDiv = document.getElementById('status');
  const progressDiv = document.getElementById('progress');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const scheduleBtn = document.getElementById('scheduleBtn');

  // Set minimum date to current date/time
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('plannedDate').min = now.toISOString().slice(0, 16);

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const emailsInput = document.getElementById('emails').value;
    const cc = document.getElementById('cc').value.trim();
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    const plannedDate = document.getElementById('plannedDate').value;
    const delay = parseInt(document.getElementById('delay').value) || 5;

    // Parse emails
    const emails = emailsInput.split(',').map(email => email.trim()).filter(email => email);

    if (emails.length === 0) {
      showStatus('Please enter at least one email address', 'error');
      return;
    }

    // Validate date is in future
    const scheduledTime = new Date(plannedDate);
    if (scheduledTime <= new Date()) {
      showStatus('Planned date must be in the future', 'error');
      return;
    }

    // Check if we're on Gmail
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('mail.google.com')) {
      showStatus('Please open Gmail first, then use this extension', 'error');
      return;
    }

    // Disable form
    scheduleBtn.disabled = true;
    showStatus('Starting email scheduling...', 'info');
    showProgress(0, emails.length);

    try {
      // Send data to content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'scheduleEmails',
        data: {
          emails,
          cc,
          subject,
          message,
          plannedDate: scheduledTime.toISOString(),
          delay
        }
      });

      if (response && response.success) {
        showStatus(`Successfully scheduled ${emails.length} email(s)!`, 'success');
        
        // Clear the form
        form.reset();
        
        // Clear any stored data
        chrome.storage.local.clear();
        
        // Hide progress after a delay
        setTimeout(() => {
          hideProgress();
          showStatus('All emails scheduled! Form cleared.', 'success');
        }, 2000);
      } else {
        showStatus(response?.error || 'Failed to schedule emails', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showStatus('Error: ' + error.message, 'error');
    } finally {
      scheduleBtn.disabled = false;
    }
  });

  // Listen for progress updates from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateProgress') {
      showProgress(message.current, message.total);
      if (message.current === message.total) {
        setTimeout(() => {
          hideProgress();
        }, 2000);
      }
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.remove('hidden');
    
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        statusDiv.classList.add('hidden');
      }, 5000);
    }
  }

  function showProgress(current, total) {
    progressDiv.classList.remove('hidden');
    const percentage = (current / total) * 100;
    progressBar.style.width = percentage + '%';
    progressText.textContent = `Scheduling: ${current}/${total}`;
  }

  function hideProgress() {
    progressDiv.classList.add('hidden');
    progressBar.style.width = '0%';
  }
});

