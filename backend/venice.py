from PIL import Image
import io, os, base64, requests
from dotenv import load_dotenv
import random

if os.path.isfile('.env'):
    load_dotenv()
# Also check if it exists in the parent directory (project root)
elif os.path.isfile('../.env'):
    load_dotenv('../.env')
else:
    print("WARNING: No .env file found in current or parent directory.")
VENICE_API_KEY = os.environ.get("VENICE_API_KEY")

def generate_image_prompt(character_traits):
    """Generate an image prompt using Venice API based on character traits"""
    url = "https://api.venice.ai/api/v1/chat/completions"
    prompt_request = {
        "model": "llama-3.1-405b",
        "messages": [
            {
                "role": "system",
                "content": """You are an expert at creating detailed image generation prompts for pixel art characters in medieval fantasy games.
                Create a less than 2048 character prompt that will generate a south east facing character sprite that accurately represents the given traits.
                The prompt should be detailed and specific, focusing on visual elements, colors, and style.
                Format the prompt to work well with image generation AI models.
                Put extreme emphasis on the pixel art style.
                The character should be a 16-bit top-down RPG sprite.
                ENSURE THE CHARACTER MAINTAINS THE NES CHUNKY PIXEL ART STYLE WITH A 16-BIT RESOLUTION.
                Follow this exact structure:
                1. Start with "Create a tiny, extremely low-resolution pixel art sprite for a 16-bit top-down RPG, similar to Terraria or Pokémon. the character follows a strict 32x32 or 32x64 pixel grid, ensuring chunky, clearly visible pixels with no gradients or unnecessary details"
                2. Describe the character's basic identity, status and top holdings
                3. Detail their appearance and equipment
                4. Describe age-related characteristics
                5. Include trading style characteristics
                6. End with the color palette is strictly limited to 8-12 colors, maintaining a classic NES/SNES aesthetic with chunky, clearly defined pixels at a resolution of 32x32 or 32x64 pixels, ensuring a distinct retro RPG feel with a Fully white background."""
            },
            {
                "role": "user",
                "content": f"""Create a detailed image generation prompt for a pixel art character with these traits:
                - Top Holdings: {''.join(character_traits['top_holdings'])}
                - Character Class: {character_traits['character_class']}
                - Social Status: {character_traits['social_class']}
                - Age: {character_traits['age_category']}
                - Gender: {character_traits['gender']}
                - Trading Style: {character_traits['trading_style']}
                - Risk Level: {character_traits['risk_level']}
                
                Include specific details about appearance, colors, and visual elements that reflect their status and trading style.
                Keep the prompt under 2048 characters and above 1000 characters."""
            }
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }
    headers = {
        "Authorization": "Bearer " + VENICE_API_KEY,
        "Content-Type": "application/json"
    }

    response = requests.post(url, json=prompt_request, headers=headers)
    if response.status_code != 200:
        raise Exception("Failed to generate image prompt")
    
    return response.json()["choices"][0]["message"]["content"]

def generate_character_image(image_prompt):
    """Generate character image using Venice API"""
    url = "https://api.venice.ai/api/v1/image/generate"
    payload = {
        "height": 448,
        "width": 256,
        "steps": 20,
        "return_binary": False,
        "hide_watermark": True,
        "format": "png",
        "embed_exif_metadata": False,
        "model": "flux-dev",
        "seed": random.randint(100000000, 999999999),
        "prompt": image_prompt,
        "style_preset": "Pixel Art",
        "cfg_scale": 10
    }
    headers = {
        "Authorization": "Bearer " + VENICE_API_KEY,
        "Content-Type": "application/json"
    }

    response = requests.post(url, json=payload, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to generate due to {response.content}")
    
    image_data = response.json()
    if "images" not in image_data or not image_data["images"]:
        raise Exception("No image data in response")
    
    return base64.b64decode(image_data["images"][0])

def generate_character_traits(wallet_info, gender):
    # Get wallet networth
    wallet_amount = float(wallet_info.get('wallet_networth', {}).get('total_networth_usd', 0))
    
    # Get wallet age in days
    wallet_age_str = wallet_info.get('wallet_age', '0 days')
    wallet_age = float(wallet_age_str.split()[0]) if wallet_age_str != 'None' else 0
    
    # Get top holdings
    top_holdings = [holding['symbol'] for holding in wallet_info.get('portfolio_holdings', [])]
    
    # Get PnL information
    pnl = wallet_info.get('pnl', {})
    tx_count = pnl.get('total_count_of_trades', 0)
    
    # Determine market cap tier based on holdings
    mcap_tier = "1B-50M mcap"  # Default tier
    
    # List of character classes
    character_classes = [
        "Knight", "Wizard", "Rogue", "Cleric", "Berserker",
        "Archer", "Necromancer", "Alchemist", "Summoner"
    ]
    
    # Randomly select character class
    character_class = random.choice(character_classes)

    # Determine social class based on wallet amount
    if wallet_amount >= 1000000:
        social_class = "king"
    elif wallet_amount >= 100000:
        social_class = "duke"
    elif wallet_amount >= 10000:
        social_class = "baron"
    elif wallet_amount >= 1000:
        social_class = "merchant"
    else:
        social_class = "villager"

    # Determine age category
    if wallet_age < 0.5:
        age_category = "young"
    elif wallet_age > 4:
        age_category = "elderly"
    else:
        age_category = "adult"

    # Determine trading style based on transaction count
    if tx_count >= 100:
        trading_style = "hyperactive"
    elif tx_count >= 50:
        trading_style = "analytical"
    elif tx_count >= 10:
        trading_style = "balanced"
    else:
        trading_style = "patient"

    # Determine risk level based on market cap tier
    risk_level = {
        "<1 bil mcap": "cautious",
        "1B-50M mcap": "balanced",
        "50M-1m mcap": "daring",
        ">1m": "reckless"
    }.get(mcap_tier, "balanced")

    return {
        "social_class": social_class,
        "age_category": age_category,
        "gender": gender,
        "trading_style": trading_style,
        "risk_level": risk_level,
        "top_holdings": top_holdings,
        "character_class": character_class
    }

def remove_background(image_bytes):
    # Convert bytes to PIL Image
    image = Image.open(io.BytesIO(image_bytes))
    
    # Convert image to RGBA if it isn't already
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    
    # Get the image data
    data = image.getdata()
    
    # Create a new image with transparent background
    new_data = []
    
    # Define threshold for what constitutes "background"
    # Assuming lighter pixels are background
    threshold = 250  # Adjust this value if needed
    
    for item in data:
        # If pixel is light (likely background)
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            # Make it transparent
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
    
    # Create new image with transparent background
    new_image = Image.new('RGBA', image.size, (0, 0, 0, 0))
    new_image.putdata(new_data)
    
    return new_image

if __name__ == "__main__":
    # Example character traits
    character_traits = generate_character_traits(
        wallet_info={
            'wallet_networth': {'total_networth_usd': 5000000},
            'wallet_age': '2 days',
            'portfolio_holdings': [{'symbol': 'Ethereum'}],
            'pnl': {'total_count_of_trades': 750}
        },
        gender="male"
    )

    # Prepare the chat completion request for generating the image prompt
    prompt_request = {
        "model": "llama-3.1-405b",
        "messages": [
            {
                "role": "system",
                "content": """You are an expert at creating detailed image generation prompts for pixel art characters in medieval fantasy games.
                Create a prompt that will generate a character sprite that accurately represents the given traits.
                The prompt should be detailed and specific, focusing on visual elements, colors, and style.
                Format the prompt to work well with image generation AI models.
                Put extreme emphasis on the pixel art style.
                The character should be a 16-bit top-down RPG sprite.
                ENSURE THE CHARACTER MAINTAINS THE NES CHUNKY PIXEL ART STYLE WITH A 16-BIT RESOLUTION.
                Follow this exact structure:
                1. Start with "Create a tiny, extremely low-resolution pixel art sprite for a 16-bit top-down RPG, similar to Terraria or Pokémon. the character follows a strict 32x32 or 32x64 pixel grid, ensuring chunky, clearly visible pixels with no gradients or unnecessary details"
                2. Describe the character's basic identity and status
                3. Detail their appearance and equipment
                4. Describe age-related characteristics
                5. Include trading style characteristics
                6. End with the color palette is strictly limited to 8-12 colors, maintaining a classic NES/SNES aesthetic with chunky, clearly defined pixels at a resolution of 32x32 or 32x64 pixels, ensuring a distinct retro RPG feel with a Fully white background.
                Example Prompts:
                Necromancer: Create a tiny, extremely low-resolution pixel art sprite for a 16-bit top-down RPG, similar to Terraria or Pokémon; the character is a Necromancer with top holdings in Unicorn Coin, blending dark magic with an eerie, mystical aura; they wear a blocky, tattered black robe with jagged edges, accented with glowing purple and silver runes to symbolize their connection to both death and mythical wealth; their hood is oversized and shadowed, with two glowing, pixelated eyes peering from within; instead of the usual skulls or bones, their magic manifests as shimmering spectral unicorn horns floating around them, a direct nod to their unusual holdings; their staff is gnarled and twisted, topped with a small, radiant unicorn skull that pulses with pixelated energy; their stance is ominous yet graceful, as if weaving between life and death with ease; the color palette is strictly limited to 8-12 colors, maintaining a classic NES/SNES aesthetic with chunky, clearly defined pixels at a resolution of 32x32 or 32x64 pixels, ensuring a distinct retro RPG feel.
                Ranger : "Create a tiny, extremely low-resolution pixel-art sprite of a Ranger, designed for a 16-bit top-down RPG similar to Terraria and Pokémon; the character follows a strict 32x32 or 32x64 pixel grid, ensuring chunky, clearly visible pixels with no gradients or unnecessary details; they wear a dark green hooded cloak with a jagged, pixelated hem, reinforced leather armor with broad, blocky shoulder pads, and a simple utility belt for carrying supplies; their top holding is Unicorn Coin, which is fully incorporated into their appearance and abilities, appearing as a mystical golden emblem embedded in their bow, causing the arrows to shimmer with a faint glow; the ranger wields a short, wooden recurve bow, with an oversized quiver strapped to their back, filled with blocky, pixel-defined arrows; their stance is low and agile, ready to fire at a moment's notice, with a sharp, focused expression visible beneath their hood; the design must be simple, bold, and clear, ensuring immediate readability in a top-down RPG setting, while limiting excessive decorations to preserve the clean, nostalgic aesthetic of classic SNES/NES sprites."
                Make the prompt as similar in style as possible to the example prompt.
                ensure the background is fully white please
                
                ENSURE THE CHARACTER MAINTAINS THE NES CHUNKY PIXEL ART STYLE WITH A 16-BIT RESOLUTION.
                ENSURE THE CHARACTER MAINTAINS THE NES CHUNKY PIXEL ART STYLE WITH A 16-BIT RESOLUTION.
                """
            },
            {
                "role": "user",
                "content": f"""Create a detailed image generation prompt for a pixel art character with these traits:
                - Character Class: {character_traits['character_class']}
                - Social Status: {character_traits['social_class']}
                - Age: {character_traits['age_category']}
                - Gender: {character_traits['gender']}
                - Trading Style: {character_traits['trading_style']}
                - Risk Level: {character_traits['risk_level']}
                - Top Holdings: {', '.join(character_traits['top_holdings'])}
                
            
                Include specific details about appearance, colors, and visual elements that reflect their status and trading style.
                Keep the prompt under 2000 characters and above 1000 characters.
                Keep the prompt under 2000 characters and above 1000 characters."""
            
            }
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }
    headers = {
        "Authorization": "Bearer " + VENICE_API_KEY,
        "Content-Type": "application/json"
    }

    # Get image prompt from Venice API
    response = requests.post(url, json=prompt_request, headers=headers)

    if response.status_code == 200:
        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
            image_prompt = data["choices"][0]["message"]["content"]
            print("Generated Image Prompt:")
            print(image_prompt)
            
            # Now use this prompt with the image generation API
            image_url = "https://api.venice.ai/api/v1/image/generate"
            image_payload = {
                "height": 448,
                "width": 256,
                "steps": 20,
                "return_binary": False,
                "hide_watermark": True,
                "format": "png",
                "embed_exif_metadata": False,
                "model": "flux-dev",
                "seed": 342990432,
                "prompt": image_prompt,
                "style_preset": "Pixel Art",
                "cfg_scale": 10
            }
            
            image_response = requests.post(image_url, json=image_payload, headers=headers)
            
            if image_response.status_code == 200:
                image_data = image_response.json()
                if "images" in image_data and len(image_data["images"]) > 0:
                    image_bytes = base64.b64decode(image_data["images"][0])
                    
                    # Process the image to remove background
                    processed_image = remove_background(image_bytes)
                    
                    # Save both original and processed images
                    seed = str(image_data["request"]["seed"])
                    original_filename = f"{seed}_original.png"
                    processed_filename = f"{seed}_sprite.png"
                    
                    # Save original
                    with open(original_filename, "wb") as file:
                        file.write(image_bytes)

                    # Save processed (transparent background)
                    processed_image.save(processed_filename, "PNG")
                    
                    print(f"\nOriginal image saved as {original_filename}")
                    print(f"Processed sprite saved as {processed_filename}")
                else:
                    print("No image data found in response.")
            else:
                print(f"Image generation error: {image_response.status_code}, {image_response.text}")
        else:
            print("No response data found.")
    else:
        print(f"Error: {response.status_code}, {response.text}")

