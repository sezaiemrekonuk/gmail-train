# Changelog

## Version 1.3.0 (October 23, 2025)

### ✨ Major Features

**📝 WYSIWYG HTML Editor**
- **New**: Rich text editor for composing HTML emails
- Simple and effective toolbar with essential formatting options
- No external dependencies - custom built for performance

**Editor Features**:
- **Text Formatting**: Bold, Italic, Underline
- **Lists**: Bullet lists and numbered lists
- **Links**: Insert clickable hyperlinks
- **Clear Formatting**: Remove all formatting with one click
- **Keyboard Shortcuts**: 
  - `Ctrl+B` / `Cmd+B` for Bold
  - `Ctrl+I` / `Cmd+I` for Italic
  - `Ctrl+U` / `Cmd+U` for Underline

**Design**:
- Matches the extension's classy black-white aesthetic
- Dark toolbar with hover effects
- Custom scrollbar for editor area
- Smooth transitions and animations
- Placeholder text for better UX
- Auto-focus support

**HTML Support**:
- Full HTML email composition
- Formatted text appears exactly as typed in Gmail
- Links are styled and clickable
- Lists maintain proper formatting
- Clean HTML output

### 🎨 UI Improvements

**Editor Interface**:
- Clean toolbar with intuitive icons
- Scrollable editor area (max height: 200px)
- Visual feedback on hover and click
- Separator lines for grouping related tools
- Responsive layout

