# Gmail Scheduled Email Sender - Chrome Extension

A Chrome extension that allows you to schedule and send emails separately and sequentially to multiple recipients in Gmail.

## Features

- 📧 Send emails to multiple recipients separately (not as a group)
- 📅 Schedule emails for a specific date and time
- 🔄 Sequential sending with configurable delays
- 💌 Support for CC recipients
- ✨ Beautiful, modern UI with gradient design
- 📊 Real-time progress tracking

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `hello-extension-chrome` folder
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
  
- **Message**: Enter your email message body
  
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

### Browser Requirements
- Google Chrome (or Chromium-based browsers)
- Manifest V3 support
- Active internet connection

### Privacy & Security
- This extension runs entirely in your browser
- No data is sent to external servers
- All email scheduling is done through Gmail's interface
- The extension only works on `mail.google.com`

## File Structure

```
hello-extension-chrome/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.css          # Popup styling
├── popup.js           # Popup logic and form handling
├── content.js         # Gmail DOM manipulation
├── images/            # Extension icons
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md          # This file
```

## How It Works

1. **Popup Interface**: Provides a user-friendly form to collect email data
2. **Message Passing**: Sends data from popup to content script using Chrome's messaging API
3. **DOM Manipulation**: The content script interacts with Gmail's DOM to:
   - Click the compose button
   - Fill in recipient, subject, and message fields
   - Access the schedule send menu
   - Set the scheduled date/time
4. **Sequential Processing**: Processes each email one at a time with delays

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
- Chrome APIs: `tabs`, `scripting`, `storage`

### Customization
- Edit `popup.css` to change the UI design
- Modify `content.js` to adjust Gmail DOM selectors
- Update `manifest.json` to change permissions or metadata

## Known Limitations

1. **Gmail UI Dependencies**: The extension relies on Gmail's DOM structure, which may change
2. **Language Support**: Currently optimized for Turkish Gmail interface (easily adaptable)
3. **Error Handling**: Limited error handling for edge cases
4. **Scheduling UI**: Gmail's schedule dialog structure may vary

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

- **v1.0.0** (October 2025): Initial release
  - Basic scheduling functionality
  - Sequential sending
  - Progress tracking
  - Modern UI

---

**Disclaimer**: This extension interacts with Gmail's interface and is not officially affiliated with Google. Use responsibly and in accordance with Gmail's Terms of Service.

