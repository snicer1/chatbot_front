#!/usr/bin/env python3
"""
E2E Test Agent - Dynamic chatbot testing

This agent dynamically explores and tests a React chatbot UI,
generating tests based on what it discovers.

Usage:
    python e2e_agent.py --url <app_url> [--verbose]
"""

import asyncio
import argparse
import json
import time
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from enum import Enum

try:
    from playwright.async_api import async_playwright, Page, expect
except ImportError:
    print("Install playwright: pip install playwright && playwright install")
    exit(1)


class Severity(Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


@dataclass
class Issue:
    severity: Severity
    component: str
    title: str
    description: str
    expected: str
    actual: str
    screenshot: Optional[str] = None
    suggested_fix: Optional[str] = None
    
    def to_markdown(self) -> str:
        icon = "🔴" if self.severity == Severity.CRITICAL else "🟡" if self.severity == Severity.WARNING else "ℹ️"
        
        md = f"""#### {icon} {self.component}: {self.title}

**What happened:** {self.description}

**Expected:** {self.expected}

**Actual:** {self.actual}
"""
        if self.screenshot:
            md += f"\n**Screenshot:** {self.screenshot}\n"
        
        if self.suggested_fix:
            md += f"\n**Suggested Fix:**\n```jsx\n{self.suggested_fix}\n```\n"
        
        return md


@dataclass
class TestResult:
    name: str
    passed: bool
    duration: float
    issue: Optional[Issue] = None


@dataclass 
class DiscoveredElements:
    chat_input: Optional[str] = None
    send_button: Optional[str] = None
    message_container: Optional[str] = None
    message_selector: Optional[str] = None
    loading_indicator: Optional[str] = None
    error_container: Optional[str] = None


class E2ETestAgent:
    def __init__(self, base_url: str, output_dir: str = "./test-results"):
        self.base_url = base_url.rstrip('/')
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.console_errors: List[str] = []
        self.network_requests: List[Dict] = []
        self.discovered = DiscoveredElements()
        self.results: List[TestResult] = []
        self.issues: List[Issue] = []
        self.verbose = False
    
    def log(self, msg: str):
        if self.verbose:
            print(f"  [agent] {msg}")
    
    async def setup_page(self, page: Page):
        """Setup event listeners"""
        page.on('console', lambda msg: 
            self.console_errors.append(msg.text) if msg.type == 'error' else None)
        page.on('pageerror', lambda exc: 
            self.console_errors.append(str(exc)))
        page.on('request', lambda req: 
            self.network_requests.append({
                'url': req.url, 
                'method': req.method,
                'time': time.time()
            }) if '/api' in req.url else None)
    
    async def screenshot(self, page: Page, name: str) -> str:
        path = self.output_dir / f"{name}_{int(time.time())}.png"
        await page.screenshot(path=str(path), full_page=True)
        return str(path)
    
    # ==================
    # DISCOVERY PHASE
    # ==================
    
    async def discover_elements(self, page: Page):
        """Discover UI elements dynamically"""
        self.log("Starting element discovery...")
        
        # Find chat input
        self.discovered.chat_input = await self._find_input(page)
        self.log(f"Chat input: {self.discovered.chat_input}")
        
        # Find send button
        self.discovered.send_button = await self._find_send_button(page)
        self.log(f"Send button: {self.discovered.send_button}")
        
        # Find message container
        self.discovered.message_container = await self._find_message_container(page)
        self.log(f"Message container: {self.discovered.message_container}")
        
        # Find individual message selector
        if self.discovered.message_container:
            self.discovered.message_selector = await self._find_message_pattern(page)
            self.log(f"Message pattern: {self.discovered.message_selector}")
    
    async def _find_input(self, page: Page) -> Optional[str]:
        selectors = [
            'textarea',
            'input[type="text"]',
            '[role="textbox"]',
            '[placeholder*="message" i]',
            '[placeholder*="type" i]',
            '[class*="input"]',
        ]
        
        for sel in selectors:
            try:
                el = page.locator(sel).first
                if await el.count() > 0 and await el.is_visible():
                    return sel
            except:
                continue
        return None
    
    async def _find_send_button(self, page: Page) -> Optional[str]:
        selectors = [
            'button[type="submit"]',
            'button:has-text("Send")',
            'button:has-text("Wyślij")',
            'button:has-text("Submit")',
            '[class*="send"]',
            'button:has(svg)',  # Icon button
        ]
        
        for sel in selectors:
            try:
                el = page.locator(sel).first
                if await el.count() > 0 and await el.is_visible():
                    return sel
            except:
                continue
        return None
    
    async def _find_message_container(self, page: Page) -> Optional[str]:
        selectors = [
            '[role="log"]',
            '[class*="messages"]',
            '[class*="chat-history"]',
            '[class*="conversation"]',
        ]
        
        for sel in selectors:
            try:
                el = page.locator(sel).first
                if await el.count() > 0:
                    return sel
            except:
                continue
        
        # Try to find scrollable container
        result = await page.evaluate('''() => {
            const elements = document.querySelectorAll('div, section, main');
            for (const el of elements) {
                const style = getComputedStyle(el);
                if ((style.overflowY === 'auto' || style.overflowY === 'scroll') 
                    && el.children.length > 2) {
                    if (el.id) return '#' + el.id;
                    if (el.className) return '.' + el.className.split(' ')[0];
                }
            }
            return null;
        }''')
        
        return result
    
    async def _find_message_pattern(self, page: Page) -> Optional[str]:
        if not self.discovered.message_container:
            return None
        
        # Find repeated child pattern
        pattern = await page.evaluate(f'''() => {{
            const container = document.querySelector('{self.discovered.message_container}');
            if (!container) return null;
            
            const children = Array.from(container.children);
            if (children.length < 2) return null;
            
            // Find common class among children
            const classes = children.map(c => c.className.split(' ')[0]).filter(c => c);
            const counts = {{}};
            classes.forEach(c => counts[c] = (counts[c] || 0) + 1);
            
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            if (sorted.length > 0 && sorted[0][1] > 1) {{
                return '.' + sorted[0][0];
            }}
            return null;
        }}''')
        
        return pattern
    
    # ==================
    # TEST EXECUTION
    # ==================
    
    async def run_test(self, page: Page, name: str, test_fn) -> TestResult:
        start = time.time()
        try:
            issue = await test_fn(page)
            passed = issue is None
            if issue:
                self.issues.append(issue)
            return TestResult(name=name, passed=passed, duration=time.time()-start, issue=issue)
        except Exception as e:
            issue = Issue(
                severity=Severity.CRITICAL,
                component="Test",
                title=f"Test crashed: {name}",
                description=str(e),
                expected="Test should complete",
                actual=f"Exception: {e}",
                screenshot=await self.screenshot(page, f"crash_{name}")
            )
            self.issues.append(issue)
            return TestResult(name=name, passed=False, duration=time.time()-start, issue=issue)
    
    async def send_test_message(self, page: Page, text: str) -> bool:
        """Helper to send a message"""
        if not self.discovered.chat_input or not self.discovered.send_button:
            return False
        
        await page.locator(self.discovered.chat_input).first.fill(text)
        await page.locator(self.discovered.send_button).first.click()
        await page.wait_for_timeout(500)
        return True
    
    # ==================
    # INDIVIDUAL TESTS
    # ==================
    
    async def test_page_loads(self, page: Page) -> Optional[Issue]:
        """Test that page loads without critical errors"""
        self.console_errors.clear()
        await page.goto(self.base_url, wait_until='networkidle')
        await page.wait_for_timeout(1000)
        
        critical = [e for e in self.console_errors 
                   if 'uncaught' in e.lower() or 'error' in e.lower()]
        
        if critical:
            return Issue(
                severity=Severity.CRITICAL,
                component="App",
                title="Console errors on load",
                description=f"Found {len(critical)} error(s) in console",
                expected="No console errors",
                actual="\n".join(critical[:3]),
                screenshot=await self.screenshot(page, "console_errors")
            )
        return None
    
    async def test_elements_found(self, page: Page) -> Optional[Issue]:
        """Test that all required elements were discovered"""
        await self.discover_elements(page)
        
        missing = []
        if not self.discovered.chat_input:
            missing.append("chat input")
        if not self.discovered.send_button:
            missing.append("send button")
        
        if missing:
            return Issue(
                severity=Severity.CRITICAL,
                component="UI",
                title="Missing required elements",
                description=f"Could not find: {', '.join(missing)}",
                expected="All chat elements should be present",
                actual=f"Missing: {missing}",
                screenshot=await self.screenshot(page, "missing_elements"),
                suggested_fix="Ensure chat input and send button are visible on page load"
            )
        return None
    
    async def test_send_message(self, page: Page) -> Optional[Issue]:
        """Test basic message sending"""
        if not self.discovered.chat_input:
            return None
        
        initial_msgs = 0
        if self.discovered.message_selector:
            initial_msgs = await page.locator(self.discovered.message_selector).count()
        
        success = await self.send_test_message(page, "Test message from E2E agent")
        
        if not success:
            return Issue(
                severity=Severity.CRITICAL,
                component="Send",
                title="Cannot send message",
                description="Failed to send test message",
                expected="Message should be sent",
                actual="Send operation failed",
                screenshot=await self.screenshot(page, "send_fail")
            )
        
        # Wait for response
        await page.wait_for_timeout(2000)
        
        # Check if message appeared
        if self.discovered.message_selector:
            new_count = await page.locator(self.discovered.message_selector).count()
            if new_count <= initial_msgs:
                return Issue(
                    severity=Severity.CRITICAL,
                    component="Messages",
                    title="Message not appearing",
                    description="Sent message but it doesn't appear in chat",
                    expected="Message should appear after sending",
                    actual=f"Message count unchanged ({initial_msgs})",
                    screenshot=await self.screenshot(page, "msg_not_appearing"),
                    suggested_fix="""// Ensure message is added to state after sending
const handleSend = async () => {
  const userMsg = { text: message, sender: 'user' };
  setMessages(prev => [...prev, userMsg]);
  // ... send to API
};"""
                )
        
        return None
    
    async def test_empty_submit(self, page: Page) -> Optional[Issue]:
        """Test that empty message cannot be submitted"""
        if not self.discovered.chat_input:
            return None
        
        await page.locator(self.discovered.chat_input).first.fill('')
        
        # Try to submit
        if self.discovered.send_button:
            btn = page.locator(self.discovered.send_button).first
            is_disabled = await btn.is_disabled()
            
            if not is_disabled:
                # Button not disabled, click it
                self.network_requests.clear()
                await btn.click()
                await page.wait_for_timeout(500)
                
                # Check if API was called (shouldn't be)
                api_calls = [r for r in self.network_requests if '/api' in r['url']]
                if api_calls:
                    return Issue(
                        severity=Severity.WARNING,
                        component="Validation",
                        title="Empty message submitted",
                        description="API was called with empty message",
                        expected="Empty messages should be blocked",
                        actual="API request made",
                        suggested_fix="""// Disable send on empty
<button 
  disabled={!message.trim()}
  onClick={handleSend}
>Send</button>"""
                    )
        
        return None
    
    async def test_keyboard_submit(self, page: Page) -> Optional[Issue]:
        """Test Enter key submits message"""
        if not self.discovered.chat_input:
            return None
        
        input_el = page.locator(self.discovered.chat_input).first
        await input_el.fill('Keyboard test')
        
        initial_count = 0
        if self.discovered.message_selector:
            initial_count = await page.locator(self.discovered.message_selector).count()
        
        await input_el.press('Enter')
        await page.wait_for_timeout(1000)
        
        # Check if submitted
        if self.discovered.message_selector:
            new_count = await page.locator(self.discovered.message_selector).count()
            if new_count == initial_count:
                return Issue(
                    severity=Severity.WARNING,
                    component="Input",
                    title="Enter key doesn't submit",
                    description="Pressing Enter doesn't send message",
                    expected="Enter should submit, Shift+Enter for newline",
                    actual="Nothing happened on Enter",
                    suggested_fix="""const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};

<textarea onKeyDown={handleKeyDown} />"""
                )
        
        return None
    
    async def test_special_characters(self, page: Page) -> Optional[Issue]:
        """Test XSS and special character handling"""
        if not self.discovered.chat_input:
            return None
        
        xss_payload = '<script>alert("xss")</script>'
        await self.send_test_message(page, xss_payload)
        await page.wait_for_timeout(1000)
        
        # Check if script tag is rendered as text (good) or executed (bad)
        page_content = await page.content()
        
        if '<script>alert' in page_content and 'xss' in page_content:
            # Script tag is in DOM - potential XSS
            # Check if it's escaped
            escaped = '&lt;script&gt;' in page_content or '&lt;script' in page_content
            if not escaped:
                return Issue(
                    severity=Severity.CRITICAL,
                    component="Security",
                    title="Potential XSS vulnerability",
                    description="Script tags may not be properly escaped",
                    expected="HTML should be escaped",
                    actual="Raw HTML in DOM",
                    screenshot=await self.screenshot(page, "xss_check"),
                    suggested_fix="""// Use React's default escaping (no dangerouslySetInnerHTML)
<div>{message}</div>

// If HTML needed, use sanitizer:
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(message)}} />"""
                )
        
        return None
    
    async def test_loading_state(self, page: Page) -> Optional[Issue]:
        """Test that loading indicator appears during API call"""
        if not self.discovered.chat_input:
            return None
        
        # Slow down API to observe loading
        await page.route('**/api/**', lambda route: 
            asyncio.create_task(self._delayed_route(route, 2000)))
        
        # Send message and immediately check for loading
        await page.locator(self.discovered.chat_input).first.fill('Loading test')
        await page.locator(self.discovered.send_button).first.click()
        
        # Look for loading indicator
        loading_selectors = [
            '[aria-busy="true"]',
            '[class*="loading"]',
            '[class*="spinner"]',
            '[class*="typing"]',
        ]
        
        found_loading = False
        for sel in loading_selectors:
            try:
                if await page.locator(sel).count() > 0:
                    found_loading = True
                    break
            except:
                continue
        
        # Also check if button is disabled
        if self.discovered.send_button:
            btn_disabled = await page.locator(self.discovered.send_button).first.is_disabled()
            found_loading = found_loading or btn_disabled
        
        await page.unroute('**/api/**')
        await page.wait_for_timeout(2500)
        
        if not found_loading:
            return Issue(
                severity=Severity.WARNING,
                component="UX",
                title="No loading indicator",
                description="No visual feedback during API request",
                expected="Loading spinner or disabled button",
                actual="No loading state visible",
                suggested_fix="""const [isLoading, setIsLoading] = useState(false);

{isLoading && <Spinner />}
<button disabled={isLoading}>
  {isLoading ? 'Sending...' : 'Send'}
</button>"""
            )
        
        return None
    
    async def _delayed_route(self, route, delay_ms):
        await asyncio.sleep(delay_ms / 1000)
        await route.continue_()
    
    async def test_responsive(self, page: Page) -> Optional[Issue]:
        """Test mobile responsiveness"""
        viewports = [
            {'width': 375, 'height': 667, 'name': 'mobile'},
            {'width': 768, 'height': 1024, 'name': 'tablet'},
        ]
        
        issues_found = []
        
        for vp in viewports:
            await page.set_viewport_size({'width': vp['width'], 'height': vp['height']})
            await page.reload()
            await page.wait_for_timeout(500)
            
            # Check horizontal scroll
            scroll_width = await page.evaluate('document.documentElement.scrollWidth')
            if scroll_width > vp['width'] + 10:
                issues_found.append(f"{vp['name']}: horizontal scroll ({scroll_width}px)")
            
            # Check input visibility
            if self.discovered.chat_input:
                try:
                    visible = await page.locator(self.discovered.chat_input).first.is_visible()
                    if not visible:
                        issues_found.append(f"{vp['name']}: input not visible")
                except:
                    issues_found.append(f"{vp['name']}: input error")
        
        # Reset viewport
        await page.set_viewport_size({'width': 1280, 'height': 720})
        
        if issues_found:
            return Issue(
                severity=Severity.WARNING,
                component="Layout",
                title="Responsive issues",
                description="\n".join(issues_found),
                expected="UI should work on all screen sizes",
                actual="Layout problems on smaller screens",
                screenshot=await self.screenshot(page, "responsive"),
                suggested_fix=""".container {
  width: 100%;
  max-width: 600px;
  padding: 0 16px;
  box-sizing: border-box;
}

.input {
  width: 100%;
}"""
            )
        
        return None
    
    # ==================
    # MAIN EXECUTION
    # ==================
    
    async def run_all_tests(self, page: Page) -> List[TestResult]:
        """Run all tests"""
        tests = [
            ("Page loads", self.test_page_loads),
            ("Elements found", self.test_elements_found),
            ("Send message", self.test_send_message),
            ("Empty submit blocked", self.test_empty_submit),
            ("Keyboard submit", self.test_keyboard_submit),
            ("Special characters", self.test_special_characters),
            ("Loading state", self.test_loading_state),
            ("Responsive layout", self.test_responsive),
        ]
        
        for name, test_fn in tests:
            result = await self.run_test(page, name, test_fn)
            self.results.append(result)
            
            icon = "✅" if result.passed else "❌"
            print(f"  {icon} {name}")
        
        return self.results
    
    def generate_report(self) -> str:
        """Generate markdown report"""
        passed = sum(1 for r in self.results if r.passed)
        failed = len(self.results) - passed
        
        critical = [i for i in self.issues if i.severity == Severity.CRITICAL]
        warnings = [i for i in self.issues if i.severity == Severity.WARNING]
        
        report = f"""# E2E Test Report

**URL:** {self.base_url}
**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M')}

## Summary

| Metric | Value |
|--------|-------|
| Total tests | {len(self.results)} |
| ✅ Passed | {passed} |
| ❌ Failed | {failed} |
| 🔴 Critical | {len(critical)} |
| 🟡 Warnings | {len(warnings)} |

**Status: {'PASS ✅' if failed == 0 else 'FAIL ❌'}**

"""
        
        if critical:
            report += "## 🔴 Critical Issues\n\n"
            for issue in critical:
                report += issue.to_markdown() + "\n"
        
        if warnings:
            report += "## 🟡 Warnings\n\n"
            for issue in warnings:
                report += issue.to_markdown() + "\n"
        
        report += "## ✅ Passed Tests\n\n"
        for r in self.results:
            if r.passed:
                report += f"- {r.name} ({r.duration:.2f}s)\n"
        
        if critical or warnings:
            report += "\n## Recommended Fix Order\n\n"
            for i, issue in enumerate(critical + warnings, 1):
                icon = "🔴" if issue.severity == Severity.CRITICAL else "🟡"
                report += f"{i}. {icon} {issue.component}: {issue.title}\n"
        
        return report


async def main():
    parser = argparse.ArgumentParser(description='E2E Test Agent')
    parser.add_argument('--url', required=True, help='App URL to test')
    parser.add_argument('--verbose', '-v', action='store_true')
    parser.add_argument('--output', default='./test-results')
    args = parser.parse_args()
    
    print(f"\n🤖 E2E Test Agent")
    print(f"   URL: {args.url}\n")
    
    agent = E2ETestAgent(args.url, args.output)
    agent.verbose = args.verbose
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await agent.setup_page(page)
        
        print("Running tests...")
        await agent.run_all_tests(page)
        
        await browser.close()
    
    # Generate and save report
    report = agent.generate_report()
    report_path = Path(args.output) / f"report_{int(time.time())}.md"
    report_path.write_text(report)
    
    print(f"\n{'='*50}")
    print(report)
    print(f"\n📄 Report saved: {report_path}")
    
    # Exit code
    failed = sum(1 for r in agent.results if not r.passed)
    exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    asyncio.run(main())
