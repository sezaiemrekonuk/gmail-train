document.addEventListener('DOMContentLoaded', function() {
  // ⏱️ UI TIMING CONFIGURATION
  const UI_TIMING = {
    HIDE_PROGRESS_DELAY: 2000,      // Delay before hiding progress bar
    HIDE_STATUS_DELAY: 5000         // Delay before hiding status messages
  };

  const form = document.getElementById('emailForm');
  const statusDiv = document.getElementById('status');
  const progressDiv = document.getElementById('progress');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const scheduleBtn = document.getElementById('scheduleBtn');
  const stopBtn = document.getElementById('stopBtn');

  // Set minimum date to current date/time
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('plannedDate').min = now.toISOString().slice(0, 16);

  // Initialize WYSIWYG Editor
  const messageEditor = document.getElementById('message');
  const toolbarButtons = document.querySelectorAll('.toolbar-btn');

  toolbarButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const command = this.getAttribute('data-command');
      
      if (command === 'createLink') {
        const url = prompt('Enter the URL:');
        if (url) {
          document.execCommand(command, false, url);
        }
      } else {
        document.execCommand(command, false, null);
      }
      
      messageEditor.focus();
    });
  });

  // Keyboard shortcuts for editor
  messageEditor.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          break;
      }
    }
  });

  // Stop button handler
  stopBtn.addEventListener('click', async function() {
    await chrome.storage.local.set({ shouldStop: true });
    showStatus('⏹ Stopping after current email...', 'info');
    stopBtn.disabled = true;
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const emailsInput = document.getElementById('emails').value;
    const cc = document.getElementById('cc').value.trim();
    const subject = document.getElementById('subject').value;
    const messageHTML = document.getElementById('message').innerHTML.trim();
    const plannedDate = document.getElementById('plannedDate').value;
    const delay = parseInt(document.getElementById('delay').value) || 5;

    // Parse emails
    const emails = emailsInput.split(',').map(email => email.trim()).filter(email => email);

    if (emails.length === 0) {
      showStatus('Please enter at least one email address', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(e => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      showStatus(`Invalid email(s): ${invalidEmails.slice(0, 3).join(', ')}${invalidEmails.length > 3 ? '...' : ''}`, 'error');
      return;
    }

    // Validate message content - strip HTML tags and check for actual text
    const textContent = messageHTML.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (!textContent) {
      showStatus('Please enter a message', 'error');
      messageEditor.focus();
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
      showStatus('❌ Please open Gmail (mail.google.com) first!', 'error');
      return;
    }

    // Disable form and show stop button
    scheduleBtn.disabled = true;
    stopBtn.classList.remove('hidden');
    stopBtn.disabled = false;
    
    // Clear any previous stop flag
    await chrome.storage.local.set({ shouldStop: false });
    
    // Notify background worker that scheduling started
    chrome.runtime.sendMessage({
      action: 'schedulingStarted',
      total: emails.length,
      tabId: tab.id
    });
    
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
          message: messageHTML,
          plannedDate: scheduledTime.toISOString(),
          delay
        }
      }).catch(error => {
        // Handle connection error
        if (error.message.includes('Receiving end does not exist')) {
          throw new Error('Please refresh your Gmail tab and try again');
        }
        throw error;
      });

      if (response && response.success) {
        const wasStopped = response.stopped || false;
        const completedCount = response.completed || emails.length;
        
        if (wasStopped) {
          // Notify background worker that scheduling was stopped
          chrome.runtime.sendMessage({
            action: 'schedulingStopped',
            completed: completedCount,
            total: emails.length
          });
          
          showStatus(`⏹ Stopped! Scheduled ${completedCount} of ${emails.length} email(s).`, 'info');
        } else {
          // Notify background worker that scheduling completed
          chrome.runtime.sendMessage({
            action: 'schedulingComplete',
            count: emails.length
          });
          
          showStatus(`✅ Successfully scheduled ${emails.length} email(s)!`, 'success');
        }
        
        // Clear the form only if all were scheduled
        if (!wasStopped) {
          form.reset();
          messageEditor.innerHTML = ''; // Clear WYSIWYG editor
        }
        
        // Clear scheduling flag only (preserve other data)
        chrome.storage.local.remove(['shouldStop']);
        
        // Hide progress after a delay
        setTimeout(() => {
          hideProgress();
        }, UI_TIMING.HIDE_PROGRESS_DELAY);
      } else {
        showStatus(response?.error || 'Failed to schedule emails', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      
      // User-friendly error messages
      let errorMessage = error.message;
      
      if (error.message.includes('Receiving end does not exist') || 
          error.message.includes('refresh your Gmail tab')) {
        errorMessage = '🔄 Please refresh your Gmail tab and try again!';
      } else if (error.message.includes('Could not establish connection')) {
        errorMessage = '🔄 Gmail tab needs to be refreshed. Please reload the page.';
      }
      
      showStatus(errorMessage, 'error');
    } finally {
      scheduleBtn.disabled = false;
      stopBtn.classList.add('hidden');
      stopBtn.disabled = false;
    }
  });

  // Listen for progress updates from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateProgress') {
      showProgress(message.current, message.total);
      if (message.current === message.total) {
        setTimeout(() => {
          hideProgress();
        }, UI_TIMING.HIDE_PROGRESS_DELAY);
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
      }, UI_TIMING.HIDE_STATUS_DELAY);
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

