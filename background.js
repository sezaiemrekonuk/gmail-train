// Background Service Worker for Gmail Train Extension
console.log('Gmail Train Background Service Worker loaded');

// Track scheduling state
let schedulingState = {
  isScheduling: false,
  current: 0,
  total: 0,
  gmailTabId: null
};

// Listen for messages from popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.action === 'updateProgress') {
    handleProgressUpdate(message);
  } else if (message.action === 'schedulingStarted') {
    handleSchedulingStarted(message);
  } else if (message.action === 'schedulingComplete') {
    handleSchedulingComplete(message);
  } else if (message.action === 'schedulingStopped') {
    handleSchedulingStopped(message);
  }
  
  return true;
});

function handleSchedulingStarted(message) {
  schedulingState.isScheduling = true;
  schedulingState.current = 0;
  schedulingState.total = message.total || 0;
  schedulingState.gmailTabId = message.tabId;
  
  updateBadge(0, message.total);
  
  console.log('Scheduling started:', schedulingState);
}

function handleProgressUpdate(message) {
  schedulingState.current = message.current;
  schedulingState.total = message.total;
  
  updateBadge(message.current, message.total);
  
  // If completed
  if (message.current === message.total && schedulingState.isScheduling) {
    schedulingState.isScheduling = false;
    showCompletionNotification(message.total);
  }
}

function handleSchedulingComplete(message) {
  schedulingState.isScheduling = false;
  
  const count = message.count || schedulingState.total;
  updateBadge(0, 0); // Clear badge
  showCompletionNotification(count);
  
  console.log('Scheduling completed:', count, 'emails');
}

function handleSchedulingStopped(message) {
  schedulingState.isScheduling = false;
  
  const completed = message.completed || schedulingState.current;
  const total = message.total || schedulingState.total;
  
  updateBadge(0, 0); // Clear badge
  showStoppedNotification(completed, total);
  
  console.log('Scheduling stopped:', completed, 'of', total);
}

function updateBadge(current, total) {
  if (total === 0 || current === total) {
    // Clear badge
    chrome.action.setBadgeText({ text: '' });
  } else {
    // Show progress like "3/10"
    chrome.action.setBadgeText({ text: `${current}/${total}` });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' }); // Green
  }
}

function showCompletionNotification(count) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon-128.png',
    title: '✅ Gmail Train - Complete!',
    message: `Successfully scheduled ${count} email${count > 1 ? 's' : ''}!`,
    priority: 2,
    requireInteraction: false
  }, (notificationId) => {
    // Auto-close after 5 seconds
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, 5000);
  });
}

function showStoppedNotification(completed, total) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon-128.png',
    title: '⏹ Gmail Train - Stopped',
    message: `Scheduled ${completed} of ${total} email${total > 1 ? 's' : ''}.`,
    priority: 1,
    requireInteraction: false
  }, (notificationId) => {
    // Auto-close after 5 seconds
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, 5000);
  });
}

// Monitor if Gmail tab is closed during scheduling
chrome.tabs.onRemoved.addListener((tabId) => {
  if (schedulingState.isScheduling && tabId === schedulingState.gmailTabId) {
    console.warn('Gmail tab closed during scheduling!');
    schedulingState.isScheduling = false;
    updateBadge(0, 0);
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon-128.png',
      title: '⚠️ Gmail Train - Interrupted',
      message: 'Gmail tab was closed. Scheduling stopped.',
      priority: 2
    });
  }
});

