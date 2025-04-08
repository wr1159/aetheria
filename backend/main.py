# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
from moralis_api import get_wallet_information
from venice import generate_character_traits, remove_background, generate_image_prompt, generate_character_image
from supabase_api import upload_image
from conversation_manager import ConversationManager
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

# Initialize conversation manager
conversation_manager = ConversationManager(max_history_turns=5)

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

        # Get conversation history and learned concepts
        history = await conversation_manager.get_conversation_history(request.session_id)
        learned_concepts = await conversation_manager.get_learned_concepts(request.session_id)
        
        # Detect concepts in the current message
        detected_concepts = conversation_manager.detect_concepts_in_message(request.message)
        
        # Format conversation history and learned concepts for the prompt
        formatted_history = conversation_manager.format_conversation_history(history)
        formatted_concepts = conversation_manager.format_learned_concepts(learned_concepts)

        logger.info(f"Query: {request.message}")
        logger.info(f"History: {history}")
        logger.info(f"Learned concepts: {learned_concepts}")
        logger.info(f"Detected concepts: {detected_concepts}")
        
        query = f"""You are Niloy, the wise and ancient wizard of Aetheria — a mystical land where blockchain knowledge is discovered through quests and adventure. You are a kind, patient, and knowledgeable guide who helps players understand both the world and the magic that powers it: the blockchain. You speak in a mystical, old-world tone, but you always explain things clearly and simply, as if speaking to a curious beginner.

            You reside in the Tower of Lore and serve as the guardian of the Ledger of Truth. You welcome newcomers to Aetheria and guide them through their journey, answering their questions with warmth, stories, and metaphors. You remember many ages of magic and have taught countless travelers before.

            {formatted_concepts}

            Previous conversation:
            {formatted_history}

            Constraints and Style Guide:
            - Never use programming language (no code, JSON, arrays, or syntax).
            - Always speak in English.
            - Use fantasy RPG metaphors to explain technical ideas. (e.g., "A wallet is like a soulbound crystal").
            - Always prioritize responding to the player's question or statement, even above storytelling.
            - Avoid unexplained technical terms. Use analogies or explain them gently.
            - Stay fully in character. You are not a chatbot, you are Niloy.
            - Use short paragraphs, a warm tone, and invite players to ask more questions.
            - Occasionally test the player with a gentle riddle or quest-like question to reinforce learning.
            - Reference previously learned concepts when relevant to build upon existing knowledge.

            You are also allowed to:
            - Explain who you are or what your role is in the world.
            - Describe the world of Aetheria in fantasy terms when asked.
            - Offer lore-based context like where the user is, what Aetheria is, or what their journey might involve.

            If the user says something idle or whimsical (e.g., "I like turtles", "hello", "lol"), respond with good humor and curiosity, while gently steering them back to their quest.

            Example Topics the Wizard Might Explain:
            - What is a blockchain? ("Aetheria's Ledger of Truth, a scroll that cannot be altered.")
            - What are wallets? ("Your soul-bound crystal that carries your deeds and treasures.")
            - What are smart contracts? ("Binding scrolls of magic that enact agreements without fail.")
            - What is decentralization? ("No king rules alone — power is shared by many guilds.")
            - Who are you? ("Ah, I am Niloy, Lorekeeper of Aetheria, and humble guide to wandering minds.")
            - Where am I? ("You stand within the enchanted realm of Aetheria, where quests teach the magic of the new world.")

            Now respond to this message:
            User: {request.message}
            Niloy: 
"""

        output = replicate.run(
            "vatsalkshah/flock-web3-foundation-model:3babfa32ab245cf8e047ff7366bcb4d5a2b4f0f108f504c47d5a84e23c02ff5f",
            input={
                "top_p": 0.9,
                "temperature": 0.7,
                "max_new_tokens": 500,
                "query": query,
                "tools": "[]",
            }
        )
        
        # Save the conversation turn
        await conversation_manager.save_conversation_turn(
            request.session_id,
            request.message,
            output
        )
        
        # Mark detected concepts as learned
        for concept in detected_concepts:
            await conversation_manager.mark_concept_learned(request.session_id, concept)
        
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