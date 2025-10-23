# Quick Installation Guide

## Install the Extension

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/` in your Chrome browser
   - OR click the three dots menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to and select this folder: `hello-extension-chrome`
   - Click "Select Folder"

4. **Verify Installation**
   - You should see "Gmail Scheduled Email Sender" in your extensions list
   - The extension icon should appear in your Chrome toolbar
   - If you don't see it, click the puzzle icon and pin the extension

## First Use

1. **Go to Gmail**
   ```
   https://mail.google.com
   ```

2. **Click the Extension Icon**
   - The extension icon in your toolbar
   - A popup window will appear

3. **Fill in the Form**
   - Emails: `email1@example.com,email2@example.com` (comma-separated)
   - CC: Optional
   - Subject: Your email subject
   - Message: Your email message
   - Planned Date: Select future date and time
   - Delay: Default is 5 seconds

4. **Click "Schedule Emails"**
   - Watch the progress bar
   - Check Gmail's "Scheduled" folder to verify

## Example Test

Try this for your first test:

```
Emails: sezaiemrekonuk@gmail.com
CC: (leave empty)
Subject: Test Email
Message: This is a test message from my Chrome extension
Planned Date: [Select a time 5 minutes from now]
Delay: 5
```

## Troubleshooting

**Extension not showing?**
- Make sure Developer Mode is ON
- Try reloading the extension

**Not working on Gmail?**
- Make sure you're on `mail.google.com`
- Refresh the Gmail page
- Try logging out and back in

**Schedule button grayed out?**
- Fill in all required fields
- Make sure the date is in the future
- Check that you're on Gmail

## Tips

- Test with your own email first
- Use longer delays (10-15 seconds) for many emails
- Check the browser console (F12) if something goes wrong
- Gmail limits: ~500 emails per day

## Support

- Read the full README.md for detailed documentation
- Check Gmail's Scheduled folder to verify emails
- Emails will be sent at the scheduled time automatically by Gmail

---

**Ready to use!** 🚀

