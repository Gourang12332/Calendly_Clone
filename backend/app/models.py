import uuid
from datetime import datetime, date, time
from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, Date, Time,
    ForeignKey, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid():
    return uuid.uuid4()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    timezone = Column(String(100), default="Asia/Kolkata")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    availability_schedules = relationship("AvailabilitySchedule", back_populates="user")
    event_types = relationship("EventType", back_populates="user")
    bookings = relationship("Booking", back_populates="user")
    contacts = relationship("Contact", back_populates="user", cascade="all, delete-orphan")


class Contact(Base):
    __tablename__ = "contacts"
    __table_args__ = (UniqueConstraint("user_id", "email", name="uq_user_contact_email"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    company = Column(String(150), nullable=True)
    source = Column(String(30), default="manual")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="contacts")


class AvailabilitySchedule(Base):
    __tablename__ = "availability_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    timezone = Column(String(100), default="Asia/Kolkata")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="availability_schedules")
    rules = relationship("AvailabilityRule", back_populates="schedule", cascade="all, delete-orphan")
    overrides = relationship("AvailabilityDateOverride", back_populates="schedule", cascade="all, delete-orphan")
    event_types = relationship("EventType", back_populates="schedule")


class AvailabilityRule(Base):
    __tablename__ = "availability_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("availability_schedules.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    schedule = relationship("AvailabilitySchedule", back_populates="rules")


class AvailabilityDateOverride(Base):
    __tablename__ = "availability_date_overrides"
    __table_args__ = (UniqueConstraint("schedule_id", "override_date", name="uq_schedule_override_date"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("availability_schedules.id"), nullable=False)
    override_date = Column(Date, nullable=False)
    is_unavailable = Column(Boolean, default=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    schedule = relationship("AvailabilitySchedule", back_populates="overrides")
    slots = relationship("AvailabilityOverrideSlot", back_populates="override", cascade="all, delete-orphan")


class AvailabilityOverrideSlot(Base):
    __tablename__ = "availability_override_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    override_id = Column(UUID(as_uuid=True), ForeignKey("availability_date_overrides.id"), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    override = relationship("AvailabilityDateOverride", back_populates="slots")


class EventType(Base):
    __tablename__ = "event_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("availability_schedules.id"), nullable=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    buffer_before_minutes = Column(Integer, default=0)
    buffer_after_minutes = Column(Integer, default=0)
    location_type = Column(String(50), default="online")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="event_types")
    schedule = relationship("AvailabilitySchedule", back_populates="event_types")
    questions = relationship("EventTypeQuestion", back_populates="event_type", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="event_type")


class EventTypeQuestion(Base):
    __tablename__ = "event_type_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    event_type_id = Column(UUID(as_uuid=True), ForeignKey("event_types.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="text")
    is_required = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    event_type = relationship("EventType", back_populates="questions")
    options = relationship("EventTypeQuestionOption", back_populates="question", cascade="all, delete-orphan")


class EventTypeQuestionOption(Base):
    __tablename__ = "event_type_question_options"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    question_id = Column(UUID(as_uuid=True), ForeignKey("event_type_questions.id"), nullable=False)
    option_text = Column(String(255), nullable=False)
    display_order = Column(Integer, default=0)

    question = relationship("EventTypeQuestion", back_populates="options")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    event_type_id = Column(UUID(as_uuid=True), ForeignKey("event_types.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    invitee_name = Column(String(150), nullable=False)
    invitee_email = Column(String(150), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    timezone = Column(String(100), nullable=False)
    status = Column(String(30), default="scheduled")
    cancellation_reason = Column(Text, nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    rescheduled_from_booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True)
    cancel_token = Column(String(255), unique=True, nullable=True)
    reschedule_token = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    event_type = relationship("EventType", back_populates="bookings")
    user = relationship("User", back_populates="bookings")
    answers = relationship("BookingQuestionAnswer", back_populates="booking", cascade="all, delete-orphan")
    history = relationship("BookingHistory", back_populates="booking", cascade="all, delete-orphan")
    email_notifications = relationship("EmailNotification", back_populates="booking")
    meeting_link = relationship("MeetingLink", back_populates="booking", uselist=False, cascade="all, delete-orphan")


class BookingQuestionAnswer(Base):
    __tablename__ = "booking_question_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("event_type_questions.id"), nullable=False)
    answer_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    booking = relationship("Booking", back_populates="answers")
    question = relationship("EventTypeQuestion")


class BookingHistory(Base):
    __tablename__ = "booking_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False)
    action = Column(String(50), nullable=False)
    old_start_time = Column(DateTime(timezone=True), nullable=True)
    old_end_time = Column(DateTime(timezone=True), nullable=True)
    new_start_time = Column(DateTime(timezone=True), nullable=True)
    new_end_time = Column(DateTime(timezone=True), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    booking = relationship("Booking", back_populates="history")


class EmailNotification(Base):
    __tablename__ = "email_notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True)
    recipient_email = Column(String(150), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)
    status = Column(String(30), default="pending")
    sent_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    booking = relationship("Booking", back_populates="email_notifications")


class MeetingLink(Base):
    __tablename__ = "meeting_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False)
    meeting_url = Column(Text, nullable=True)
    meeting_provider = Column(String(50), default="manual")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    booking = relationship("Booking", back_populates="meeting_link")
