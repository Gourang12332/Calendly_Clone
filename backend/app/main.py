import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.database import engine, Base
from app.routers import (
    event_types,
    availability,
    public_booking,
    meetings,
    questions,
    email_notifications,
    contacts,
)

load_dotenv()

app = FastAPI(title="Calendly Clone API", version="1.0.0")

frontend_url = os.getenv("FRONTEND_URL", "https://calendly-clone-orcin-nu.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "https://calendly-clone-orcin-nu.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(event_types.router)
app.include_router(availability.router)
app.include_router(public_booking.router)
app.include_router(meetings.router)
app.include_router(questions.router)
app.include_router(email_notifications.router)
app.include_router(contacts.router)


@app.on_event("startup")
def startup():
    if engine:
        Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health():
    return {"status": "ok"}
