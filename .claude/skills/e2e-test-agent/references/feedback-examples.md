# Feedback Examples

Real examples of test feedback for common chatbot issues.

## Example 1: Button Not Responding

```markdown
#### 🔴 Send Button: Click does not trigger message send

**Reproduction:**
1. Navigate to chatbot
2. Type "Hello" in message input
3. Click Send button
4. Nothing happens

**Expected:** Message should appear in chat and be sent to API

**Actual:** Button click has no effect, no network request made

**Evidence:**
- Screenshot: send_button_fail.png
- Console error: None
- Network: No request to /api/chat

**Suggested Fix:**
```jsx
// Problem: onClick handler missing or not bound
<button className="send-btn">Send</button>

// Fixed: Add onClick handler
<button 
  className="send-btn" 
  onClick={handleSend}
  type="submit"
>
  Send
</button>

// Or if using form, ensure form has onSubmit:
<form onSubmit={handleSubmit}>
  <input ... />
  <button type="submit">Send</button>
</form>
```

**Priority:** Critical - core functionality broken
```

## Example 2: Loading State Missing

```markdown
#### 🟡 Chat: No loading indicator during API call

**Issue:** When user sends message, there's no visual feedback that request is in progress. User might click Send multiple times.

**Impact:** 
- Poor UX - user doesn't know if action worked
- Potential duplicate messages from multiple clicks
- User might think app is frozen

**Evidence:**
- Screenshot: no_loading_state.png
- Observed: 2 second delay with no feedback

**Suggestion:**
```jsx
// Add loading state
const [isLoading, setIsLoading] = useState(false);

const handleSend = async () => {
  setIsLoading(true);
  try {
    await sendMessage(message);
  } finally {
    setIsLoading(false);
  }
};

// In render:
{isLoading && <LoadingSpinner />}
<button disabled={isLoading}>
  {isLoading ? 'Sending...' : 'Send'}
</button>
```

**Priority:** Medium - UX issue
```

## Example 3: XSS Vulnerability

```markdown
#### 🔴 Message Display: HTML not escaped - XSS vulnerability

**Reproduction:**
1. Send message: `<img src=x onerror="alert('xss')">`
2. Message renders and executes JavaScript

**Expected:** HTML should be escaped, displayed as text

**Actual:** HTML is rendered, script executes

**Evidence:**
- Screenshot: xss_alert.png
- Alert box appeared with 'xss'

**Suggested Fix:**
```jsx
// Problem: Using dangerouslySetInnerHTML or not escaping
<div dangerouslySetInnerHTML={{__html: message}} />

// Fixed: Use text content (React escapes by default)
<div>{message}</div>

// If you need some HTML (like links), use sanitizer:
import DOMPurify from 'dompurify';

<div 
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(message)
  }} 
/>
```

**Priority:** Critical - security vulnerability
```

## Example 4: Mobile Layout Broken

```markdown
#### 🟡 Layout: Input hidden on mobile viewport

**Issue:** On 375px width, the message input is partially off-screen

**Evidence:**
- Screenshot: mobile_broken.png
- Viewport: 375x667 (iPhone SE)
- Input width: 400px, extends beyond viewport

**Suggestion:**
```css
/* Problem: Fixed width */
.message-input {
  width: 400px;
}

/* Fixed: Responsive width */
.message-input {
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
}

/* Or with container */
.chat-container {
  width: 100%;
  max-width: 600px;
  padding: 0 16px;
  box-sizing: border-box;
}
```

**Priority:** Medium - mobile users affected
```

## Example 5: Keyboard Navigation Broken

```markdown
#### 🟡 Accessibility: Cannot submit with Enter key

**Issue:** Pressing Enter in input does not send message. Users expect Enter to submit.

**Evidence:**
- Tested: Type message, press Enter
- Result: Nothing happens (or newline inserted)

**Suggestion:**
```jsx
// Add keyboard handler
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
  // Shift+Enter for newline (if using textarea)
};

