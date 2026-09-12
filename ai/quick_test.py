import os
import sys
from pathlib import Path
from dotenv import find_dotenv, load_dotenv

# 1. Add this script's folder and its parent directory to Python's module search path
current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent

for directory in [str(current_dir), str(parent_dir)]:
    if directory not in sys.path:
        sys.path.insert(0, directory)

# 2. Search for any .env file in the current folder or upward in the tree
found_env = find_dotenv(usecwd=True)
if not found_env:
    # Check explicitly in current_dir and parent_dir if find_dotenv misses it
    for candidate in [current_dir / ".env", parent_dir / ".env"]:
        if candidate.is_file():
            found_env = str(candidate)
            break

if found_env:
    load_dotenv(dotenv_path=found_env, override=True)
    print(f"Loaded .env from: {found_env}")
else:
    print("Warning: No .env file found.")

# 3. Read and verify the API key
api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError(
        "AI_API_KEY is not set in any discovered .env file. "
        "Ensure the line looks like: AI_API_KEY=your_key_here"
    )

os.environ["AI_API_KEY"] = api_key
print(f"Key loaded: {api_key[:6]}...")

# 4. Import the service (handles either flat or nested structure)
try:
    from services.interview_service import InterviewService
except ModuleNotFoundError:
    from ai.services.interview_service import InterviewService

# 5. Initialize
service = InterviewService(session_id="test-session-001")
print("InterviewService initialized successfully.")

from ai.services.interview_service import InterviewService
from ai.services.voice_service import record_and_transcribe

service = InterviewService(session_id="test-session-001")

print("Type 'voice' to speak your answer, 'summary' when done, or 'quit' to exit.\n")

while True:
    mode_choice = input("Mode (type your answer, or 'voice'/'summary'/'quit'): ")

    if mode_choice.lower() == "quit":
        break

    if mode_choice.lower() == "summary":
        history = service.generate_structured_history()
        print("\nSTRUCTURED HISTORY:")
        for key, value in history.items():
            print(f"  {key}: {value}")
        break

    if mode_choice.lower() == "voice":
        patient_text = record_and_transcribe()
        input_mode = "voice"
        print(f"You said: {patient_text}\n")
    else:
        patient_text = mode_choice
        input_mode = "touch"

    ai_question, red_flag = service.send_message(patient_text, input_mode=input_mode)

    if red_flag:
        print(f"\n🚨 RED FLAG: {red_flag['flag_description']} (severity: {red_flag['severity']})\n")

    print("AI:", ai_question, "\n")