---
name: e2e-test-agent
description: "Intelligent E2E testing subagent that dynamically explores, tests, and validates React chatbot UI. Use after code changes to: (1) Automatically discover UI elements and interactions, (2) Generate and execute dynamic test scenarios, (3) Validate chatbot flows and responses, (4) Return actionable feedback with specific fixes. Requires Playwright MCP. Triggers on: 'test the chatbot', 'run E2E tests', 'verify chatbot works', 'check UI after changes', 'validate the implementation'."
---

# E2E Test Agent for React Chatbot

Intelligent subagent that explores UI, creates tests dynamically, and returns actionable feedback.

## Required MCP
- `playwright` - Browser automation

## Core Philosophy

This agent does NOT use predefined test scripts. Instead it:
1. **Explores** - Discovers what's on the page
2. **Understands** - Identifies interactive elements and flows
3. **Tests** - Creates and runs tests based on what it finds
4. **Reports** - Returns specific issues with fix suggestions

---

## Execution Flow

### Phase 1: Discovery

```
1. Navigate to app URL
2. Wait for full load (networkidle)
3. Capture initial state:
   - Screenshot
   - DOM structure
   - Console errors
   - Network requests
```

**Discovery checklist:**
- [ ] What components are visible?
- [ ] What can user interact with?
- [ ] What is the expected flow?
- [ ] Are there loading states?
- [ ] Are there error states visible?

### Phase 2: Element Mapping

Identify all interactive elements:

```python
# Find all interactive elements
interactive = await page.evaluate('''() => {
    const elements = [];
    
    // Buttons
    document.querySelectorAll('button, [role="button"]').forEach(el => {
        elements.push({
            type: 'button',
            text: el.textContent.trim(),
            selector: getSelector(el),
            disabled: el.disabled,
            visible: isVisible(el)
        });
    });
    
    // Inputs
    document.querySelectorAll('input, textarea').forEach(el => {
        elements.push({
            type: el.type || 'text',
            name: el.name || el.placeholder,
            selector: getSelector(el),
            visible: isVisible(el)
        });
    });
    
    // Links
    document.querySelectorAll('a').forEach(el => {
        elements.push({
            type: 'link',
            text: el.textContent.trim(),
            href: el.href,
            selector: getSelector(el)
        });
    });
    
    return elements;
}''')
```

### Phase 3: Dynamic Test Generation

Based on discovered elements, generate tests:

#### For Chatbot specifically:

| Element Found | Tests to Generate |
|---------------|-------------------|
| Message input | Empty submit, long text, special chars, emoji |
| Send button | Click works, disabled states, keyboard submit |
| Message list | Messages appear, scroll works, order correct |
| Loading indicator | Shows during request, hides after |
| Error message | Appears on failure, can dismiss |
| Chat history | Persists, loads correctly |

#### Test Generation Logic:

```
FOR EACH interactive element:
    1. Test basic functionality (click/input works)
    2. Test edge cases (empty, long, special chars)
    3. Test state changes (loading, success, error)
    4. Test accessibility (keyboard, focus)
    
FOR EACH user flow:
    1. Test happy path
    2. Test error path
    3. Test interruption (navigate away, refresh)
```

### Phase 4: Test Execution

Execute tests and collect results:

```python
class TestResult:
    name: str
    status: 'pass' | 'fail' | 'warn'
    element: str
    expected: str
    actual: str
    screenshot: str | None
    suggestion: str | None
```

**Execution rules:**
- Take screenshot BEFORE and AFTER each action
- Capture console errors continuously
- Record network requests
- Note timing (slow responses)

### Phase 5: Feedback Report

Generate structured feedback:

```markdown
## E2E Test Report

### Summary
- Status: PASS/FAIL
- Tests: X passed, Y failed, Z warnings
- Critical issues: N

### 🔴 Critical Issues (must fix)

#### Issue 1: [Component] - [Problem]
- **What happened:** [Description]
- **Expected:** [What should happen]
- **Screenshot:** [link]
- **Suggested fix:**
  ```jsx
  // Before
  <Button onClick={...}>
  
  // After  
  <Button onClick={...} disabled={isLoading}>
  ```

### 🟡 Warnings (should fix)

#### Warning 1: [Component] - [Problem]
- **What:** [Description]
- **Why it matters:** [Impact]
- **Suggested fix:** [Solution]

### 🟢 Passed Tests
- [Test name]: [Brief description]

### 📊 Performance Notes
- Initial load: Xs
- Message send: Xs
- [Other metrics]

### 🔍 Observations
- [Any UX issues noticed]
- [Potential improvements]
```

---

## Chatbot-Specific Test Scenarios

### 1. Message Input Tests

