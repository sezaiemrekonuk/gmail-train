// Gmail Scheduler Content Script
console.log('Gmail Scheduler Extension Loaded');

// ⏱️ TIMING CONFIGURATION
// All timing values in milliseconds - adjust these to optimize performance
const TIMING = {
  // Compose window management
  AFTER_CLOSE_WINDOWS: 800,        // Wait after closing old compose windows
  AFTER_COMPOSE_CLICK: 300,       // Wait after clicking compose button
  COMPOSE_WINDOW_READY: 200,       // Wait for compose window to be ready
  
  // Form field filling
  AFTER_RECIPIENT_FILL: 300,       // Wait after filling recipient
  AFTER_CC_BUTTON: 200,            // Wait after clicking CC button
  AFTER_CC_FILL: 300,              // Wait after filling CC
  AFTER_SUBJECT_FILL: 200,         // Wait after filling subject
  AFTER_MESSAGE_FILL: 500,         // Wait after filling message body
  
  // Schedule dropdown interactions
  SCROLL_INTO_VIEW: 200,           // Wait after scrolling element into view
  AFTER_DIRECT_CLICK: 150,         // Wait after direct click
  BETWEEN_MOUSE_EVENTS: 40,        // Wait between mouseenter/mousedown/mouseup
  AFTER_DROPDOWN_CLICK: 300,      // Wait for dropdown to appear
  BEFORE_MENU_SEARCH: 300,         // Wait before searching for menu items
  
  // Schedule dialog
  AFTER_SCHEDULE_OPTION: 400,     // Wait for schedule dialog to appear
  AFTER_DIALOG_READY: 400,         // Wait after dialog is found
  AFTER_DATETIME_CLICK: 500,      // Wait for calendar to appear
  
  // Date/time picker
  AFTER_DAY_CLICK: 600,            // Wait after clicking calendar day
  BEFORE_TIME_INPUT: 150,          // Wait before setting time input
  AFTER_TIME_CLEAR: 80,            // Wait after clearing time input
  AFTER_TIME_SET: 400,             // Wait after setting time
  BEFORE_FINAL_SAVE: 600,          // Wait before clicking final save button
  
  // Final confirmation
  AFTER_SAVE_SCROLL: 200,          // Wait after scrolling to save button
  AFTER_SAVE_CLICK: 100,          // Wait for schedule to complete
  AFTER_SCHEDULE_COMPLETE: 100,   // Wait after scheduling is done
  AFTER_FINAL_CLOSE: 400,          // Wait after closing compose window
  
  // Element waiting
  WAIT_FOR_ELEMENT_CHECK: 200      // Interval for waitForElement checks
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scheduleEmails') {
    scheduleEmailsSequentially(request.data)
      .then((result) => {
        sendResponse({ 
          success: true, 
          stopped: result.stopped,
          completed: result.completed 
        });
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
  let stopped = false;
  let completedCount = 0;
  
  for (let i = 0; i < emails.length; i++) {
    // Check if user clicked stop button
    const storage = await chrome.storage.local.get(['shouldStop']);
    if (storage.shouldStop === true) {
      console.log('🛑 Stop requested by user');
      stopped = true;
      break;
    }
    
    const email = emails[i];
    
    // Update progress
    chrome.runtime.sendMessage({
      action: 'updateProgress',
      current: i,
      total: emails.length
    });

    try {
      // Schedule this email (it handles its own window closing)
      await scheduleEmail(email, cc, subject, message, plannedDate);
      completedCount++;
      
      // Wait before processing next email (except for the last one)
      if (i < emails.length - 1) {
        console.log(`Waiting ${delay} seconds before next email...`);
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
    current: completedCount,
    total: emails.length
  });
  
  return { stopped, completed: completedCount };
}

async function scheduleEmail(toEmail, cc, subject, message, plannedDate) {
  console.log(`\n📧 Starting to schedule email to: ${toEmail}`);
  
  // FIRST: Close any old compose windows
  console.log('Step 1: Closing old compose windows...');
  await closeAllComposeWindows();
  await sleep(TIMING.AFTER_CLOSE_WINDOWS);
  
  // Click compose button to open NEW compose window
  console.log('Step 2: Opening new compose window...');
  const composeButton = await waitForElement('div.T-I.T-I-KE.L3');
  if (!composeButton) {
    throw new Error('Could not find compose button');
  }
  composeButton.click();
  
  await sleep(TIMING.AFTER_COMPOSE_CLICK);

  // Wait for the NEW compose window
  console.log('Step 3: Waiting for compose window...');
  const composeWindow = await waitForElement('div[role="dialog"]', 5000);
  if (!composeWindow) {
    throw new Error('Compose window did not open');
  }
  console.log('✅ Compose window opened');
  
  await sleep(TIMING.COMPOSE_WINDOW_READY);

  // Fill recipient
  console.log(`Step 4: Filling recipient: ${toEmail}...`);
  const toInput = composeWindow.querySelector('input[peoplekit-id="BbVjBd"]');
  if (toInput) {
    toInput.focus();
    toInput.value = toEmail;
    toInput.dispatchEvent(new Event('input', { bubbles: true }));
    toInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
    await sleep(TIMING.AFTER_RECIPIENT_FILL);
    console.log('✅ Recipient filled');
  }

  // Fill CC if provided
  if (cc) {
    console.log(`Step 5: Filling CC: ${cc}...`);
    const ccButton = composeWindow.querySelector('span.aB.gQ.pE');
    if (ccButton && ccButton.textContent.includes('Cc')) {
      ccButton.click();
      await sleep(TIMING.AFTER_CC_BUTTON);
      
      const ccInput = composeWindow.querySelector('div[name="cc"] input[peoplekit-id="BbVjBd"]');
      if (ccInput) {
        ccInput.focus();
        ccInput.value = cc;
        ccInput.dispatchEvent(new Event('input', { bubbles: true }));
        ccInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        await sleep(TIMING.AFTER_CC_FILL);
        console.log('✅ CC filled');
      }
    }
  }

  // Fill subject
  console.log(`Step 6: Filling subject: ${subject}...`);
  const subjectInput = composeWindow.querySelector('input[name="subjectbox"]');
  if (subjectInput) {
    subjectInput.focus();
    subjectInput.value = subject;
    subjectInput.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(TIMING.AFTER_SUBJECT_FILL);
    console.log('✅ Subject filled');
  }

  // Fill message body
  console.log('Step 7: Filling message body...');
  const messageBody = composeWindow.querySelector('div[role="textbox"][aria-label*="İleti"]') || 
                      composeWindow.querySelector('div[role="textbox"][aria-label*="Message"]') ||
                      composeWindow.querySelector('div[contenteditable="true"][aria-label*="Gövde"]') ||
                      composeWindow.querySelector('div[contenteditable="true"]');
  
  if (messageBody) {
    messageBody.focus();
    messageBody.innerHTML = message.replace(/\n/g, '<br>');
    messageBody.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(TIMING.AFTER_MESSAGE_FILL);
    console.log('✅ Message filled');
  }

  // STEP 1: Click the dropdown arrow next to "Gönder" (Send) button
  console.log('Step 8: Looking for schedule dropdown (arrow next to Gönder)...');
  
  // Look for the button with aria-label="Diğer gönderme seçenekleri"
  const scheduleDropdown = composeWindow.querySelector('div[aria-label="Diğer gönderme seçenekleri"]') ||
                          composeWindow.querySelector('div.T-I.hG.T-I-atl[role="button"]') ||
                          composeWindow.querySelector('div.hG[role="button"]');
  
  if (!scheduleDropdown) {
    throw new Error('Could not find schedule dropdown button (arrow next to Gönder)');
  }
  
  console.log('✅ Found dropdown, clicking...');
  
  // Scroll into view
  scheduleDropdown.scrollIntoView({ behavior: 'instant', block: 'center' });
  await sleep(TIMING.SCROLL_INTO_VIEW);
  
  // Try multiple click methods
  try {
    // Method 1: Direct click
    scheduleDropdown.click();
    await sleep(TIMING.AFTER_DIRECT_CLICK);
    
    // Method 2: Mouse events with proper coordinates
    const rect = scheduleDropdown.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseEventOptions = {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: centerX,
      clientY: centerY
    };
    
    scheduleDropdown.dispatchEvent(new MouseEvent('mouseenter', mouseEventOptions));
    await sleep(TIMING.BETWEEN_MOUSE_EVENTS);
    scheduleDropdown.dispatchEvent(new MouseEvent('mousedown', mouseEventOptions));
    await sleep(TIMING.BETWEEN_MOUSE_EVENTS);
    scheduleDropdown.dispatchEvent(new MouseEvent('mouseup', mouseEventOptions));
    await sleep(TIMING.BETWEEN_MOUSE_EVENTS);
    scheduleDropdown.dispatchEvent(new MouseEvent('click', mouseEventOptions));
    
  } catch (e) {
    console.log('Click error:', e);
  }
  
  await sleep(TIMING.AFTER_DROPDOWN_CLICK);

  // STEP 2: Click "Gönderme zamanını planla" (Schedule send) from dropdown
  console.log('Step 9: Looking for "Gönderme zamanını planla" option...');
  await sleep(TIMING.BEFORE_MENU_SEARCH);
  
  // The element with selector="scheduledSend"
  const scheduleSendOption = document.querySelector('div[selector="scheduledSend"]') ||
                             document.querySelector('.J-N[selector="scheduledSend"]');
  
  if (!scheduleSendOption) {
    throw new Error('Could not find "Gönderme zamanını planla" option');
  }
  
  console.log('✅ Found "Gönderme zamanını planla", clicking...');
  
  // Scroll into view
  scheduleSendOption.scrollIntoView({ behavior: 'instant', block: 'center' });
  await sleep(TIMING.SCROLL_INTO_VIEW);
  
  // Multiple click methods
  try {
    scheduleSendOption.click();
    await sleep(TIMING.AFTER_DIRECT_CLICK);
    
    const rect = scheduleSendOption.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseEventOptions = {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: centerX,
      clientY: centerY
    };
    
    scheduleSendOption.dispatchEvent(new MouseEvent('mouseenter', mouseEventOptions));
    await sleep(TIMING.BETWEEN_MOUSE_EVENTS);
    scheduleSendOption.dispatchEvent(new MouseEvent('mousedown', mouseEventOptions));
    await sleep(TIMING.BETWEEN_MOUSE_EVENTS);
    scheduleSendOption.dispatchEvent(new MouseEvent('mouseup', mouseEventOptions));
    await sleep(TIMING.BETWEEN_MOUSE_EVENTS);
    scheduleSendOption.dispatchEvent(new MouseEvent('click', mouseEventOptions));
  } catch (e) {
    console.log('Click error:', e);
  }
  
  // STEP 3: Wait for the dialog with class "uW2Fw-bHj" to appear
  console.log('Step 10: Waiting for schedule dialog to appear...');
  await sleep(TIMING.AFTER_SCHEDULE_OPTION);
  
  // Wait for the dialog
  const scheduleDialog = await waitForElement('.uW2Fw-bHj', 3000);
  if (!scheduleDialog) {
    console.log('⚠️ Schedule dialog not found');
    throw new Error('Schedule dialog did not appear');
  }
  console.log('✅ Schedule dialog appeared');
  
  await sleep(TIMING.AFTER_DIALOG_READY);
  
  // STEP 4: Click "Tarih ve saat seç" menuitem
  console.log('Step 11: Looking for "Tarih ve saat seç" menuitem...');
  
  // Look for menuitem with class "Az AM" that contains "Tarih ve saat seç"
  const pickDateTimeButton = Array.from(document.querySelectorAll('.Az[role="menuitem"]')).find(item => {
    const text = item.textContent.toLowerCase();
    return text.includes('tarih ve saat seç') || text.includes('pick date');
  });
  
  if (!pickDateTimeButton) {
    console.log('⚠️ Could not find "Tarih ve saat seç" menuitem');
    throw new Error('Could not find "Tarih ve saat seç" button');
  }
  
  console.log('✅ Found "Tarih ve saat seç", clicking...');
  
  // Scroll into view
  pickDateTimeButton.scrollIntoView({ behavior: 'instant', block: 'center' });
  await sleep(TIMING.SCROLL_INTO_VIEW);
  
  // Multiple click methods
  try {
    pickDateTimeButton.click();
    await sleep(TIMING.AFTER_DIRECT_CLICK);
    
    const rect = pickDateTimeButton.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseEventOptions = {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: centerX,
      clientY: centerY
    };
    
    pickDateTimeButton.dispatchEvent(new MouseEvent('mouseenter', mouseEventOptions));
    await sleep(TIMING.BETWEEN_MOUSE_EVENTS);
    pickDateTimeButton.dispatchEvent(new MouseEvent('mousedown', mouseEventOptions));
    await sleep(TIMING.BETWEEN_MOUSE_EVENTS);
    pickDateTimeButton.dispatchEvent(new MouseEvent('mouseup', mouseEventOptions));
    await sleep(TIMING.BETWEEN_MOUSE_EVENTS);
    pickDateTimeButton.dispatchEvent(new MouseEvent('click', mouseEventOptions));
  } catch (e) {
    console.log('Click error:', e);
  }
  
  await sleep(TIMING.AFTER_DATETIME_CLICK);

  // STEP 5: Set the date and time in the calendar/time picker
  console.log('Step 12: Setting date and time...');
  const scheduledDate = new Date(plannedDate);
  console.log(`Target date/time: ${scheduledDate.toLocaleString()}`);
  
  // FIRST: Click the calendar day (the calendar is already showing)
  const targetDay = scheduledDate.getDate();
  const targetMonth = scheduledDate.toLocaleDateString('tr-TR', { month: 'short' }); // "Eki" for October
  console.log(`Looking for day ${targetDay} in month ${targetMonth}...`);
  
  // Find the td[role="gridcell"] with aria-label containing the day and month
  const dayCell = Array.from(document.querySelectorAll('td[role="gridcell"]')).find(cell => {
    const ariaLabel = cell.getAttribute('aria-label');
    if (!ariaLabel) return false;
    
    // Match "23 Eki" or similar patterns
    const matches = ariaLabel.match(/^(\d+)\s+(\w+)/);
    if (matches && matches[1] === String(targetDay)) {
      console.log(`Found potential day cell: ${ariaLabel}`);
      // Check if it's not disabled and not from a different month (J-JB-KA-Ku-Kk class)
      const isOtherMonth = cell.classList.contains('J-JB-KA-Ku-Kk');
      const isDisabled = cell.classList.contains('J-JB-KA-a1R-JB');
      return !isOtherMonth;
    }
    return false;
  });
  
  if (dayCell) {
    console.log(`✅ Found day ${targetDay}, clicking...`);
    dayCell.click();
    await sleep(TIMING.AFTER_DAY_CLICK);
  } else {
    console.log(`⚠️ Could not find day ${targetDay}`);
  }
  
  // SECOND: Set the time input
  // Find the time input with aria-label="Zaman" (Time in Turkish)
  const timeInput = document.querySelector('input[aria-label="Zaman"]') ||
                   document.querySelector('input[aria-label="Time"]') ||
                   Array.from(document.querySelectorAll('input[type="text"]')).find(input => {
                     const label = input.getAttribute('aria-label');
                     return label && (label.toLowerCase().includes('zaman') || label.toLowerCase().includes('time'));
                   });
  
  if (timeInput) {
    const hours = String(scheduledDate.getHours()).padStart(2, '0');
    const minutes = String(scheduledDate.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    console.log(`Setting time to: ${timeStr}`);
    timeInput.focus();
    await sleep(TIMING.BEFORE_TIME_INPUT);
    
    // Clear and set value
    timeInput.value = '';
    timeInput.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(TIMING.AFTER_TIME_CLEAR);
    
    timeInput.value = timeStr;
    timeInput.dispatchEvent(new Event('input', { bubbles: true }));
    timeInput.dispatchEvent(new Event('change', { bubbles: true }));
    timeInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
    
    await sleep(TIMING.AFTER_TIME_SET);
    console.log('✅ Time set');
  } else {
    console.log('⚠️ Could not find time input');
  }
  
  await sleep(TIMING.BEFORE_FINAL_SAVE);

  // STEP 6: Click "Kaydet" (Save) or "Gönderme zamanını planla" confirmation button
  console.log('Step 13: Looking for save/schedule button...');
  const finalScheduleButton = Array.from(document.querySelectorAll('button, div[role="button"]')).find(btn => {
    const text = btn.textContent.toLowerCase();
    return text.includes('kaydet') ||
           text.includes('save') ||
           text.includes('gönderme zamanını planla') ||
           text.includes('schedule send') ||
           text.includes('zamanını planla');
  });
  
  if (finalScheduleButton) {
    console.log('✅ Found final button, clicking...');
    
    // Scroll and click properly
    finalScheduleButton.scrollIntoView({ behavior: 'instant', block: 'center' });
    await sleep(TIMING.AFTER_SAVE_SCROLL);
    
    try {
      finalScheduleButton.click();
      await sleep(TIMING.AFTER_DIRECT_CLICK);
      
      const rect = finalScheduleButton.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const mouseEventOptions = {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: centerX,
        clientY: centerY
      };
      
      finalScheduleButton.dispatchEvent(new MouseEvent('mousedown', mouseEventOptions));
      await sleep(TIMING.BETWEEN_MOUSE_EVENTS);
      finalScheduleButton.dispatchEvent(new MouseEvent('mouseup', mouseEventOptions));
      await sleep(TIMING.BETWEEN_MOUSE_EVENTS);
      finalScheduleButton.dispatchEvent(new MouseEvent('click', mouseEventOptions));
    } catch (e) {
      console.log('Click error:', e);
    }
    
    await sleep(TIMING.AFTER_SAVE_CLICK);
  } else {
    console.log('⚠️ Could not find final schedule button');
  }

  // Wait to ensure scheduling is complete
  console.log('Step 14: Waiting for schedule to complete...');
  await sleep(TIMING.AFTER_SCHEDULE_COMPLETE);
  
  // Close this compose window
  console.log('Step 15: Closing compose window...');
  await closeAllComposeWindows();
  await sleep(TIMING.AFTER_FINAL_CLOSE);
  
  console.log(`✅ Successfully scheduled email to ${toEmail}!\n`);
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
  console.log('🧹 Closing compose windows...');
  
  // Simple approach: Just press ESC a few times
  // This is safer than clicking close buttons
  for (let i = 0; i < 3; i++) {
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Escape', 
        keyCode: 27, 
        code: 'Escape',
        bubbles: true,
        cancelable: true
      }));
      await sleep(TIMING.SCROLL_INTO_VIEW); // 200ms between ESC presses
    } catch (e) {
      console.log('⚠️ Error sending ESC:', e);
    }
  }
  
  await sleep(TIMING.AFTER_FINAL_CLOSE); // 400ms final wait
  console.log('✨ Finished closing compose windows');
}


