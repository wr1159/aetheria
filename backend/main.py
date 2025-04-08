# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
from moralis_api import get_wallet_information
from venice import generate_character_traits, remove_background, generate_image_prompt, generate_character_image
from supabase_api import upload_image
import time, torch, os, random, logging
from dotenv import load_dotenv
import replicate

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

REPLICATE_KEY = os.environ.get("REPLICATE_API_KEY") 

IS_USE_MODEL = os.environ.get("USE_MODEL") == "True"
print ("====================")
print ("Model Configuration")
print(f"Model enabled: {IS_USE_MODEL}")
print ("====================")


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
        print("query: ", request.message)
        logger.info(f"Query: {request.message}")
        query = "Context: You are a Wizard NPC in a Gamified Web3 Educational game called Aetheria. You should be informative and simple while making responses short and text based. NO JSON. \n" + request.message
        output = replicate.run(
            "vatsalkshah/flock-web3-foundation-model:3babfa32ab245cf8e047ff7366bcb4d5a2b4f0f108f504c47d5a84e23c02ff5f",
            input={
                "top_p": 0.9,
                "temperature": 0.7,
                "max_new_tokens": 2000,
                "query": query,
                "tools": "[]",
            }
        )
        logger.info(f"API Output: {output}")
        return {"response": output}
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
        temp_filename = f"{request.address}.png"
        processed_image.save(temp_filename, "PNG")
        logger.info(f"Image saved temporarily: {temp_filename}")

        # 8. Upload to Supabse
        logger.info(f"8. Uploading image to Supabase")
        image_url = upload_image(temp_filename)
        logger.info(f"Image uploaded to Supabase: {image_url}")

        return {
            "image_url": image_url,
            # "image_url": temp_filename,
            "character_traits": character_traits
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)