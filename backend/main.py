# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import time
import torch

app = FastAPI()

# Model Configuration
FLOCK_MODEL_NAME = "flock-io/Flock_Web3_Agent_Model"  # Specialized Web3 model
TINY_MODEL_NAME = "arnir0/Tiny-LLM"  # Lightweight model

# Choose which model to use (TINY_MODEL_NAME is active, FLOCK_MODEL_NAME is commented out)
# ACTIVE_MODEL = TINY_MODEL_NAME
ACTIVE_MODEL = FLOCK_MODEL_NAME  # Uncomment to use Flock Web3 Agent Model

# Load model and tokenizer
try:
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
    query: str
    session_id: str = "default"

# Add ping endpoint
@app.get("/ping")
def ping():
    return {"status": "ok"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Create chat template
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": request.query}
        ]
        
        # Generate prompt using chat template

        if (ACTIVE_MODEL == TINY_MODEL_NAME):
            text = request.query
        else:
            text = tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
        
        if (ACTIVE_MODEL == TINY_MODEL_NAME):
            print("Tiny Model")
            inputs = tokenizer.encode(text, return_tensors="pt").to(model.device)
            generated_ids = model.generate(
                inputs,
                max_length=50,
                temperature=0.5,
                top_p=0.9,
                top_k=100,
                do_sample=True
            )
        else:
            # Tokenize input 
            model_inputs = tokenizer(text, return_tensors="pt").to(model.device)
            
            # Generate response
            generated_ids = model.generate(
                **model_inputs,
                do_sample=True
            )

            generated_ids = [
                output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
            ]
        
        # Extract only the generated part (removing the input prompt)
        
        # Decode the response

        if (ACTIVE_MODEL == TINY_MODEL_NAME):
            response= tokenizer.decode(generated_ids[0], skip_special_tokens=True)
        else:
            response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        return {"response": response}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)