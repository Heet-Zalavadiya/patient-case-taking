import os
import sys
import uvicorn

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("Starting MediKiosk FastAPI Backend Server on http://127.0.0.1:8000...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
