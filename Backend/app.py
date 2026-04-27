from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import otp_service

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
    "https://foodscroll-kqrb.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SignupRequest(BaseModel):
    name: str
    email: str
    phonenumber: str

class VerifyRequest(BaseModel):
    name: str
    email: str
    phonenumber: str
    otp: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    phonenumber: str
    password: str

@app.get("/")
def read_root():
    return {"message": "FoodsFolio Backend is running! 🚀"}

@app.post("/send-otp")
async def send_otp(request: SignupRequest):
    # Use email or phone as identifier
    otp_service.generate_otp(request.email)
    return {"message": "OTP sent successfully"}

@app.post("/verify-otp")
async def verify_otp(request: VerifyRequest):
    is_valid = otp_service.verify_otp(request.email, request.otp)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    return {"message": "OTP verified successfully"}

@app.post("/register")
async def register(request: RegisterRequest):
    # Here you would typically hash the password and save to database
    print(f"Registering user: {request.email} with password: {request.password}")
    
    # Return mock user data on success
    return {
        "message": "Signup successful",
        "user": {
            "name": request.name,
            "email": request.email,
            "phonenumber": request.phonenumber
        }
    }

@app.post("/auth/google")
async def google_auth(token_data: dict):
    # Placeholder for google auth logic
    return {
        "message": "Google auth successful",
        "user": {"name": "Google User", "email": "google@example.com"}
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)