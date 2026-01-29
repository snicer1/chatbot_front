# Selector Strategies

How to reliably find elements in React chatbot UIs without predefined test IDs.

## Priority Order

When finding elements, try in this order:

1. **Role + accessible name** (most reliable)
2. **Semantic HTML elements**
3. **Text content**
4. **CSS classes** (least reliable, but often necessary)

## Chat Input Detection

```python
# Strategy 1: Role-based
input_selectors = [
    '[role="textbox"]',
    'textarea',
    'input[type="text"]',
    'input:not([type="hidden"]):not([type="submit"])',
]

# Strategy 2: Placeholder text
input_by_placeholder = [
    '[placeholder*="message" i]',
    '[placeholder*="type" i]',
    '[placeholder*="chat" i]',
    '[placeholder*="ask" i]',
]

# Strategy 3: Position (last resort)
# Usually the main input is at bottom of chat container
'[class*="chat"] textarea',
'[class*="chat"] input',

# Combined approach
async def find_chat_input(page):
    for selector in input_selectors + input_by_placeholder:
        el = page.locator(selector)
        if await el.count() > 0 and await el.first.is_visible():
            return el.first
    
    # Fallback: find by structure
    # Input near a "Send" button
    send_btn = await find_send_button(page)
    if send_btn:
        parent = page.locator(f'{await get_selector(send_btn)} >> xpath=..')
        input_el = parent.locator('textarea, input')
        if await input_el.count() > 0:
            return input_el.first
    
    return None
```

## Send Button Detection

```python
send_button_selectors = [
    # By text content
    'button:has-text("Send")',
    'button:has-text("Submit")',
    'button:has-text("Wyślij")',  # Polish
    
    # By type
    'button[type="submit"]',
    'input[type="submit"]',
    
    # By icon (common patterns)
    'button:has(svg)',  # Icon button
    'button[aria-label*="send" i]',
    'button[aria-label*="submit" i]',
    
    # By class (common names)
    '[class*="send"]',
    '[class*="submit"]',
]

async def find_send_button(page):
    for selector in send_button_selectors:
        el = page.locator(selector)
        if await el.count() > 0:
            visible = await el.first.is_visible()
            if visible:
                return el.first
    return None
```

## Message Container Detection

```python
message_container_selectors = [
    # By role
    '[role="log"]',
    '[role="list"]',
    '[aria-live="polite"]',
    
    # By common classes
    '[class*="messages"]',
    '[class*="chat-history"]',
    '[class*="conversation"]',
    '[class*="thread"]',
    
    # By structure (container with multiple similar children)
]

async def find_message_container(page):
    # Look for scrollable container with multiple children
    containers = await page.evaluate('''() => {
        const candidates = document.querySelectorAll('[class*="message"], [class*="chat"]');
        return Array.from(candidates)
            .filter(el => {
                const style = getComputedStyle(el);
                const hasScroll = style.overflowY === 'auto' || style.overflowY === 'scroll';
                const hasChildren = el.children.length > 2;
                return hasScroll && hasChildren;
            })
            .map(el => getUniqueSelector(el));
    }''')
    
    if containers:
        return page.locator(containers[0])
    return None
```

## Individual Message Detection

```python
async def find_messages(page):
    # Find container first
    container = await find_message_container(page)
    
    if container:
        # Messages are usually repeated elements
        # Find the repeated pattern
        children = await container.evaluate('''el => {
            const childClasses = Array.from(el.children).map(c => c.className);
            // Find most common class pattern
            const counts = {};
            childClasses.forEach(c => counts[c] = (counts[c] || 0) + 1);
            const mostCommon = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])[0];
            return mostCommon ? mostCommon[0] : null;
        }''')
        
        if children:
            return container.locator(f'.{children.split(" ")[0]}')
    
    # Fallback: common patterns
    message_selectors = [
        '[class*="message"]:not([class*="messages"])',
        '[class*="bubble"]',
        '[class*="chat-item"]',
    ]
    
    for selector in message_selectors:
        msgs = page.locator(selector)
        if await msgs.count() > 0:
            return msgs
    
    return None
```

