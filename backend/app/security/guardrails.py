import re
from typing import Tuple

# Common prompt injection and jailbreak signatures
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?previous\s+instructions",
    r"bypass\s+(?:the\s+)?system",
    r"system\s+override",
    r"forget\s+(?:what\s+you\s+were\s+told|your\s+instructions)",
    r"act\s+as\s+a\s+(?:jailbroken|dan\s+|developer\s+mode)",
    r"you\s+are\s+no\s+longer\s+an\s+ai",
    r"rules\s+have\s+changed",
    r"do\s+anything\s+now",
    r"jailbreak",
]

JAILBREAK_PATTERNS = [
    r"\bDAN\b",
    r"developer\s+mode\s+v\d",
    r"anti-gpt",
    r"anarchy\s+mode",
]

# PII regex patterns
EMAIL_PATTERN = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
PHONE_PATTERN = r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
CREDIT_CARD_PATTERN = r"\b(?:\d[ -]*?){13,16}\b"
SSN_PATTERN = r"\b\d{3}-\d{2}-\d{4}\b"

def scan_for_prompt_injection(text: str) -> Tuple[bool, str]:
    """
    Scans input text for prompt injection and jailbreak attempts.
    Returns: (is_malicious: bool, matching_pattern: str)
    """
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True, f"Prompt Injection detected: {pattern}"
            
    for pattern in JAILBREAK_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True, f"Jailbreak attempt detected: {pattern}"
            
    return False, ""

def mask_pii(text: str) -> str:
    """
    Detects and masks sensitive personal identifiable information (PII)
    such as email addresses, phone numbers, credit card numbers, and SSNs.
    """
    masked = text
    masked = re.sub(EMAIL_PATTERN, "[MASKED_EMAIL]", masked)
    masked = re.sub(PHONE_PATTERN, "[MASKED_PHONE]", masked)
    masked = re.sub(CREDIT_CARD_PATTERN, "[MASKED_CREDIT_CARD]", masked)
    masked = re.sub(SSN_PATTERN, "[MASKED_SSN]", masked)
    return masked

def scan_for_pii(text: str) -> Tuple[bool, list]:
    """
    Scans text for various PII forms and returns a list of detected types.
    """
    detected_types = []
    if re.search(EMAIL_PATTERN, text):
        detected_types.append("Email Address")
    if re.search(PHONE_PATTERN, text):
        detected_types.append("Phone Number")
    if re.search(CREDIT_CARD_PATTERN, text):
        detected_types.append("Credit Card Number")
    if re.search(SSN_PATTERN, text):
        detected_types.append("Social Security Number (SSN)")
    return len(detected_types) > 0, detected_types
