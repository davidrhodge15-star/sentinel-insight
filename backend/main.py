from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ai_engine import SentinelAI
import uvicorn
import os

app = FastAPI()
ai = SentinelAI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    path = f"temp_{file.filename}"
    with open(path, "wb") as f:
        f.write(await file.read())
    success = ai.ingest_pdf(path)
    if os.path.exists(path): os.remove(path)
    return {"status": "success" if success else "failed"}

@app.get("/chat")
async def chat(question: str):
    return {"answer": ai.ask(question)}

@app.post("/clear")
async def clear():
    global ai
    ai = SentinelAI()
    return {"status": "cleared"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)