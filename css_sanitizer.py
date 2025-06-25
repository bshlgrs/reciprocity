import re
import tinycss2
from typing import List, Set, Optional


class CSSSanitizer:
    """
    A CSS sanitizer that removes potentially dangerous CSS constructs
    while preserving safe styling properties.
    """
    
    # Dangerous CSS properties that can be used for attacks
    DANGEROUS_PROPERTIES = {
        'expression',  # IE expression() attacks
        'behavior',    # IE behavior attacks
        'javascript',  # javascript: URLs
        'vbscript',    # vbscript: URLs
        'data',        # data: URLs can be dangerous
        'script',      # script references
        'import',      # @import can load external content
    }
    
    # Dangerous CSS functions
    DANGEROUS_FUNCTIONS = {
        'expression',
        'javascript',
        'vbscript',
        'livescript',
        'mocha',
        'eval',
        'script',
    }
    
    # Safe CSS properties (whitelist approach)
    SAFE_PROPERTIES = {
        # Layout properties
        'display', 'position', 'top', 'right', 'bottom', 'left',
        'float', 'clear', 'overflow', 'overflow-x', 'overflow-y',
        'visibility', 'clip', 'z-index',
        
        # Box model
        'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
        'border-width', 'border-style', 'border-color',
        'border-radius', 'box-sizing', 'box-shadow',
        
        # Typography
        'font', 'font-family', 'font-size', 'font-weight', 'font-style',
        'font-variant', 'line-height', 'letter-spacing', 'word-spacing',
        'text-align', 'text-decoration', 'text-transform', 'text-indent',
        'text-shadow', 'white-space', 'word-wrap', 'word-break',
        
        # Colors and backgrounds
        'color', 'background', 'background-color', 'background-image',
        'background-repeat', 'background-position', 'background-size',
        'background-attachment', 'background-clip', 'background-origin',
        'opacity',
        
        # Flexbox
        'flex', 'flex-direction', 'flex-wrap', 'flex-flow',
        'justify-content', 'align-items', 'align-content', 'align-self',
        'flex-grow', 'flex-shrink', 'flex-basis', 'order',
        
        # Grid
        'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
        'grid-template-areas', 'grid-gap', 'grid-column', 'grid-row',
        'grid-area', 'justify-items', 'align-content',
        
        # Transforms and animations (limited)
        'transform', 'transform-origin', 'transition', 'transition-property',
        'transition-duration', 'transition-timing-function', 'transition-delay',
        
        # Misc safe properties
        'cursor', 'outline', 'outline-color', 'outline-style', 'outline-width',
        'list-style', 'list-style-position', 'list-style-image',
        'table-layout', 'border-collapse', 'border-spacing', 'caption-side',
        'empty-cells', 'vertical-align',
    }
    
    # Dangerous URL schemes
    DANGEROUS_URL_SCHEMES = {
        'javascript:',
        'vbscript:',
        'data:',
        'livescript:',
        'mocha:',
    }
    
    # Properties that can inject text content into the page
    TEXT_INJECTION_PROPERTIES = {
        'content',           # ::before, ::after pseudo-elements
        'quotes',           # Quotation marks
        'counter-increment', # Counter manipulation
        'counter-reset',    # Counter manipulation
        'list-style-type',  # Can add text bullets/numbers
    }
    
    def __init__(self, 
                 strict_mode: bool = True,
                 allow_external_urls: bool = False,
                 additional_safe_properties: Optional[Set[str]] = None):
        """
        Initialize the CSS sanitizer.
        
        Args:
            strict_mode: If True, only allow whitelisted properties and block text injection
            allow_external_urls: If True, allow http(s) URLs in CSS
            additional_safe_properties: Additional properties to consider safe
        """
        self.strict_mode = strict_mode
        self.allow_external_urls = allow_external_urls
        
        if additional_safe_properties:
            self.safe_properties = self.SAFE_PROPERTIES.union(additional_safe_properties)
        else:
            self.safe_properties = self.SAFE_PROPERTIES.copy()
    
    def sanitize_css(self, css_string: str) -> str:
        """
        Sanitize a CSS string by removing dangerous constructs.
        
        Args:
            css_string: The CSS string to sanitize
            
        Returns:
            Sanitized CSS string
        """
        if not css_string or not css_string.strip():
            return ""
        
        try:
            # Parse the CSS
            rules = tinycss2.parse_stylesheet(css_string, skip_comments=True, skip_whitespace=True)
            
            # Filter and collect safe rules
            safe_rules = []
            for rule in rules:
                safe_rule = self._process_rule(rule)
                if safe_rule:
                    safe_rules.append(safe_rule)
            
            # Serialize back to CSS
            return tinycss2.serialize(safe_rules)
        
        except Exception as e:
            # If parsing fails, return empty string for safety
            print(f"CSS parsing error: {e}")
            return ""
    
    def _process_rule(self, rule):
        """Process a CSS rule and return it if safe, None if dangerous."""
        if hasattr(rule, 'type'):
            if rule.type == 'qualified-rule':
                return self._process_qualified_rule(rule)
            elif rule.type == 'at-rule':
                return self._process_at_rule(rule)
        return rule  # Pass through unknown rule types for safety
    
    def _process_qualified_rule(self, rule):
        """Process a qualified CSS rule (selector + declarations)."""
        # Parse declarations from the rule content
        declarations = tinycss2.parse_declaration_list(rule.content)
        
        safe_declarations = []
        for decl in declarations:
            if hasattr(decl, 'type') and decl.type == 'declaration':
                if self._is_safe_declaration(decl):
                    safe_declarations.append(decl)
            else:
                # Keep non-declaration items (like whitespace, comments)
                safe_declarations.append(decl)
        
        if safe_declarations:
            # Return the original rule but with filtered content
            rule.content[:] = safe_declarations
            return rule
        return None
    
    def _process_at_rule(self, rule):
        """Process CSS at-rules (like @media, @keyframes, etc.)."""
        if hasattr(rule, 'lower_at_keyword'):
            at_keyword = rule.lower_at_keyword
            
            # Block dangerous at-rules
            if at_keyword in ['import', 'namespace']:
                return None
            
            # Allow safe at-rules like @media, @keyframes
            if at_keyword in ['media', 'supports', 'keyframes', '-webkit-keyframes']:
                if rule.content:
                    # Recursively process nested rules
                    content = tinycss2.parse_rule_list(rule.content)
                    safe_content = []
                    for content_rule in content:
                        safe_content_rule = self._process_rule(content_rule)
                        if safe_content_rule:
                            safe_content.append(safe_content_rule)
                    
                    if safe_content:
                        rule.content[:] = safe_content
                        return rule
                else:
                    return rule
        
        return None
    
    def _is_safe_declaration(self, declaration) -> bool:
        """Check if a CSS declaration is safe."""
        if not hasattr(declaration, 'lower_name'):
            return False
            
        property_name = declaration.lower_name
        
        # In strict mode, block properties that can inject text content
        if self.strict_mode and property_name in self.TEXT_INJECTION_PROPERTIES:
            return False
        
        # Check if property is safe
        if self.strict_mode and property_name not in self.safe_properties:
            return False
        
        # Check for dangerous property names
        for dangerous in self.DANGEROUS_PROPERTIES:
            if dangerous in property_name:
                return False
        
        # Check the value for dangerous content
        if hasattr(declaration, 'value'):
            return self._is_safe_value(declaration.value)
        
        return True
    
    def _is_safe_value(self, value_tokens) -> bool:
        """Check if CSS property values are safe."""
        serialized_value = tinycss2.serialize(value_tokens).lower()
        
        # Check for dangerous patterns in the serialized value
        dangerous_patterns = [
            r'javascript\s*:',
            r'vbscript\s*:',
            r'expression\s*\(',
            r'data\s*:',
            r'<script',
            r'</script',
            r'eval\s*\(',
            r'alert\s*\(',
            r'document\.',
            r'window\.',
            r'location\.',
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, serialized_value):
                return False
        
        # Check for dangerous URL schemes
        for scheme in self.DANGEROUS_URL_SCHEMES:
            if scheme in serialized_value:
                return False
        
        # If external URLs are not allowed, check for http(s) URLs
        if not self.allow_external_urls:
            if re.search(r'url\s*\(\s*["\']?https?:', serialized_value):
                return False
        
        return True


