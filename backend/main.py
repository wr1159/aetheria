# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
from moralis_api import get_wallet_information
from venice import generate_character_traits, remove_background, generate_image_prompt, generate_character_image
import time, torch, os, random, logging
from imgurpython import ImgurClient
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
if os.path.isfile('.env'):
    load_dotenv()
elif os.path.isfile('../.env'):
    load_dotenv('../.env')

# Get API keys
IMGUR_CLIENT_ID = os.environ.get("IMGUR_CLIENT_ID")
IMGUR_CLIENT_SECRET = os.environ.get("IMGUR_CLIENT_SECRET")

# Initialize Imgur client
# imgur_client = ImgurClient(IMGUR_CLIENT_ID, IMGUR_CLIENT_SECRET)

# Model Configuration
FLOCK_MODEL_NAME = "flock-io/Flock_Web3_Agent_Model"  # Specialized Web3 model

# Choose which model to use (TINY_MODEL_NAME is active, FLOCK_MODEL_NAME is commented out)
ACTIVE_MODEL = FLOCK_MODEL_NAME  # Uncomment to use Flock Web3 Agent Model
IS_USE_MODEL = os.environ.get("USE_MODEL") == "True"
print ("====================")
print ("Model Configuration")
print(f"Model enabled: {IS_USE_MODEL}")
print(f"Active model: {ACTIVE_MODEL}")
print ("====================")


# Load model and tokenizer
try:
    if IS_USE_MODEL:
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
class AddressRequest(BaseModel):
    address: str
class AvatarRequest(BaseModel):
    address: str
    sex: str

# Add ping endpoint
@app.get("/ping")
def ping():
    return {"status": "ok"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        if not IS_USE_MODEL:
            random_responses = [
                "Hmm, I'm not sure what you mean. Can you provide more details?",
                "Yes",
                "No",
                "I'm not sure",
                "I don't know",
            ]
            response = random.choice(random_responses)
            return {"response": response}
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

@app.post("/wallet_analysis")
async def wallet_analysis(request: AddressRequest):
    try:
        wallet_summary = get_wallet_information(request.address)
        return {"wallet_summary": wallet_summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_avatar")
async def generate_avatar(request: AvatarRequest):
    try:
        # 1. Get wallet information
        logger.info(f"1. Fetching wallet information for {request.address}")
        wallet_info = get_wallet_information(request.address)
        if not wallet_info:
            raise HTTPException(status_code=400, detail="Could not fetch wallet information")

        # 2. Generate character traits
        logger.info(f"2. Generating character traits for {request.address} and {request.sex}")
        character_traits = generate_character_traits(wallet_info, request.sex)
        logger.info(f"Character traits: {character_traits}")

        # 3. Generate image prompt
        logger.info(f"3. Generating image prompt")
        image_prompt = generate_image_prompt(character_traits)
        logger.info(f"Image prompt: {image_prompt}")

        # 4. Generate character image
        logger.info(f"4. Generating character image")
        image_bytes = generate_character_image(image_prompt)

        # 5. Process image and remove background
        logger.info(f"5. Processing image and removing background")
        processed_image = remove_background(image_bytes)

        # 6. Resize the image to 71x127
        logger.info(f"6. Resizing image to 71x127")
        processed_image = processed_image.resize((71, 127))

        # 7. Save processed image temporarily
        logger.info(f"7. Saving processed image temporarily")
        temp_filename = f"temp_{request.address}.png"
        processed_image.save(temp_filename, "PNG")
        logger.info(f"Image saved temporarily: {temp_filename}")

        # 7. Upload to Imgur
        # try:
        #     upload_result = imgur_client.upload_from_path(temp_filename)
        #     image_url = upload_result['link']
        # except Exception as e:
        #     raise HTTPException(status_code=500, detail=f"Failed to upload image to Imgur: {str(e)}")
        # finally:
        #     # Clean up temporary file
        #     if os.path.exists(temp_filename):
        #         os.remove(temp_filename)

        return {
            # "image_url": image_url,
            "image_url": temp_filename,
            "character_traits": character_traits
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)