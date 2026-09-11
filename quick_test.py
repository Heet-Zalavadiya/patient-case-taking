from dotenv import load_dotenv
load_dotenv()

from ai.services.interview_service import InterviewService
from ai.services.voice_service import record_and_transcribe
from ai.services import backend_client

SESSION_ID = "test-session-001"  # placeholder until real sessions exist

service = InterviewService()

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
        backend_client.post_history(SESSION_ID, history)
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
        backend_client.post_red_flag(SESSION_ID, red_flag["flag_description"], red_flag["severity"])

    backend_client.post_turn(SESSION_ID, ai_question, patient_text, input_mode)
    print("AI:", ai_question, "\n")