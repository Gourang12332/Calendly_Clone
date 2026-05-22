from datetime import datetime, date, time
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, field_validator


class AvailabilityRuleCreate(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: str
    end_time: str
    is_active: bool = True

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time_format(cls, v):
        parts = v.split(":")
        if len(parts) < 2:
            raise ValueError("Invalid time format")
        return v


class AvailabilityRuleResponse(BaseModel):
    id: UUID
    day_of_week: int
    start_time: str
    end_time: str
    is_active: bool

    class Config:
        from_attributes = True


class OverrideSlotCreate(BaseModel):
    start_time: str
    end_time: str


class OverrideSlotResponse(BaseModel):
    start_time: str
    end_time: str


class AvailabilityScheduleCreate(BaseModel):
    name: str
    timezone: str = "Asia/Kolkata"
    is_default: bool = False
    rules: List[AvailabilityRuleCreate] = []


class AvailabilityScheduleUpdate(BaseModel):
    name: Optional[str] = None
    timezone: Optional[str] = None
    is_default: Optional[bool] = None
    rules: Optional[List[AvailabilityRuleCreate]] = None


class AvailabilityScheduleListItem(BaseModel):
    id: UUID
    name: str
    timezone: str
    is_default: bool

    class Config:
        from_attributes = True


class DateOverrideCreate(BaseModel):
    override_date: date
    is_unavailable: bool = False
    reason: Optional[str] = None
    slots: List[OverrideSlotCreate] = []


class DateOverrideResponse(BaseModel):
    id: UUID
    override_date: date
    is_unavailable: bool
    reason: Optional[str] = None
    slots: List[OverrideSlotResponse] = []

    class Config:
        from_attributes = True


class AvailabilityScheduleDetail(BaseModel):
    id: UUID
    name: str
    timezone: str
    is_default: bool
    rules: List[AvailabilityRuleResponse] = []
    overrides: List[DateOverrideResponse] = []


class QuestionOptionCreate(BaseModel):
    option_text: str
    display_order: int = 0


class QuestionOptionResponse(BaseModel):
    id: UUID
    option_text: str
    display_order: int

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    question_text: str
    question_type: str = "text"
    is_required: bool = False
    display_order: int = 0
    options: List[QuestionOptionCreate] = []


class QuestionUpdate(BaseModel):
    id: Optional[UUID] = None
    question_text: str
    question_type: str = "text"
    is_required: bool = False
    display_order: int = 0
    options: List[QuestionOptionCreate] = []


class QuestionResponse(BaseModel):
    id: UUID
    question_text: str
    question_type: str
    is_required: bool
    display_order: int
    options: List[QuestionOptionResponse] = []

    class Config:
        from_attributes = True


class EventTypeCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    duration_minutes: int = Field(gt=0)
    schedule_id: Optional[UUID] = None
    buffer_before_minutes: int = 0
    buffer_after_minutes: int = 0
    location_type: str = "online"


class EventTypeUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, gt=0)
    schedule_id: Optional[UUID] = None
    buffer_before_minutes: Optional[int] = None
    buffer_after_minutes: Optional[int] = None
    location_type: Optional[str] = None
    is_active: Optional[bool] = None


class EventTypeListItem(BaseModel):
    id: UUID
    name: str
    slug: str
    duration_minutes: int
    public_url: str
    is_active: bool


class EventTypeDetail(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    duration_minutes: int
    schedule_id: Optional[UUID] = None
    buffer_before_minutes: int
    buffer_after_minutes: int
    location_type: str
    is_active: bool
    questions: List[QuestionResponse] = []


class QuestionsBulkCreate(BaseModel):
    questions: List[QuestionCreate]


class QuestionsBulkUpdate(BaseModel):
    questions: List[QuestionUpdate]


class BookingAnswerCreate(BaseModel):
    question_id: UUID
    answer_text: Optional[str] = None


class PublicBookingCreate(BaseModel):
    event_type_id: UUID
    invitee_name: str
    invitee_email: EmailStr
    start_time: datetime
    timezone: str
    answers: List[BookingAnswerCreate] = []


class SlotResponse(BaseModel):
    start_time: datetime
    end_time: datetime
    available: bool = True


class SlotsListResponse(BaseModel):
    date: str
    timezone: str
    slots: List[SlotResponse]


class PublicEventTypeResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    duration_minutes: int
    location_type: str
    timezone: str
    questions: List[QuestionResponse] = []


class BookingConfirmationResponse(BaseModel):
    id: UUID
    status: str
    event_name: str
    invitee_name: str
    invitee_email: str
    start_time: datetime
    end_time: datetime
    timezone: str
    meeting_url: Optional[str] = None


class PublicBookingResponse(BaseModel):
    id: UUID
    status: str
    event_name: str
    invitee_name: str
    invitee_email: str
    start_time: datetime
    end_time: datetime
    meeting_url: Optional[str] = None
    cancel_url: str
    reschedule_url: str
    message: str


class MeetingItem(BaseModel):
    id: UUID
    event_name: str
    invitee_name: str
    invitee_email: str
    start_time: datetime
    end_time: datetime
    status: str


class CancelMeetingRequest(BaseModel):
    reason: Optional[str] = None


class RescheduleMeetingRequest(BaseModel):
    new_start_time: datetime
    timezone: str


class PublicCancelRequest(BaseModel):
    reason: Optional[str] = None


class PublicRescheduleRequest(BaseModel):
    new_start_time: datetime
    timezone: str


class TokenBookingResponse(BaseModel):
    id: UUID
    status: str
    event_name: str
    event_slug: str
    invitee_name: str
    invitee_email: str
    start_time: datetime
    end_time: datetime
    timezone: str
    meeting_url: Optional[str] = None
    event_type_id: UUID
    duration_minutes: int


class EmailNotificationItem(BaseModel):
    id: UUID
    booking_id: Optional[UUID] = None
    recipient_email: str
    subject: str
    notification_type: str
    status: str
    sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    message: str


class EventTypeCreateResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    public_url: str
    duration_minutes: int
    is_active: bool
    message: str


class ScheduleCreateResponse(BaseModel):
    id: UUID
    name: str
    timezone: str
    is_default: bool
    message: str


class OverrideCreateResponse(BaseModel):
    id: UUID
    override_date: date
    message: str


class RescheduleResponse(BaseModel):
    old_booking_id: UUID
    new_booking_id: UUID
    old_status: str
    new_status: str
    new_start_time: datetime
    message: str


class CancelResponse(BaseModel):
    id: UUID
    status: str
    cancelled_at: Optional[datetime] = None
    message: str


class ContactCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None


class ContactItem(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    last_meeting_date: Optional[datetime] = None
    next_meeting_date: Optional[datetime] = None
    meeting_count: int = 0
    is_new: bool = False
    source: str = "booking"

    class Config:
        from_attributes = True


class ContactCreateResponse(BaseModel):
    id: UUID
    message: str
