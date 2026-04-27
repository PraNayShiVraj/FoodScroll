import random
import time
import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from typing import Dict

# In-memory storage for OTPs: { "email_or_phone": {"otp": "123456", "expiry": timestamp} }
otp_storage: Dict[str, Dict] = {}

OTP_EXPIRY_SECONDS = 300  # 5 minutes

# Brevo Configuration
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "FoodScroll")

def send_otp_email(target_email, otp_code):
    """Sends an OTP email via Brevo API."""
    if not BREVO_API_KEY or BREVO_API_KEY == "your_brevo_api_key_here":
        print(f"DEBUG: BREVO_API_KEY not set. OTP for {target_email} is: {otp_code}")
        return True

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": target_email}],
        sender={"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        subject="Your OTP Verification Code",
        html_content = f"""
<div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; border: 1px solid #e1e4e8; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #0052cc; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-weight: 600; letter-spacing: 0.5px;">Verification Required</h2>
    </div>
    <div style="padding: 40px 20px; text-align: center; background-color: #ffffff;">
        <p style="font-size: 16px; color: #555; margin-bottom: 24px;">To complete your sign-in, please use the following one-time passcode. This code is valid for <strong>5 minutes</strong>.</p>
        
        <div style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 10px; color: #0052cc; background-color: #f4f5f7; padding: 15px 30px; border-radius: 4px; border: 1px solid #dfe1e6;">
            {otp_code}
        </div>
        
        <p style="font-size: 14px; color: #888; margin-top: 30px;">
            If you did not request this code, you can safely ignore this email. 
            For security, do not share this code with anyone.
        </p>
    </div>
    <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e1e4e8;">
    </div>
</div>
"""
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        return True
    except ApiException as e:
        print(f"Exception when calling Brevo API: {e}")
        return False

def generate_otp(identifier: str) -> str:
    """Generates a 6-digit OTP and stores it with an expiry time."""
    otp = f"{random.randint(100000, 999999)}"
    expiry = time.time() + OTP_EXPIRY_SECONDS
    otp_storage[identifier] = {"otp": otp, "expiry": expiry}
    
    # Send the email
    send_otp_email(identifier, otp)
    
    # Mock sending: Printing to console for debug
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
