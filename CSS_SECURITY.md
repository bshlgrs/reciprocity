# CSS Security and Sanitization

This application now includes CSS sanitization to protect against malicious CSS injection attacks when users update their custom CSS or when global CSS is updated.

## Security Features

### CSS Sanitizer
The `css_sanitizer.py` module provides comprehensive protection against dangerous CSS constructs:

#### Blocked Dangerous Properties
- `expression` - IE expression() attacks
- `behavior` - IE behavior attacks  
- `javascript` - JavaScript URLs
- `vbscript` - VBScript URLs
- `data` - Data URLs (can contain scripts)
- `@import` - Can load external malicious CSS

#### Blocked Dangerous Functions
- `expression()`
- `javascript:`
- `vbscript:`
- `eval()`
- `alert()`
- Other script execution functions

#### URL Security
- Blocks `javascript:`, `vbscript:`, `data:` URL schemes
- Optionally blocks external HTTP(S) URLs
- Validates URL content for script injection attempts

#### Property Whitelisting
In strict mode, only allows safe CSS properties like:
- Layout: `display`, `position`, `margin`, `padding`, etc.
- Typography: `font-family`, `color`, `text-align`, etc.
- Visual: `background`, `border`, `opacity`, etc.
- Modern layout: `flexbox`, `grid` properties

## Implementation

### Where Sanitization Occurs
CSS sanitization is applied in three places:

1. **Individual User CSS** - When users update their `custom_css` via `/api/update_user`
2. **Global CSS (Manual)** - When global CSS is set via `/api/update_user` with global CSS enabled
3. **Global CSS (Generated)** - When CSS is generated via AI in `/api/generate_css`

### Configuration
```python
# Non-strict mode (allows more properties but still blocks dangerous content)
sanitize_css(css_string, strict_mode=False)

# Strict mode (only allows whitelisted properties)
sanitize_css(css_string, strict_mode=True)
```

## Example

### Before Sanitization
```css
.user-style {
    color: red;
    background: url(javascript:alert('XSS'));
    behavior: url(evil.htc);
    expression: alert('malicious');
}

@import url(evil.css);
```

### After Sanitization
```css
.user-style {
    color: red;
    background: url([bad url]);
}
```

## Dependencies

The CSS sanitizer requires:
- `tinycss2` - Modern CSS parser
- `re` - Regular expressions for pattern matching

Install with: `pip install tinycss2`

## Security Benefits

1. **XSS Prevention** - Blocks CSS-based cross-site scripting attacks
2. **Code Injection Protection** - Prevents JavaScript execution through CSS
3. **External Resource Control** - Blocks loading of external malicious resources
4. **Property Validation** - Ensures only safe CSS properties are used
5. **Graceful Degradation** - Returns empty string if parsing fails

## Best Practices

1. Always use the sanitizer for any user-provided CSS
2. Use strict mode when possible for maximum security
3. Regularly update the `tinycss2` library for security patches
4. Review and update the whitelist of safe properties as needed
5. Monitor for any CSS parsing errors in logs

## Customization

The sanitizer can be customized by:
- Adding additional safe properties
- Adjusting URL policies
- Modifying dangerous pattern detection

See `css_sanitizer.py` for configuration options. 