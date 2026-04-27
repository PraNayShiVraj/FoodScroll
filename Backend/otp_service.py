import random
import time
from typing import Dict

# In-memory storage for OTPs: { "email_or_phone": {"otp": "123456", "expiry": timestamp} }
otp_storage: Dict[str, Dict] = {}

OTP_EXPIRY_SECONDS = 300  # 5 minutes

def generate_otp(identifier: str) -> str:
    """Generates a 6-digit OTP and stores it with an expiry time."""
    otp = str(random.randint(100000, 999999))
    expiry = time.time() + OTP_EXPIRY_SECONDS
    otp_storage[identifier] = {"otp": otp, "expiry": expiry}
    
    # Mock sending: Printing to console
    print(f"\n[OTP SERVICE] Sent OTP {otp} to {identifier}\n")
    
    return otp

def verify_otp(identifier: str, provided_otp: str) -> bool:
    """Verifies the OTP and checks if it has expired."""
    if identifier not in otp_storage:
        return False
    
    data = otp_storage[identifier]
    if time.time() > data["expiry"]:
        del otp_storage[identifier]
        return False
    
    if data["otp"] == provided_otp:
        del otp_storage[identifier] # OTP used, clear it
        return True
    
    return False
