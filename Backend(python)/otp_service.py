import random
import time
import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from typing import Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# In-memory storage for OTPs
otp_storage: Dict[str, Dict] = {}
OTP_EXPIRY_SECONDS = 300 

# Brevo Configuration
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
# Using your verified email address
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "foodscrollapp@gmail.com")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "FoodScroll")

def send_otp_email(target_email, otp_code):
    """Sends an OTP email via Brevo API."""
    # Check if API Key is valid/present
    if not BREVO_API_KEY or len(BREVO_API_KEY) < 10:
        print(f"DEBUG: BREVO_API_KEY missing or invalid. OTP for {target_email}: {otp_code}")
        return True

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    # Corrected the format for the sender and recipient
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": target_email}],
        sender={"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        subject="Your OTP Verification Code",
        html_content = f"""
        <div style="max-width: 600px; margin: 0 auto; font-family: sans-serif; color: #333; border: 1px solid #e1e4e8; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0052cc; padding: 20px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0;">Verification Required</h2>
            </div>
            <div style="padding: 40px 20px; text-align: center;">
                <p style="font-size: 16px; color: #555;">Use the following code to sign in. Valid for 5 minutes.</p>
                <div style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 10px; color: #0052cc; background-color: #f4f5f7; padding: 15px 30px; border-radius: 4px; border: 1px solid #dfe1e6;">
                    {otp_code}
                </div>
                <p style="font-size: 12px; color: #888; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
            </div>
        </div>
        """
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        return True
    except ApiException as e:
        print(f"Brevo API Error: {e}")
        return False

def generate_otp(identifier: str) -> str:
    """Generates a 6-digit OTP, stores it, and triggers the email."""
    otp = f"{random.randint(100000, 999999)}"
    expiry = time.time() + OTP_EXPIRY_SECONDS
    
    # Store first
    otp_storage[identifier] = {"otp": otp, "expiry": expiry}
    
    # Attempt to send
    success = send_otp_email(identifier, otp)
    
    if success:
        print(f"[OTP SERVICE] Successfully sent OTP to {identifier}")
    else:
        print(f"[OTP SERVICE] Failed to send email to {identifier}")
        
    return otp

def verify_otp(identifier: str, provided_otp: str) -> bool:
    """Verifies the OTP and checks if it has expired."""
    if identifier not in otp_storage:
        return False
    
    data = otp_storage[identifier]
    
    # Check expiry
    if time.time() > data["expiry"]:
        del otp_storage[identifier]
        return False
    
    # Check correctness
    if data["otp"] == provided_otp:
        del otp_storage[identifier] # Success - consume the OTP
        return True
    
    return False