<textarea
  onKeyDown={handleKeyDown}
  ...
/>
```

**Priority:** Medium - UX/accessibility
```

## Example 6: Error Not Handled

```markdown
#### 🔴 Error Handling: Network error crashes app

**Reproduction:**
1. Disconnect network (or mock 500 error)
2. Send message
3. App shows blank/frozen

**Expected:** Show error message, allow retry

**Actual:** Unhandled promise rejection, UI stuck

**Evidence:**
- Screenshot: error_crash.png
- Console: `Uncaught (in promise) TypeError: Failed to fetch`

**Suggested Fix:**
```jsx
const handleSend = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await sendMessage(message);
    addMessage(response);
  } catch (err) {
    setError('Failed to send message. Please try again.');
    console.error('Send error:', err);
  } finally {
    setIsLoading(false);
  }
};

// In render:
{error && (
  <div className="error-banner" role="alert">
    {error}
    <button onClick={handleSend}>Retry</button>
  </div>
)}
```

**Priority:** Critical - app becomes unusable
```

## Example 7: Memory Leak

```markdown
#### 🟡 Performance: Messages not virtualized, slow with many messages

**Issue:** After 100+ messages, scrolling becomes laggy. All messages rendered in DOM.

**Evidence:**
- DOM nodes: 500+ message elements
- Scroll FPS: ~15 (should be 60)
- Memory: 150MB and growing

**Suggestion:**
```jsx
// Use virtualization for long lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={400}
  itemCount={messages.length}
  itemSize={80}
>
  {({ index, style }) => (
    <Message 
      key={messages[index].id}
      message={messages[index]}
      style={style}
    />
  )}
</FixedSizeList>

// Or limit rendered messages
const visibleMessages = messages.slice(-50);
```

**Priority:** Low - only affects long sessions
```

## Example 8: Focus Management

```markdown
#### 🟡 Accessibility: Focus lost after sending message

**Issue:** After clicking Send, focus moves to body. User must click/tab back to input.

**Expected:** Focus should return to input for continuous typing

**Suggestion:**
```jsx
const inputRef = useRef();

const handleSend = async () => {
  await sendMessage(message);
  setMessage('');
  inputRef.current?.focus(); // Return focus
};

<input ref={inputRef} ... />
```

**Priority:** Medium - accessibility/UX
```

## Summary Report Template

```markdown
# E2E Test Report: Chatbot UI

**Date:** 2024-01-15
**URL:** http://localhost:3000
**Duration:** 45 seconds

## Summary

| Status | Count |
|--------|-------|
| ✅ Passed | 12 |
| 🔴 Critical | 2 |
| 🟡 Warnings | 4 |

## Critical Issues (2)

1. **Send Button** - Click not working
2. **Error Handling** - Network error crashes app

## Warnings (4)

1. Loading state missing
2. Mobile layout broken  
3. Enter key doesn't submit
4. Focus lost after send

## Passed Tests (12)

- ✅ Page loads without errors
- ✅ Input accepts text
- ✅ Messages display correctly
- ✅ User/bot messages distinguished
- ✅ Scroll works
- ✅ Long messages handled
- ✅ Emoji render correctly
- ✅ Special chars escaped
- ✅ Timestamps shown
- ✅ Desktop layout correct
- ✅ Tablet layout correct
- ✅ No console errors (except noted)

## Recommended Fix Order

1. 🔴 Fix Send button handler (blocks all functionality)
2. 🔴 Add error handling (prevents crashes)
3. 🟡 Add loading state (quick win, big UX improvement)
4. 🟡 Fix mobile layout (affects mobile users)
5. 🟡 Add Enter key submit (accessibility)
6. 🟡 Fix focus management (accessibility)

## Next Steps

After fixes, re-run tests to verify:
```
e2e-test-agent --url http://localhost:3000 --retest
```
```
