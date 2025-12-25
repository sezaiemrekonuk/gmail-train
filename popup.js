document.addEventListener('DOMContentLoaded', function() {
  // ⏱️ UI TIMING CONFIGURATION
  const UI_TIMING = {
    HIDE_PROGRESS_DELAY: 2000,      // Delay before hiding progress bar
    HIDE_STATUS_DELAY: 5000,        // Delay before hiding status messages
    AUTOSAVE_DELAY: 500             // Delay for auto-saving form data
  };

  // Storage keys
  const STORAGE_KEYS = {
    FORM_DATA: 'gmail_train_form_data',
    SHOULD_STOP: 'shouldStop'
  };

  const form = document.getElementById('emailForm');
  const statusDiv = document.getElementById('status');
  const progressDiv = document.getElementById('progress');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const scheduleBtn = document.getElementById('scheduleBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearFormBtn = document.getElementById('clearFormBtn');
  const emailsInput = document.getElementById('emails');
  const emailCounter = document.getElementById('emailCounter');
  const currentEmailEl = document.getElementById('currentEmail');
  const etaEl = document.getElementById('eta');
  const timezoneDisplay = document.getElementById('timezoneDisplay');

  // Progress state for ETA calculation
  const progressState = {
    startTime: null,
    currentEmail: null
  };

  // Set minimum date to current date/time
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('plannedDate').min = now.toISOString().slice(0, 16);

  // Display timezone
  displayTimezone();

  // Restore saved form data
  restoreFormData();

  // ============================================
  // EMAIL VALIDATION
  // ============================================
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function isValidEmail(email) {
    return emailRegex.test(email);
  }

  function parseAndValidateEmails(input) {
    const emails = input
      .split(/[,;\n]+/)
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);
    
    const valid = [];
    const invalid = [];
    
    emails.forEach(email => {
      if (isValidEmail(email)) {
        valid.push(email);
      } else {
        invalid.push(email);
      }
    });
    
    return { valid, invalid, total: emails.length };
  }

  function updateEmailCounter() {
    const result = parseAndValidateEmails(emailsInput.value);
    
    if (result.total === 0) {
      emailCounter.textContent = '';
      emailCounter.className = '';
    } else if (result.invalid.length > 0) {
      emailCounter.textContent = `${result.valid.length} valid, ${result.invalid.length} invalid`;
      emailCounter.className = 'has-errors';
    } else {
      emailCounter.textContent = `${result.valid.length} email${result.valid.length !== 1 ? 's' : ''} ready`;
      emailCounter.className = 'valid';
    }
  }

  // Debounce utility
  function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Real-time email validation
  emailsInput.addEventListener('input', debounce(updateEmailCounter, 300));

  // ============================================
  // TIMEZONE DISPLAY
  // ============================================
  function displayTimezone() {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offset = new Date().getTimezoneOffset();
      const offsetHours = Math.abs(Math.floor(offset / 60));
      const offsetMinutes = Math.abs(offset % 60);
      const offsetSign = offset <= 0 ? '+' : '-';
      const offsetString = `UTC${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
      timezoneDisplay.textContent = `${timeZone} (${offsetString})`;
    } catch (e) {
      timezoneDisplay.textContent = 'Local time';
    }
  }

  // ============================================
  // QUICK SCHEDULE PRESETS
  // ============================================
  const PRESETS = {
    hour1: {
      getDate: () => {
        const d = new Date();
        d.setHours(d.getHours() + 1);
        d.setMinutes(0, 0, 0);
        return d;
      }
    },
    hour3: {
      getDate: () => {
        const d = new Date();
        d.setHours(d.getHours() + 3);
        d.setMinutes(0, 0, 0);
        return d;
      }
    },
    tomorrow9: {
      getDate: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(9, 0, 0, 0);
        return d;
      }
    },
    monday9: {
      getDate: () => {
        const d = new Date();
        const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
        d.setDate(d.getDate() + daysUntilMonday);
        d.setHours(9, 0, 0, 0);
        return d;
      }
    }
  };

  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.preset;
      const preset = PRESETS[presetKey];
      if (preset) {
        const date = preset.getDate();
        document.getElementById('plannedDate').value = formatDateForInput(date);
        
        // Visual feedback
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 200);
        
        // Trigger auto-save
        autoSaveFormData();
      }
    });
  });

  // ============================================
  // FORM DATA PERSISTENCE
  // ============================================
  function getFormData() {
    return {
      emails: document.getElementById('emails').value,
      cc: document.getElementById('cc').value,
      subject: document.getElementById('subject').value,
      message: document.getElementById('message').innerHTML,
      delay: document.getElementById('delay').value,
      savedAt: new Date().toISOString()
    };
  }

  function restoreFormData() {
    chrome.storage.local.get([STORAGE_KEYS.FORM_DATA], (result) => {
      const data = result[STORAGE_KEYS.FORM_DATA];
      if (!data) return;
      
      // Only restore if saved within last 24 hours
      const savedAt = new Date(data.savedAt);
      const hoursSinceSave = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceSave > 24) return;
      
      if (data.emails) document.getElementById('emails').value = data.emails;
      if (data.cc) document.getElementById('cc').value = data.cc;
      if (data.subject) document.getElementById('subject').value = data.subject;
      if (data.message) document.getElementById('message').innerHTML = data.message;
      if (data.delay) document.getElementById('delay').value = data.delay;
      
      // Update email counter after restore
      updateEmailCounter();
    });
  }

  function autoSaveFormData() {
    const formData = getFormData();
    chrome.storage.local.set({ [STORAGE_KEYS.FORM_DATA]: formData });
  }

  function clearSavedFormData() {
    chrome.storage.local.remove([STORAGE_KEYS.FORM_DATA]);
  }

  // Auto-save on input changes
  const debouncedAutoSave = debounce(autoSaveFormData, UI_TIMING.AUTOSAVE_DELAY);
  
  document.querySelectorAll('#emailForm input, #emailForm textarea').forEach(input => {
    input.addEventListener('input', debouncedAutoSave);
  });

  // Watch WYSIWYG editor for changes
  const editorObserver = new MutationObserver(debouncedAutoSave);
  editorObserver.observe(document.getElementById('message'), {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Clear form button handler
  clearFormBtn.addEventListener('click', () => {
    form.reset();
    document.getElementById('message').innerHTML = '';
    clearSavedFormData();
    emailCounter.textContent = '';
    emailCounter.className = '';
    showStatus('Form cleared', 'info');
  });

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
    await chrome.storage.local.set({ [STORAGE_KEYS.SHOULD_STOP]: true });
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
    await chrome.storage.local.set({ [STORAGE_KEYS.SHOULD_STOP]: false });
    
    // Notify background worker that scheduling started
    chrome.runtime.sendMessage({
      action: 'schedulingStarted',
      total: emails.length,
      tabId: tab.id
    });
    
    showStatus('Starting email scheduling...', 'info');
    initProgress(emails.length);
    showProgress(0, emails.length, emails[0]);

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
          clearSavedFormData(); // Clear auto-saved data
          emailCounter.textContent = '';
          emailCounter.className = '';
        }
        
        // Clear scheduling flag only (preserve other data)
        chrome.storage.local.remove([STORAGE_KEYS.SHOULD_STOP]);
        
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
      showProgress(message.current, message.total, message.currentEmail);
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

  function initProgress(total) {
    progressState.startTime = Date.now();
    progressState.currentEmail = null;
    progressDiv.classList.remove('hidden');
    progressBar.style.width = '0%';
    currentEmailEl.classList.add('hidden');
    etaEl.classList.add('hidden');
  }

  function showProgress(current, total, currentEmail) {
    progressDiv.classList.remove('hidden');
    const percentage = total > 0 ? (current / total) * 100 : 0;
    progressBar.style.width = percentage + '%';
    progressText.textContent = `Scheduling: ${current}/${total}`;
    
    // Show current email
    if (currentEmail) {
      progressState.currentEmail = currentEmail;
      currentEmailEl.textContent = `Current: ${currentEmail}`;
      currentEmailEl.classList.remove('hidden');
    }
    
    // Calculate and show ETA
    if (current > 0 && current < total && progressState.startTime) {
      const elapsed = Date.now() - progressState.startTime;
      const avgTimePerEmail = elapsed / current;
      const remaining = (total - current) * avgTimePerEmail;
      
      const etaMinutes = Math.floor(remaining / 60000);
      const etaSeconds = Math.ceil((remaining % 60000) / 1000);
      
      if (etaMinutes > 0) {
        etaEl.textContent = `ETA: ~${etaMinutes}m ${etaSeconds}s`;
      } else {
        etaEl.textContent = `ETA: ~${etaSeconds}s`;
      }
      etaEl.classList.remove('hidden');
    }
  }

  function hideProgress() {
    progressDiv.classList.add('hidden');
    progressBar.style.width = '0%';
    currentEmailEl.classList.add('hidden');
    etaEl.classList.add('hidden');
    progressState.startTime = null;
    progressState.currentEmail = null;
  }
});

