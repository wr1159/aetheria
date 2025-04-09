import os
import json
from typing import List, Dict, Optional, Any, Tuple
from supabase import create_client, Client
from dotenv import load_dotenv
import numpy as np
from moralis_api import get_wallet_information, get_wallet_networth, get_portfolio_holdings

# Load environment variables
if os.path.isfile('.env'):
    load_dotenv()
elif os.path.isfile('../.env'):
    load_dotenv('../.env')

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Define blockchain tools
BLOCKCHAIN_TOOLS = [

    {
        "name": "get_wallet_balance",
        "description": "Get the ETH balance of a wallet",
        "parameters": {
            "type": "object",
            "properties": {
                "address": {
                    "type": "string",
                    "description": "The Ethereum wallet address"
                }
            },
            "required": ["address"]
        }
    },
    {
        "name": "get_wallet_nfts",
        "description": "Get the NFTs owned by a wallet",
        "parameters": {
            "type": "object",
            "properties": {
                "address": {
                    "type": "string",
                    "description": "The Ethereum wallet address"
                }
            },
            "required": ["address"]
        }
    },
    {
        "name": "get_gas_price",
        "description": "Get the current gas price on Ethereum",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    }
]

class RAGManager:
    def __init__(self, max_results: int = 3):
        self.max_results = max_results

    async def search_knowledge_base(self, query: str) -> List[Dict]:
        """Search the knowledge base for relevant information."""
        try:
            # Use Supabase's vector search if available
            response = supabase.rpc(
                'match_documents',
                {
                    'query_embedding': self._get_embedding(query),
                    'match_threshold': 0.7,
                    'match_count': self.max_results
                }
            ).execute()
            
            return response.data
        except Exception as e:
            print(f"Error searching knowledge base: {e}")
            return []

    def _get_embedding(self, text: str) -> List[float]:
        """Get embedding for a text using a local model or API."""
        # This is a placeholder - you would use a real embedding model
        # For example: OpenAI's text-embedding-ada-002 or a local model
        return np.random.rand(1536).tolist()  # Placeholder 1536-dim vector

    def format_knowledge_for_prompt(self, knowledge: List[Dict]) -> str:
        """Format knowledge base results for the prompt."""
        if not knowledge:
            return ""
        
        formatted = "Relevant knowledge from the blockchain realm:\n\n"
        for item in knowledge:
            formatted += f"- {item['content']}\n"
        
        return formatted

    def detect_tool_calls(self, message: str) -> List[Dict]:
        """Detect if the message requires a tool call."""
        detected_tools = []
        
        # Simple keyword-based detection
        message_lower = message.lower()
        
        if "balance" in message_lower and "wallet" in message_lower:
            detected_tools.append({
                "name": "get_wallet_balance",
                "parameters": {"address": "USER_ADDRESS"}  # Placeholder
            })
        
        if "nft" in message_lower or "token" in message_lower:
            detected_tools.append({
                "name": "get_wallet_nfts",
                "parameters": {"address": "USER_ADDRESS"}  # Placeholder
            })
        
        if "gas" in message_lower or "fee" in message_lower:
            detected_tools.append({
                "name": "get_gas_price",
                "parameters": {}
            })
        
        return detected_tools

    async def execute_tool_call(self, tool_call: Dict) -> Dict:
        """Execute a tool call and return the result."""
        tool_name = tool_call.get("name")
        parameters = tool_call.get("parameters", {})
        
        if tool_name == "get_wallet_balance":
            # Extract address from parameters or use a default
            address = parameters.get("address", "0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326")
            wallet_info = get_wallet_information(address)
            return {
                "tool": "get_wallet_balance",
                "result": wallet_info
            }
        
        elif tool_name == "get_wallet_nfts":
            # Extract address from parameters or use a default
            address = parameters.get("address", "0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326")
            # This would call a function to get NFTs
            return {
                "tool": "get_wallet_nfts",
                "result": {"message": "NFT data would be retrieved here"}
            }
        
        elif tool_name == "get_gas_price":
            # This would call a function to get gas price
            return {
                "tool": "get_gas_price",
                "result": {"message": "Gas price data would be retrieved here"}
            }
        
        return {
            "tool": tool_name,
            "result": {"error": "Unknown tool"}
        }

    def format_tool_result_for_prompt(self, tool_result: Dict) -> str:
        """Format tool call result for the prompt."""
        tool_name = tool_result.get("tool")
        result = tool_result.get("result", {})
        
        if tool_name == "get_wallet_balance":
            if isinstance(result, dict) and "wallet_networth" in result:
                networth = result["wallet_networth"]
                return f"The wallet's net worth is {networth} ETH."
            return "I couldn't retrieve the wallet balance."
        
        elif tool_name == "get_wallet_nfts":
            return f"Here's information about the wallet's NFTs: {json.dumps(result)}"
        
        elif tool_name == "get_gas_price":
            return f"Current gas price information: {json.dumps(result)}"
        
        return f"Tool result: {json.dumps(result)}"

    def classify_user_intent(self, message: str) -> Tuple[str, Dict]:
        """
        Classify user intent and return appropriate action.
        Returns: (intent_type, action_data)
        intent_type: "memory", "rag", "tool_call", or "general"
        """
        message_lower = message.lower()
        
        # Check for tool call intent
        tool_calls = self.detect_tool_calls(message)
        if tool_calls:
            return "tool_call", {"tools": tool_calls}
        
        # Check for factual question intent
        factual_question_indicators = ["what is", "how does", "explain", "define", "tell me about"]
        for indicator in factual_question_indicators:
            if indicator in message_lower:
                return "rag", {"query": message}
        
        # Default to general conversation
        return "general", {} 