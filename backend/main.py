# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import time
import torch

app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Model Configuration
FLOCK_MODEL_NAME = "flock-io/Flock_Web3_Agent_Model"  # Specialized Web3 model

# Choose which model to use (TINY_MODEL_NAME is active, FLOCK_MODEL_NAME is commented out)
ACTIVE_MODEL = FLOCK_MODEL_NAME  # Uncomment to use Flock Web3 Agent Model
IS_USE_MODEL = False

# Load model and tokenizer
try:
    if not IS_USE_MODEL:
        raise RuntimeError("Model is disabled")
    start = time.time()
    model = AutoModelForCausalLM.from_pretrained(
        ACTIVE_MODEL,
        device_map="auto",
        # Force full model load (disable disk offloading)
        offload_folder=None,
        offload_state_dict=False,
        
        # Reduce memory usage
        # low_cpu_mem_usage=True, # Increases time by 50%
        torch_dtype=torch.float16,  # FP16 even on CPU
        
        # For Flock model specific settings (when using it)
        # trust_remote_code=True,  # Uncomment if needed for Flock model
    )
    print(f"Model {ACTIVE_MODEL} loaded in {time.time()-start:.2f}s")
    tokenizer = AutoTokenizer.from_pretrained(ACTIVE_MODEL)
except Exception as e:
    raise RuntimeError(f"Failed to load model: {str(e)}")

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

# Add ping endpoint
@app.get("/ping")
def ping():
    return {"status": "ok"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        if not IS_USE_MODEL:
            return {"response": "Random words"}
        # Create chat template
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": request.message}
        ]
        
        # Generate prompt using chat template
        text = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
    
        # Tokenize input 
        model_inputs = tokenizer(text, return_tensors="pt").to(model.device)
        
        # Generate response
        generated_ids = model.generate(
            **model_inputs,
            do_sample=True
        )

        # Extract only the generated part (removing the input prompt)
        generated_ids = [
            output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
        ]
    
        
        # Decode the response
        response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        return {"response": response}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)