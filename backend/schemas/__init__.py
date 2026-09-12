from .clinical import (
	AyushHistoryCreate,
	AyushHistoryResponse,
	InterviewTurnCreate,
	InterviewTurnResponse,
	MedicalDocumentCreate,
	MedicalDocumentResponse,
	RedFlagCreate,
	RedFlagResponse,
	SessionCreate,
	SessionResponse,
	StructuredHistoryCreate,
	StructuredHistoryResponse,
)
from .patient import PatientCreate, PatientResponse
from .doctor import DoctorLogin, DoctorResponse

# Import integration models from schemas.py
try:
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from schemas import (
        LoginRequest,
        LoginResponse,
        PatientQueueItem,
        StructuredHistoryDetail,
        AyushHistoryDetail,
        PatientHistoryResponse,
        RedFlagAlertItem,
        AlertAcknowledgeRequest,
        LabValueItem,
        ClinicalSummaryDetail,
        SummaryStatusUpdateRequest
    )           


except ImportError:
    pass