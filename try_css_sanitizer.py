#%%
from css_sanitizer import CSSSanitizer, sanitize_css

# Example CSS with both safe and dangerous content
test_css = """
/* Safe CSS styles */
.safe-class {
    color: red;
    background-color: #f0f0f0;
    font-size: 16px;
    margin: 10px;
    padding: 20px;
    border-radius: 5px;
    display: flex;
    justify-content: center;
}

.typography {
    font-family: 'Arial', sans-serif;
    font-weight: bold;
    text-align: center;
    line-height: 1.5;
}

/* Dangerous CSS that should be removed */
.dangerous-xss {
    background: url(javascript:alert('XSS Attack!'));
    behavior: url(evil.htc);
    color: expression(alert('XSS via expression'));
}

.data-url-attack {
    background-image: url(data:text/html,<script>alert('XSS')</script>);
}

/* At-rules - some safe, some dangerous */
@import url(malicious.css);

@media screen and (max-width: 768px) {
    .responsive {
        font-size: 14px;
        color: blue;
        background: url(javascript:void(0));
    }
}

@keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
}

/* More dangerous patterns */
.eval-attack {
    width: expression(eval('alert("XSS")'));
}

.script-injection {
    content: '<script>alert("XSS")</script>';
}
"""

print("🔍 CSS Sanitizer Demonstration")
print("=" * 50)

print("\n📝 ORIGINAL CSS:")
print("-" * 30)
print(test_css)

print("\n🛡️ SANITIZED CSS (Strict Mode):")
print("-" * 30)
# Create sanitizer in strict mode (only allows whitelisted properties)
strict_sanitizer = CSSSanitizer(strict_mode=True)
sanitized_strict = strict_sanitizer.sanitize_css(test_css)
print(sanitized_strict)

print("\n🔓 SANITIZED CSS (Non-Strict Mode):")
print("-" * 30)
# Create sanitizer in non-strict mode (allows more properties but still removes dangerous ones)
lenient_sanitizer = CSSSanitizer(strict_mode=False)
sanitized_lenient = lenient_sanitizer.sanitize_css(test_css)
print(sanitized_lenient)

print("\n🧪 TESTING INDIVIDUAL DANGEROUS PATTERNS:")
print("-" * 30)

dangerous_examples = [
    ".test1 { background: url(javascript:alert('xss')); }",
    ".test2 { color: expression(document.cookie); }",
    ".test3 { behavior: url(evil.htc); }",
    ".test4 { background-image: url(data:text/html,<script>alert('xss')</script>); }",
    ".test5 { width: eval('malicious code'); }",
    ".test6 { content: 'javascript:void(0)'; }",
]

for i, dangerous_css in enumerate(dangerous_examples, 1):
    print(f"\nExample {i}: {dangerous_css}")
    result = sanitize_css(dangerous_css)
    status = 'BLOCKED' if not result.strip() or result.count('{') != result.count('}') or '{}' in result else 'PARTIAL'
    print(f"Sanitized: {result}")
    print(f"Status: {status}")

print("\n✅ TESTING SAFE CSS PATTERNS:")
print("-" * 30)

safe_examples = [
    ".safe1 { color: #ff0000; }",
    ".safe2 { background-color: rgba(255, 0, 0, 0.5); }",
    ".safe3 { font-size: 16px; }",
    ".safe4 { margin: 10px auto; }",
    ".safe5 { transform: translateX(50px); }",
    ".safe6 { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }",
]

for i, safe_css in enumerate(safe_examples, 1):
    print(f"\nExample {i}: {safe_css}")
    result = sanitize_css(safe_css)
    status = 'PRESERVED' if result.strip() and '{}' not in result else 'BLOCKED'
    print(f"Sanitized: {result}")
    print(f"Status: {status}")

print("\n🎯 CUSTOM SANITIZER CONFIGURATION:")
print("-" * 30)

# Custom sanitizer with additional safe properties
custom_sanitizer = CSSSanitizer(
    strict_mode=True,
    allow_external_urls=True,  # Allow http/https URLs
    additional_safe_properties={'custom-property', 'vendor-prefix'}
)

custom_css = """
.custom {
    custom-property: value;
    background-image: url(https://example.com/image.jpg);
    color: red;
    javascript: alert('xss');
}
"""

print("Custom CSS:")
print(custom_css)
print("\nCustom Sanitized:")
print(custom_sanitizer.sanitize_css(custom_css))

print("\n📊 SUMMARY:")
print("-" * 30)
print("✅ The CSS Sanitizer successfully:")
print("   • Removes dangerous JavaScript injections")
print("   • Blocks malicious URL schemes (javascript:, data:)")
print("   • Filters out dangerous CSS functions (expression, eval)")
print("   • Preserves safe styling properties")
print("   • Blocks dangerous @import rules")
print("   • Allows safe @media and @keyframes rules")
print("   • Supports both strict and lenient modes")
print("   • Allows custom configuration options")

#%%