**Styling**:
- Proper styling for bold, italic, underline in editor
- Link colors: `#6eb6ff` (matches Gmail's blue)
- List indentation and spacing
- Custom scrollbar matching the extension theme

### 🔧 Technical Implementation

**popup.html**:
- Replaced textarea with contenteditable div
- Added toolbar with formatting buttons
- Semantic HTML structure

**popup.css**:
- New styles for `.editor-container`, `.editor-toolbar`, `.toolbar-btn`
- Styles for `.editor-content` with placeholder support
- Custom scrollbar styles
- Hover and active states for buttons

**popup.js**:
- Editor initialization with toolbar event listeners
- `document.execCommand()` for formatting commands
- Keyboard shortcut handlers
- HTML content validation
- Form reset clears editor content

### 📝 Benefits

- ✅ Create professional HTML emails
- ✅ No need to write HTML manually
- ✅ Easy-to-use interface
- ✅ Lightweight implementation
- ✅ Maintains extension's aesthetic
- ✅ Works seamlessly with existing features

---

## Version 1.2.1 (October 23, 2025)

### ⚡ Performance Improvements

**Centralized Timing Configuration**
- **New**: All timing values are now defined in a single `TIMING` configuration object
- Easy to adjust and fine-tune all delays from one location
- Each timing constant has descriptive comments explaining its purpose

**Optimized Wait Times**
- Reduced wait times throughout the scheduling process by 40-50%
- **Before**: ~25-30 seconds per email
- **After**: ~15-18 seconds per email
- **Speed improvement**: 7-10 seconds faster per email ⚡

**Specific Optimizations**:
- After closing windows: 1500ms → 800ms (-700ms)
- After compose click: 2000ms → 1200ms (-800ms)
- Mouse event delays: 50-100ms → 40ms (-10 to -60ms)
- Schedule dialog waits: 2500ms → 1500ms (-1000ms)
- Final save operations: 2500ms → 1500ms (-1000ms)
- Form filling delays optimized across all fields

**UI Timing Configuration** (popup.js)
- Added `UI_TIMING` object for popup interface delays
- `HIDE_PROGRESS_DELAY`: 2000ms
- `HIDE_STATUS_DELAY`: 5000ms

### 🔧 Code Improvements

**Maintainability**
- All `sleep()` calls now use named constants instead of magic numbers
- Easier to debug and adjust timing issues
- Better code documentation with inline comments

**Benefits**:
- ✅ Faster email scheduling
- ✅ Easier to maintain and tune
- ✅ More responsive user experience
- ✅ Reduced total scheduling time for multiple emails

---

## Version 1.2.0 (October 23, 2025)

### ✨ Major Features

**🛑 STOP Button**
- **New**: Added a STOP button to halt email scheduling mid-process
- Appears next to "Schedule Emails" button when scheduling starts
- Stops after completing the current email (doesn't interrupt mid-email)
- Shows status: "⏹ Stopped! Scheduled X of Y email(s)."
- Preserves form data when stopped (only clears form if all emails complete)
- Clean red design matching the extension's aesthetic

### 🐛 Critical Bug Fixes

**Fixed: Schedule Dropdown Not Clicking**
- **Problem**: Dropdown arrow next to "Gönder" button wasn't visually opening
- **Solution**: Implemented advanced mouse event simulation
  - Scroll elements into view before clicking
  - Dispatch proper mouseenter, mousedown, mouseup, and click events
  - Calculate and use real element coordinates (clientX, clientY)
  - Added proper timing between events
- **Result**: Dropdowns now open reliably and visibly

**Fixed: Date Selection in Calendar**
- **Problem**: Calendar day (e.g., "23") wasn't being selected properly
- **Solution**: 
  - Now searches for `td[role="gridcell"]` with matching aria-label (e.g., "23 Eki")
  - Filters out days from other months (J-JB-KA-Ku-Kk class)
  - Proper Turkish month matching
- **Result**: Correct day is now highlighted and selected

**Fixed: Time Input Not Setting**
- **Problem**: Time input showed "✅ Time set" but value didn't actually change
- **Solution**:
  - Find input using aria-label="Zaman" (Time in Turkish)
  - Clear field first, then set new value
  - Dispatch input, change, and Enter key events
  - Supports both Turkish and English labels
- **Result**: Time is now properly set to the planned time

**Fixed: Final "Kaydet" Button Not Clicking**
- **Problem**: Schedule dialog was confirming without actual click
- **Solution**:
  - Now searches for "Kaydet" (Save) button explicitly
  - Same advanced mouse event simulation as dropdown
  - Increased wait time to 2000ms after clicking
- **Result**: Emails are properly scheduled and confirmed

### 🔧 Technical Improvements

**Enhanced Click Event Simulation**
- All clickable elements now use proper mouse event sequences
- Elements are scrolled into view before interaction
- Real coordinates calculated for each click
- Increased delays between steps for reliability
- Better error logging for debugging

**Improved Calendar & Time Picker Flow**
- Date is selected FIRST, then time
- Better selectors for Turkish Gmail interface
- More robust aria-label matching
- Filters disabled/grayed-out dates

**Better Progress Tracking**
- Stop functionality integrated with progress updates
- Accurate completed count when stopped
- Progress bar reflects actual completed emails

### 📝 Code Changes

**popup.html**
- Added button group container for flexible layout
- Added STOP button with red styling

**popup.css**
- New `.button-group` flexbox layout
- New `.btn-stop` styles with red theme and hover effects
- Maintains classy black-white aesthetic

**popup.js**
- Added stop button click handler
- Sets/clears `shouldStop` flag in chrome.storage
- Shows/hides stop button at appropriate times
- Handles stopped vs completed states differently
- Preserves form data when stopped

**content.js**
- `scheduleEmailsSequentially()`: Checks stop flag before each email
- Returns `{ stopped, completed }` status object
- Enhanced click simulation with `scrollIntoView()` and coordinate-based events
- Better calendar date selection with aria-label matching
- Time input now clears before setting value
- "Kaydet" button detection added
- Increased sleep durations throughout for stability
- Better logging for debugging clicks and selections

---

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

### New Design
- Changed the appearance of the extension to be more modern and clean.

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
- Added new design to the extension.

**popup.css**
- New styles for info box with gradient background
- New styles for the extension.

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

