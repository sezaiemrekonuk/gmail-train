# Gmail Train - Multi-Email Scheduler

A powerful Chrome extension that allows you to schedule and send emails separately and sequentially to multiple recipients in Gmail.

## Features

- 📧 Send emails to multiple recipients separately (not as a group)
- 📅 Schedule emails for a specific date and time
- 🔄 Sequential sending with configurable delays
- 💌 Support for CC recipients
- ✨ Beautiful, modern UI with gradient design
- 📊 Real-time progress tracking with badge counter
- 📝 WYSIWYG HTML editor for rich text emails
- 🛑 Stop button to halt scheduling mid-process
- 🔔 Desktop notifications on completion
- 🎯 Background service worker for multitasking
- 🛡️ Tab close protection during scheduling
- 🌍 **Bilingual support** - Works with both English and Turkish Gmail interfaces

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `gmail-train` folder
5. The extension will now appear in your Chrome toolbar

## Usage

### Step 1: Open Gmail
Navigate to [Gmail](https://mail.google.com) in your Chrome browser.

### Step 2: Open the Extension
Click on the extension icon in your Chrome toolbar.

### Step 3: Fill in the Form

- **Email Addresses**: Enter multiple email addresses separated by commas
  - Example: `email1@example.com,email2@example.com,email3@example.com`
  
- **CC (optional)**: Enter CC recipient(s)
  
- **Subject**: Enter your email subject
  
- **Message**: Enter your email message using the rich text editor
  - Use the toolbar to format text (Bold, Italic, Underline)
  - Add bullet or numbered lists
  - Insert hyperlinks
  - Full HTML support with visual editor
  
- **Planned Date & Time**: Select when you want the emails to be scheduled
  - Must be a future date/time
  - Uses your local timezone
  
- **Delay between emails**: Set the delay (in seconds) between scheduling each email
  - Default: 5 seconds
  - Range: 1-60 seconds

### Step 4: Schedule Emails
Click the "Schedule Emails" button. The extension will:
1. Open a Gmail compose window for each recipient
2. Fill in the recipient, subject, and message
3. Click the schedule send option
4. Set your planned date/time
5. Move to the next recipient after the configured delay

**During Scheduling:**
- Watch the extension icon badge for live progress (e.g., "3/10")
- Click "STOP" button to halt scheduling after the current email
- You can switch to other tabs - the extension works in background
- Keep the Gmail tab open (don't close or navigate away)
- You'll receive a desktop notification when complete

## Example Workflow

**Input:**
```
Emails: sezaiemrekonuk@gmail.com,friend@example.com
CC: sezaiemrekonuk@gmail.com
Subject: Test Email
Message: This is a test message
Planned Date: October 23, 2025, 10:00 AM
Delay: 5 seconds
```

**What happens:**
1. First email scheduled to `sezaiemrekonuk@gmail.com` for Oct 23, 2025 at 10:00 AM
2. Wait 5 seconds
3. Second email scheduled to `friend@example.com` for Oct 23, 2025 at 10:00 AM

Each recipient will receive a **separate** scheduled email (not a group email).

## Important Notes

### Gmail Limitations
- You must be logged into Gmail
- Gmail has daily sending limits (typically 500 emails/day for regular accounts)
- The extension uses Gmail's native "Schedule Send" feature
- Scheduled emails appear in your "Scheduled" folder in Gmail
- **Keep Gmail tab open** during scheduling (don't close or navigate away)

### Multitasking Features
- **Switch tabs freely** - Extension works in background via service worker
- **Close popup** - No need to keep popup open during scheduling
- **Watch badge counter** - Extension icon shows live progress (e.g., "3/10")
- **Desktop notifications** - Get notified when all emails are scheduled
- **Stop anytime** - Use STOP button to halt after current email

### Browser Requirements
- Google Chrome (or Chromium-based browsers)
- Manifest V3 support
- Active internet connection
- Notification permissions (optional but recommended)

### Privacy & Security
- This extension runs entirely in your browser
- No data is sent to external servers
- All email scheduling is done through Gmail's interface
- The extension only works on `mail.google.com`
- Form data is cleared after successful scheduling

### Language Support
- ✅ **English Gmail Interface** - Fully supported
- ✅ **Turkish Gmail Interface** - Fully supported
- The extension automatically detects and works with both language interfaces
- All button and menu selectors support both English and Turkish text
- No configuration needed - just works out of the box

## File Structure

```
gmail-train/
├── manifest.json       # Extension configuration (Manifest V3)
├── background.js       # Service worker for background operations
├── popup.html          # Extension popup UI
├── popup.css           # Popup styling with modern design
├── popup.js            # Popup logic and form handling
├── content.js          # Gmail DOM manipulation
├── images/             # Extension icons
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── README.md           # This file
├── CHANGELOG.md        # Version history and updates
└── INSTALLATION.md     # Installation guide
```

## How It Works

1. **Popup Interface**: Provides a user-friendly form with WYSIWYG editor to collect email data
2. **Background Service Worker**: Manages state, badge counter, and desktop notifications
3. **Message Passing**: Sends data between popup, content script, and background worker using Chrome's messaging API
4. **DOM Manipulation**: The content script interacts with Gmail's DOM to:
   - Click the compose button
   - Fill in recipient, subject, and message fields (including HTML content)
   - Access the schedule send menu
   - Set the scheduled date/time
   - Close compose windows between emails
5. **Sequential Processing**: Processes each email one at a time with configurable delays
6. **Progress Tracking**: Real-time badge updates and notifications for completion

## Troubleshooting

### Extension doesn't appear
- Make sure Developer Mode is enabled in `chrome://extensions/`
- Try reloading the extension

### Schedule button not working
- Ensure you're on Gmail (`mail.google.com`)
- Try refreshing the Gmail tab
- Check that all required fields are filled

### Emails not scheduling correctly
- Gmail's interface may have changed
- Try increasing the delay between emails
- Manually check Gmail's "Scheduled" folder

### Progress bar stuck
- Refresh the Gmail page and try again
- Check the browser console for errors (F12 > Console)

## Development

### Technologies Used
- HTML5, CSS3, JavaScript (ES6+)
- Chrome Extension Manifest V3
- Chrome APIs: `tabs`, `scripting`, `storage`, `notifications`, `action`
- Background Service Worker for persistent state
- WYSIWYG contenteditable editor with `document.execCommand()`

### Customization
- Edit `popup.css` to change the UI design
- Modify `content.js` to adjust Gmail DOM selectors or timing configuration
- Update `background.js` to change notification behavior or badge logic
- Update `manifest.json` to change permissions or metadata

## Known Limitations

1. **Gmail UI Dependencies**: The extension relies on Gmail's DOM structure, which may change
2. **Language Support**: Supports both English and Turkish Gmail interfaces
3. **Gmail Tab Must Stay Open**: Don't close or navigate away from Gmail tab during scheduling
4. **Scheduling UI**: Gmail's schedule dialog structure may vary
5. **Performance**: Each email takes ~15-18 seconds to schedule (optimized from 25-30 seconds)

## Future Enhancements

- [ ] Support for email templates
- [ ] CSV import for bulk emails
- [ ] Personalized message variables
- [ ] Better error handling and recovery
- [ ] Support for multiple Gmail accounts
- [ ] Retry logic for failed schedules

## License

This is a personal project. Use at your own discretion.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Gmail's official documentation
3. Check Chrome's extension development docs

## Version History

- **v1.4.2** (October 23, 2025): English Language Support
  - Full support for English Gmail interface
  - Bilingual support (English & Turkish)
  - Auto-detection of language
  - All selectors updated for both languages

- **v1.4.1** (October 23, 2025): Bug Fixes & Reliability
  - Fixed "Schedule send" click issue
  - Enhanced click reliability with multiple fallback selectors
  - Increased timing for better stability
  - Improved error messages and logging

- **v1.4.0** (October 23, 2025): Background Service Worker & Notifications
  - Background service worker for persistent state
  - Badge counter on extension icon (e.g., "3/10")
  - Desktop notifications for completion
  - Tab close protection
  - Multi-tasking support

- **v1.3.0** (October 23, 2025): WYSIWYG HTML Editor
  - Rich text editor for HTML emails
  - Formatting toolbar (Bold, Italic, Underline, Lists, Links)
  - Keyboard shortcuts support
  - Custom scrollbar and modern design

- **v1.2.1** (October 23, 2025): Performance Improvements
  - Centralized timing configuration
  - 40-50% faster scheduling (15-18s vs 25-30s per email)
  - Optimized wait times throughout

- **v1.2.0** (October 23, 2025): Stop Button & Click Fixes
  - STOP button to halt scheduling mid-process
  - Fixed schedule dropdown clicking
  - Fixed date selection in calendar
  - Fixed time input setting
  - Enhanced mouse event simulation

- **v1.1.0** (October 23, 2025): Separate Drafts & Auto-Clear
  - Fixed "same draft" issue - each email gets separate compose window
  - Automatic form clearing after scheduling
  - Better compose window management

- **v1.0.0** (October 23, 2025): Initial Release
  - Basic scheduling functionality
  - Sequential sending with delays
  - Progress tracking
  - Modern gradient UI
  - CC support

---

**Disclaimer**: This extension interacts with Gmail's interface and is not officially affiliated with Google. Use responsibly and in accordance with Gmail's Terms of Service.

