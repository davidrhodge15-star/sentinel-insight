import os
import time
from google import genai
from dotenv import load_dotenv
from pypdf import PdfReader

load_dotenv()

class SentinelAI:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        self.context = ""
        self.model_id = 'gemini-1.5-flash'

    def ingest_pdf(self, file_path):
        try:
            reader = PdfReader(file_path)
            raw_text = " ".join([page.extract_text().strip() for page in reader.pages if page.extract_text()])
            # Cap at 6000 chars to stay within free-tier TPM (Tokens Per Minute)
            self.context = " ".join(raw_text.split())[:6000]
            return True
        except Exception as e:
            print(f"Error: {e}")
            return False

    def ask(self, question, is_summary=False):
        if not self.context:
            return "No data ingested. Please upload a PDF to the core."
            
        instruction = "Summarize in 3 bullet points." if is_summary else "Answer concisely."
        attempts = 3
        while attempts > 0:
            try:
                prompt = f"Context: {self.context}\nTask: {instruction}\nQuery: {question}"
                response = self.client.models.generate_content(model=self.model_id, contents=prompt)
                return response.text
            except Exception as e:
                if "429" in str(e):
                    time.sleep(15) # Wait for Free Tier reset
                    attempts -= 1
                    continue
                break 
        return "Sentinel Quota Exhausted. Please wait 30 seconds or upgrade billing."