```python
async def test_message_input(page):
    input_el = page.locator('textarea, input[type="text"]').first
    
    # Test 1: Empty submit
    await input_el.fill('')
    await page.click('[type="submit"], button:has-text("Send")')
    # Should: not submit OR show validation
    
    # Test 2: Normal message
    await input_el.fill('Hello, this is a test message')
    await page.click('button:has-text("Send")')
    # Should: message appears in chat
    
    # Test 3: Long message (1000+ chars)
    await input_el.fill('x' * 1000)
    # Should: handle gracefully (scroll, truncate, or accept)
    
    # Test 4: Special characters
    await input_el.fill('<script>alert("xss")</script>')
    # Should: escape/sanitize, not execute
    
    # Test 5: Emoji
    await input_el.fill('Test 👍 emoji 🎉')
    # Should: render correctly
    
    # Test 6: Enter key submit
    await input_el.fill('Test enter')
    await input_el.press('Enter')
    # Should: submit (or Shift+Enter for newline)
```

### 2. Message Display Tests

```python
async def test_message_display(page):
    # Send a message first
    await send_message(page, 'Test message')
    
    # Test 1: Message appears
    await expect(page.locator('.message')).to_contain_text('Test message')
    
    # Test 2: Correct sender (user vs bot)
    user_msg = page.locator('.message.user, .message[data-sender="user"]')
    await expect(user_msg).to_be_visible()
    
    # Test 3: Timestamp present
    # (if applicable)
    
    # Test 4: Message order
    messages = await page.locator('.message').all_text_contents()
    # Should: be in chronological order
    
    # Test 5: Auto-scroll
    # Send multiple messages, should scroll to bottom
```

### 3. Loading State Tests

```python
async def test_loading_states(page):
    # Intercept API to add delay
    await page.route('**/api/**', lambda route: 
        asyncio.sleep(2).then(route.continue_())
    )
    
    await send_message(page, 'Test')
    
    # Test 1: Loading indicator appears
    await expect(page.locator('.loading, [aria-busy="true"]')).to_be_visible()
    
    # Test 2: Input disabled during loading
    input_el = page.locator('textarea, input[type="text"]').first
    # Should: be disabled OR button disabled
    
    # Test 3: Loading disappears after response
    await expect(page.locator('.loading')).not_to_be_visible(timeout=10000)
```

### 4. Error Handling Tests

```python
async def test_error_handling(page):
    # Mock API error
    await page.route('**/api/**', lambda route: route.fulfill(
        status=500,
        body='Server Error'
    ))
    
    await send_message(page, 'Test')
    
    # Test 1: Error message shown
    await expect(page.locator('.error, [role="alert"]')).to_be_visible()
    
    # Test 2: User can retry
    retry_btn = page.locator('button:has-text("Retry"), button:has-text("Try again")')
    if await retry_btn.count() > 0:
        await retry_btn.click()
        # Should: retry the request
    
    # Test 3: Error can be dismissed
    # Test 4: Previous messages still visible
```

### 5. Responsive Tests

```python
async def test_responsive(page):
    viewports = [
        {'width': 1920, 'height': 1080, 'name': 'Desktop'},
        {'width': 768, 'height': 1024, 'name': 'Tablet'},
        {'width': 375, 'height': 667, 'name': 'Mobile'},
    ]
    
    for vp in viewports:
        await page.set_viewport_size(vp)
        await page.reload()
        
        # Test: All elements visible and usable
        await expect(page.locator('textarea, input')).to_be_visible()
        await expect(page.locator('button:has-text("Send")')).to_be_visible()
        
        # Test: No horizontal overflow
        scroll_width = await page.evaluate('document.body.scrollWidth')
        assert scroll_width <= vp['width']
        
        # Screenshot for comparison
        await page.screenshot(path=f"responsive_{vp['name']}.png")
```

---

## Feedback Templates

### Critical Issue Template

```markdown
#### 🔴 [Element]: [Short problem description]

**Reproduction:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:** [What should happen]

**Actual:** [What happened]

**Evidence:**
- Screenshot: [attached]
- Console error: `[error message if any]`

**Suggested Fix:**
```[language]
// Problem code
[code that causes issue]

// Fixed code
[corrected code]
```

**Priority:** Critical - blocks user flow
```

### Warning Template

```markdown
#### 🟡 [Element]: [Short problem description]

**Issue:** [Description]

**Impact:** [Why it matters to users]

**Suggestion:** [How to improve]

**Priority:** Medium - doesn't block but degrades UX
```

---

## Integration with Claude Code

When called as subagent:

```
INPUT:
- App URL
- Changed files (optional, for context)
- Specific areas to test (optional)

OUTPUT:
- Structured test report (markdown)
- List of issues with fixes
- Screenshots of problems
- Pass/fail status
```

The main agent should:
1. Call this subagent after making changes
2. Review the feedback
3. Apply suggested fixes
4. Re-run tests until passing

See [references/feedback-examples.md](references/feedback-examples.md) for real feedback examples.
See [references/selector-strategies.md](references/selector-strategies.md) for finding elements.
