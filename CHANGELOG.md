# Changelog

## Version 1.1.0 (October 23, 2025)

### 🐛 Bug Fixes

**Fixed: "Same Draft" Issue (Taslak Problem)**
- **Problem**: When scheduling 2+ emails, they were being added to the same draft (taslak)
- **Solution**: Each email now gets its own completely separate compose window
- **How**: Added `closeAllComposeWindows()` function that ensures previous compose windows are closed before opening a new one
- **Result**: Each recipient now receives their own individual scheduled email

### ✨ New Features

**Automatic Form & Storage Clearing**
- Form fields are automatically cleared after successful scheduling
- Chrome storage is cleared to prevent data retention
- Success message confirms "All emails scheduled! Form cleared."
- Keeps your data clean and ready for the next batch

**Informational UI Update**
- Added info box at the top of the popup
- Clearly explains that each email is scheduled separately
- Sets proper user expectations

### 🔧 Improvements

**Better Compose Window Management**
- Closes all existing compose windows before starting
- Closes compose window between each email
- Waits appropriately to ensure scheduling completes
- More robust error handling

**Enhanced Delays**
- Added 1.5 second wait after scheduling each email
- Added 1 second wait after closing compose windows
- Ensures Gmail has time to process each action

### 📝 Code Changes

**popup.js**
- Added `chrome.storage.local.clear()` after successful scheduling
- Added extended success message
- Form reset timing improved

**content.js**
- New function: `closeAllComposeWindows()` - Finds and closes all open compose/dialog windows
- Modified: `scheduleEmailsSequentially()` - Now closes windows before each email
- Modified: `scheduleEmail()` - Better completion handling
- Supports both Turkish ("Kapat") and English ("Close") buttons

**popup.html**
- Added info box with explanation

**popup.css**
- New styles for info box with gradient background

---

## Version 1.0.0 (October 23, 2025)

### Initial Release

- Schedule emails to multiple recipients
- Sequential sending with configurable delays
- CC support
- Date/time picker for scheduling
- Progress tracking
- Modern gradient UI
- Form validation
- Error handling