def sanitize_css(css_string: str, strict_mode: bool = True) -> str:
    """
    Convenience function to sanitize CSS string.
    
    Args:
        css_string: CSS string to sanitize
        strict_mode: If True, only allow whitelisted properties
        
    Returns:
        Sanitized CSS string
    """
    sanitizer = CSSSanitizer(strict_mode=strict_mode)
    return sanitizer.sanitize_css(css_string)


# Example usage and testing
if __name__ == "__main__":
    # Test cases
    test_css = """
    .safe-class {
        color: red;
        background: blue;
        font-size: 14px;
        margin: 10px;
    }
    
    .dangerous-class {
        background: url(javascript:alert('xss'));
        behavior: url(evil.htc);
        expression: alert('xss');
        -moz-binding: url(evil.xml);
    }
    
    @import url(evil.css);
    
    @media screen {
        .media-class {
            color: green;
            background: url(data:text/html,<script>alert('xss')</script>);
        }
    }
    
    .another-safe-class {
        display: flex;
        justify-content: center;
    }
    
    .text-injection {
        content: "Injected text!";
        quotes: '"' '"';
        list-style-type: "• ";
        counter-increment: section;
    }
    
    .text-injection::before {
        content: "Before text";
    }
    """
    
    print("Original CSS:")
    print(test_css)
    print("\n" + "="*50 + "\n")
    
    sanitizer = CSSSanitizer(strict_mode=False)
    result = sanitizer.sanitize_css(test_css)
    print("Sanitized CSS (non-strict mode):")
    print(result)
    print("\n" + "="*50 + "\n")
    
    sanitizer_strict = CSSSanitizer(strict_mode=True)
    result_strict = sanitizer_strict.sanitize_css(test_css)
    print("Sanitized CSS (strict mode):")
    print(result_strict) 