## User vs Bot Message Detection

```python
async def classify_messages(page, messages):
    """Classify messages as user or bot"""
    classified = []
    
    count = await messages.count()
    for i in range(count):
        msg = messages.nth(i)
        
        # Check for explicit markers
        data_sender = await msg.get_attribute('data-sender')
        if data_sender:
            classified.append({'type': data_sender, 'el': msg})
            continue
        
        # Check class names
        class_name = await msg.get_attribute('class') or ''
        if any(x in class_name.lower() for x in ['user', 'human', 'self', 'outgoing']):
            classified.append({'type': 'user', 'el': msg})
        elif any(x in class_name.lower() for x in ['bot', 'ai', 'assistant', 'incoming']):
            classified.append({'type': 'bot', 'el': msg})
        else:
            # Check position/alignment
            box = await msg.bounding_box()
            parent_box = await msg.evaluate('el => el.parentElement.getBoundingClientRect()')
            
            # Right-aligned usually = user
            if box['x'] > parent_box['width'] / 2:
                classified.append({'type': 'user', 'el': msg})
            else:
                classified.append({'type': 'bot', 'el': msg})
    
    return classified
```

## Loading Indicator Detection

```python
loading_selectors = [
    # By ARIA
    '[aria-busy="true"]',
    '[aria-live="polite"]:has([class*="loading"])',
    
    # By common classes
    '[class*="loading"]',
    '[class*="spinner"]',
    '[class*="typing"]',
    '[class*="dots"]',
    
    # By animation
    # (element with CSS animation)
]

async def find_loading_indicator(page):
    for selector in loading_selectors:
        el = page.locator(selector)
        if await el.count() > 0 and await el.first.is_visible():
            return el.first
    
    # Check for animated elements
    animated = await page.evaluate('''() => {
        return Array.from(document.querySelectorAll('*'))
            .filter(el => {
                const style = getComputedStyle(el);
                return style.animation !== 'none' || 
                       style.animationName !== 'none';
            })
            .map(el => getUniqueSelector(el));
    }''')
    
    if animated:
        return page.locator(animated[0])
    
    return None
```

## Error Message Detection

```python
error_selectors = [
    '[role="alert"]',
    '[aria-live="assertive"]',
    '[class*="error"]',
    '[class*="alert"]',
    '[class*="warning"]',
    '.toast',
    '.notification',
]

async def find_error_message(page):
    for selector in error_selectors:
        el = page.locator(selector)
        if await el.count() > 0 and await el.first.is_visible():
            text = await el.first.text_content()
            if text and len(text.strip()) > 0:
                return el.first
    return None
```

## Unique Selector Generator

```javascript
// Inject this into page for generating selectors
function getUniqueSelector(el) {
    if (el.id) return `#${el.id}`;
    
    if (el.getAttribute('data-testid')) {
        return `[data-testid="${el.getAttribute('data-testid')}"]`;
    }
    
    // Build path
    const path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        
        if (el.id) {
            selector = `#${el.id}`;
            path.unshift(selector);
            break;
        }
        
        const classes = Array.from(el.classList)
            .filter(c => !c.match(/^(active|selected|hover|focus)/))
            .slice(0, 2);
        
        if (classes.length) {
            selector += '.' + classes.join('.');
        }
        
        // Add nth-child if needed
        const siblings = el.parentNode ? 
            Array.from(el.parentNode.children).filter(s => s.nodeName === el.nodeName) : [];
        if (siblings.length > 1) {
            const index = siblings.indexOf(el) + 1;
            selector += `:nth-child(${index})`;
        }
        
        path.unshift(selector);
        el = el.parentNode;
    }
    
    return path.join(' > ');
}
```

## Best Practices

1. **Always verify visibility** - Element might exist but be hidden
2. **Use multiple strategies** - Don't rely on single selector
3. **Log what you find** - Helps debugging when tests fail
4. **Handle dynamic content** - Wait for elements, handle loading states
5. **Avoid fragile selectors** - Classes like `css-1a2b3c` change often
