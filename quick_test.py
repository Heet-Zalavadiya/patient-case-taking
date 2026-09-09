from dotenv import load_dotenv
load_dotenv()

from ai.services.interview_service import InterviewService

service = InterviewService()

print("Type 'summary' when done answering, or 'quit' to exit.\n")

while True:
    user_input = input("Patient: ")
    if user_input.lower() == "quit":
        break
    if user_input.lower() == "summary":
        history = service.generate_structured_history()
        print("\nSTRUCTURED HISTORY:")
        for key, value in history.items():
            print(f"  {key}: {value}")
        break

    ai_question, red_flag = service.send_message(user_input, input_mode="touch")

    if red_flag:
        print(f"\n🚨 RED FLAG: {red_flag['flag_description']} (severity: {red_flag['severity']})\n")

    print("AI:", ai_question, "\n")