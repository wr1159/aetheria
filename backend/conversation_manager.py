import os
import json
from typing import List, Dict, Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
if os.path.isfile('.env'):
    load_dotenv()
elif os.path.isfile('../.env'):
    load_dotenv('../.env')

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Define blockchain concepts for tracking
BLOCKCHAIN_CONCEPTS = [
    "blockchain", "wallets", "smart_contracts", "decentralization", 
    "gas", "DAOs", "NFTs", "tokens", "mining", "consensus", 
    "private_keys", "public_keys", "transactions", "blocks"
]

class ConversationManager:
    def __init__(self, max_history_turns: int = 5):
        self.max_history_turns = max_history_turns

    async def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Retrieve conversation history for a given session."""
        try:
            response = supabase.table('conversation_history') \
                .select('*') \
                .eq('session_id', session_id) \
                .order('timestamp', desc=True) \
                .limit(self.max_history_turns) \
                .execute()
            
            # Reverse to get chronological order
            return list(reversed(response.data))
        except Exception as e:
            print(f"Error retrieving conversation history: {e}")
            return []

    async def save_conversation_turn(self, session_id: str, user_message: str, npc_response: str) -> None:
        """Save a conversation turn to the database."""
        try:
            supabase.table('conversation_history').insert({
                'session_id': session_id,
                'user_message': user_message,
                'npc_response': npc_response,
                'timestamp': 'now()'
            }).execute()
        except Exception as e:
            print(f"Error saving conversation turn: {e}")

    async def get_learned_concepts(self, session_id: str) -> List[str]:
        """Retrieve concepts that the user has learned about."""
        try:
            response = supabase.table('learned_concepts') \
                .select('concept') \
                .eq('session_id', session_id) \
                .execute()
            
            return [item['concept'] for item in response.data]
        except Exception as e:
            print(f"Error retrieving learned concepts: {e}")
            return []

    async def mark_concept_learned(self, session_id: str, concept: str) -> None:
        """Mark a concept as learned by the user."""
        try:
            supabase.table('learned_concepts').insert({
                'session_id': session_id,
                'concept': concept,
                'timestamp': 'now()'
            }).execute()
        except Exception as e:
            print(f"Error marking concept as learned: {e}")

    def detect_concepts_in_message(self, message: str) -> List[str]:
        """Detect blockchain concepts mentioned in a message."""
        message_lower = message.lower()
        detected_concepts = []
        
        for concept in BLOCKCHAIN_CONCEPTS:
            if concept.lower() in message_lower:
                detected_concepts.append(concept)
        
        return detected_concepts

    def format_conversation_history(self, history: List[Dict]) -> str:
        """Format conversation history for the prompt."""
        formatted_history = ""
        for turn in history:
            formatted_history += f"User: {turn['user_message']}\n"
            formatted_history += f"Niloy: {turn['npc_response']}\n\n"
        return formatted_history

    def format_learned_concepts(self, concepts: List[str]) -> str:
        """Format learned concepts for the prompt."""
        if not concepts:
            return "You haven't explored any concepts yet."
        
        return "You have learned about: " + ", ".join(concepts) + "." 