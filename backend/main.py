# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

app = FastAPI()

# Model Configuration
MODEL_NAME = "flock-io/Flock_Web3_Agent_Model"

# Load model and tokenizer
try:
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto",
        low_cpu_mem_usage=True
    )
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
except Exception as e:
    raise RuntimeError(f"Failed to load model: {str(e)}")

class ChatRequest(BaseModel):
    query: str
    session_id: str = "default"


@app.get("/ping")
async def ping():
    return {
        "status": "alive",
        "message": "pong",
        "timestamp": datetime.datetime.now().isoformat()
    }
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Format the prompt using the model's chat template
        messages = [
            {"role": "user", "content": request.query}
        ]
        print("query", request.query)
        
        text = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        print("text", text)
        
        # Generate response
        inputs = tokenizer(text, return_tensors="pt").to(model.device)
        print("input", input)
        outputs = model.generate(
            **inputs,
            max_new_tokens=500,
            do_sample=True,
            temperature=0.7,
            top_p=0.9
        )
        print("outputs", outputs)
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract just the assistant's response
        return {"response": response.split("assistant\n")[-1].strip()}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
