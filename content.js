// Gmail Scheduler Content Script
console.log('Gmail Scheduler Extension Loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scheduleEmails') {
    scheduleEmailsSequentially(request.data)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error scheduling emails:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

async function scheduleEmailsSequentially(data) {
  const { emails, cc, subject, message, plannedDate, delay } = data;
  
  // Close any existing compose windows first
  await closeAllComposeWindows();
  await sleep(1000);
  
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    
    // Update progress
    chrome.runtime.sendMessage({
      action: 'updateProgress',
      current: i,
      total: emails.length
    });

    try {
      // Make sure all previous compose windows are closed
      await closeAllComposeWindows();
      await sleep(500);
      
      // Schedule this email
      await scheduleEmail(email, cc, subject, message, plannedDate);
      
      // Wait before processing next email (except for the last one)
      if (i < emails.length - 1) {
        await sleep(delay * 1000);
      }
    } catch (error) {
      console.error(`Failed to schedule email to ${email}:`, error);
      throw error;
    }
  }

  // Final progress update
  chrome.runtime.sendMessage({
    action: 'updateProgress',
    current: emails.length,
    total: emails.length
  });
  
  // Close any remaining compose windows
  await closeAllComposeWindows();
}

async function scheduleEmail(toEmail, cc, subject, message, plannedDate) {
  // Click compose button
  const composeButton = await waitForElement('div.T-I.T-I-KE.L3');
  if (!composeButton) {
    throw new Error('Could not find compose button');
  }
  composeButton.click();
  
  await sleep(1000);

  // Wait for compose window
  const composeWindow = await waitForElement('div[role="dialog"]', 5000);
  if (!composeWindow) {
    throw new Error('Compose window did not open');
  }

  // Fill recipient
  const toInput = composeWindow.querySelector('input[peoplekit-id="BbVjBd"]');
  if (toInput) {
    toInput.focus();
    toInput.value = toEmail;
    toInput.dispatchEvent(new Event('input', { bubbles: true }));
    toInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
    await sleep(500);
  }

  // Fill CC if provided
  if (cc) {
    const ccButton = composeWindow.querySelector('span.aB.gQ.pE');
    if (ccButton && ccButton.textContent.includes('Cc')) {
      ccButton.click();
      await sleep(300);
      
      const ccInput = composeWindow.querySelector('div[name="cc"] input[peoplekit-id="BbVjBd"]');
      if (ccInput) {
        ccInput.focus();
        ccInput.value = cc;
        ccInput.dispatchEvent(new Event('input', { bubbles: true }));
        ccInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        await sleep(500);
      }
    }
  }

  // Fill subject
  const subjectInput = composeWindow.querySelector('input[name="subjectbox"]');
  if (subjectInput) {
    subjectInput.focus();
    subjectInput.value = subject;
    subjectInput.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(300);
  }

  // Fill message body
  const messageBody = composeWindow.querySelector('div[role="textbox"][aria-label*="İleti"]') || 
                      composeWindow.querySelector('div[role="textbox"][aria-label*="Message"]') ||
                      composeWindow.querySelector('div[contenteditable="true"][aria-label*="Body"]');
  
  if (messageBody) {
    messageBody.focus();
    messageBody.innerHTML = message.replace(/\n/g, '<br>');
    messageBody.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(500);
  }

  // Click schedule send button (the dropdown arrow next to Send)
  const scheduleDropdown = composeWindow.querySelector('div[role="button"].T-I.hG') ||
                          composeWindow.querySelector('div.T-I.hG.T-I-atl');
  
  if (!scheduleDropdown) {
    throw new Error('Could not find schedule send dropdown button');
  }
  
  scheduleDropdown.click();
  await sleep(500);

  // Click "Schedule send" option
  const scheduleSendOption = await waitForElement('div[selector="scheduledSend"]', 2000);
  if (!scheduleSendOption) {
    throw new Error('Could not find schedule send option');
  }
  
  scheduleSendOption.click();
  await sleep(1000);

  // Wait for schedule dialog to appear
  const scheduleDialog = await waitForElement('div[role="dialog"]', 3000);
  if (!scheduleDialog) {
    throw new Error('Schedule dialog did not appear');
  }

  // Click "Pick date & time" option
  const pickDateOption = document.querySelector('div[data-time="pick"]') ||
                        document.querySelector('div[role="menuitem"]');
  
  if (pickDateOption) {
    pickDateOption.click();
    await sleep(1000);

    // Now we need to set the date and time
    // This part is tricky as Gmail's date/time picker is complex
    // We'll try to find the date and time inputs
    const dateInput = document.querySelector('input[type="date"]') ||
                     document.querySelector('input[aria-label*="Date"]');
    const timeInput = document.querySelector('input[type="time"]') ||
                     document.querySelector('input[aria-label*="Time"]');

    if (dateInput && timeInput) {
      const scheduledDate = new Date(plannedDate);
      
      // Format date as YYYY-MM-DD
      const dateStr = scheduledDate.toISOString().split('T')[0];
      dateInput.value = dateStr;
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Format time as HH:MM
      const hours = String(scheduledDate.getHours()).padStart(2, '0');
      const minutes = String(scheduledDate.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      timeInput.value = timeStr;
      timeInput.dispatchEvent(new Event('input', { bubbles: true }));
      timeInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      await sleep(500);

      // Click schedule button
      const scheduleButton = document.querySelector('button[name="schedule"]') ||
                           Array.from(document.querySelectorAll('button')).find(btn => 
                             btn.textContent.toLowerCase().includes('schedule') || 
                             btn.textContent.toLowerCase().includes('planla')
                           );
      
      if (scheduleButton) {
        scheduleButton.click();
        await sleep(1000);
      }
    }
  }

  // Wait to ensure scheduling is complete
  await sleep(1500);
  
  // Close the compose window
  await closeAllComposeWindows();
  await sleep(1000);
}

function waitForElement(selector, timeout = 3000) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function closeAllComposeWindows() {
  // Find and close all open compose windows
  const closeButtons = document.querySelectorAll('img.Ha[alt="Kapat"], img.Ha[alt="Close"], img.Ha[aria-label*="Kapat"], img.Ha[aria-label*="Close"]');
  
  for (const button of closeButtons) {
    try {
      button.click();
      await sleep(300);
    } catch (e) {
      console.log('Error closing compose window:', e);
    }
  }
  
  // Also try to close any modal dialogs
  const dialogs = document.querySelectorAll('div[role="dialog"]');
  for (const dialog of dialogs) {
    const closeBtn = dialog.querySelector('img.Ha, button[aria-label*="Close"], button[aria-label*="Kapat"]');
    if (closeBtn) {
      try {
        closeBtn.click();
        await sleep(300);
      } catch (e) {
        console.log('Error closing dialog:', e);
      }
    }
  }
}

