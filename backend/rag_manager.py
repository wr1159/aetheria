import os
import json
from typing import List, Dict, Optional, Any, Tuple
from supabase import create_client, Client
from dotenv import load_dotenv
import numpy as np
from moralis_api import (
    get_wallet_networth, 
    get_portfolio_holdings,
    get_wallet_age,
    get_pnl,
    get_ens
)
import replicate
import logging

# Configure logging
logger = logging.getLogger(__name__)

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
        "type": "function",
        "function": {
            "name": "get_wallet_networth",
            "description": "Returns the net worth of a wallet.",
            "parameters": {
                "type": "object",
                "properties": {
                    "wallet_address": {"type": "string"}
                },
                "required": ["wallet_address"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_wallet_age",
            "description": "Returns wallet age in days since creation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "wallet_address": {"type": "string"}
                },
                "required": ["wallet_address"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_portfolio_holdings",
            "description": "Get top 1 token in the wallet.",
            "parameters": {
                "type": "object",
                "properties": {
                    "wallet_address": {"type": "string"}
                },
                "required": ["wallet_address"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_pnl",
            "description": "Returns profit and loss stats.",
            "parameters": {
                "type": "object",
                "properties": {
                    "wallet_address": {"type": "string"}
                },
                "required": ["wallet_address"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_ens",
            "description": "Returns ENS name of wallet if exists.",
            "parameters": {
                "type": "object",
                "properties": {
                    "wallet_address": {"type": "string"}
                },
                "required": ["wallet_address"]
            }
        }
    }
]

class RAGManager:
    def __init__(self, max_results: int = 3):
        self.max_results = max_results
        self.replicate_api_key = os.environ.get("REPLICATE_API_KEY")

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
            logger.error(f"Error searching knowledge base: {e}")
            return []

    def _get_embedding(self, text: str) -> List[float]:
        """Get embedding for a text using a local model or API."""
        try:
            # Try to use OpenAI embeddings if available
            openai_api_key = os.environ.get("OPENAI_API_KEY")
            if openai_api_key:
                import openai
                openai.api_key = openai_api_key
                
                response = openai.Embedding.create(
                    model="text-embedding-ada-002",
                    input=text
                )
                return response['data'][0]['embedding']
            
            # If OpenAI is not available, return a placeholder
            # In a production environment, you should use a local embedding model
            logger.warning("No embedding model available, using random vector as placeholder")
            return np.random.rand(1536).tolist()  # Placeholder 1536-dim vector
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return np.random.rand(1536).tolist()  # Fallback

    def format_knowledge_for_prompt(self, knowledge: List[Dict]) -> str:
        """Format knowledge base results for the prompt."""
        if not knowledge:
            return ""
        
        formatted = "Relevant knowledge from the blockchain realm:\n\n"
        for item in knowledge:
            formatted += f"- {item['content']}\n"
        
        return formatted

    async def detect_tool_calls(self, message: str, wallet_address: str = None) -> List[Dict]:
        """Detect if the message requires a tool call using Flock IO model."""
        try:
            # Prepare the tools for the Replicate API
            tools = BLOCKCHAIN_TOOLS.copy()
            
            # Check if message contains a wallet address
            wallet_from_message = self._extract_wallet_address(message)
            effective_wallet = wallet_from_message or wallet_address
            
            # Create payload for Replicate API
            payload = {
                "query": message,
                "tools": json.dumps(tools)
            }
            
            # Convert to JSON string for logging
            payload_json = json.dumps(payload)
            logger.info(f"Sending to Flock IO model: {payload_json[:200]}...")
            
            # Call Replicate's Flock IO model
            result = replicate.run(
                "vatsalkshah/flock-web3-foundation-model:3babfa32ab245cf8e047ff7366bcb4d5a2b4f0f108f504c47d5a84e23c02ff5f",
                input={
                    "query": message + "\n Wallet address: " + effective_wallet,
                    "tools": json.dumps(tools),
                    "temperature": 0.7,
                    "max_new_tokens": 1000
                }
            )
            
            logger.info(f"Raw Flock IO response: {result}")
            logger.info(f"Response type: {type(result)}")
            
            # Parse the result to extract function calls
            # Make sure we're using the wallet address from the message if available, or the provided one
            detected_tools = self._parse_flock_result(result, effective_wallet)
            
            # Log the detected tools for debugging
            logger.info(f"Detected tools count: {len(detected_tools)}")
            for i, tool in enumerate(detected_tools):
                logger.info(f"Tool {i+1}: {tool['name']} with params: {tool['parameters']}")
            
            return detected_tools
        except Exception as e:
            logger.error(f"Error detecting tool calls: {e}", exc_info=True)
            return []

    def _extract_wallet_address(self, message: str) -> Optional[str]:
        """Extract ethereum wallet address from message if present."""
        # Simple regex to match Ethereum addresses (0x followed by 40 hex chars)
        import re
        eth_address_pattern = r'0x[a-fA-F0-9]{40}'
        matches = re.findall(eth_address_pattern, message)
        return matches[0] if matches else None

    # Add a new helper method to handle escaped JSON strings
    def _cleanup_json_string(self, json_str: str) -> str:
        """Clean up a JSON string with escaped quotes."""
        # Remove outer quotes if they exist
        if json_str.startswith('"') and json_str.endswith('"'):
            json_str = json_str[1:-1]
        
        # Unescape internal quotes
        json_str = json_str.replace('\\"', '"')
        
        # Clean up any escaped backslashes
        json_str = json_str.replace('\\\\', '\\')
        
        return json_str

    def _parse_flock_result(self, result: str, wallet_address: str = None) -> List[Dict]:
        """Parse the result from Flock IO model to extract function calls."""
        try:
            detected_tools = []
            
            # If result is None or empty, return empty list
            if not result:
                logger.warning("Empty result received from Flock IO model")
                return []
                
            # Handle special case where the result is a list containing a single string with the entire JSON
            if isinstance(result, list) and len(result) == 1 and isinstance(result[0], str):
                # Try to parse the string directly
                single_str = result[0]
                logger.info(f"Handling single string result: {single_str[:100]}...")
                
                # Clean up the string if it appears to be a JSON string with escaped quotes
                if '\\\"' in single_str or single_str.startswith('"') and single_str.endswith('"'):
                    single_str = self._cleanup_json_string(single_str)
                    logger.info(f"Cleaned up JSON string: {single_str[:100]}...")
                
                try:
                    # Try to parse it as a JSON object directly
                    parsed_obj = json.loads(single_str)
                    
                    # Check if it's a function call in OpenAI format
                    if isinstance(parsed_obj, dict) and "type" in parsed_obj and parsed_obj["type"] == "function" and "function" in parsed_obj:
                        func_data = parsed_obj["function"]
                        func_name = func_data.get("name")
                        func_args = func_data.get("arguments", {})
                        
                        # Parse arguments if they're a string
                        if isinstance(func_args, str):
                            try:
                                func_args = json.loads(func_args)
                            except:
                                logger.warning(f"Failed to parse arguments string: {func_args}")
                                func_args = {}
                        
                        # Add wallet address
                        if wallet_address:
                            func_args['wallet_address'] = wallet_address
                        
                        if func_name:
                            detected_tools.append({
                                "name": func_name,
                                "parameters": func_args
                            })
                            logger.info(f"Added tool from single string: {func_name} with params: {func_args}")
                            return detected_tools
                except json.JSONDecodeError:
                    # If we can't parse it directly, continue with regular parsing
                    logger.warning(f"Failed to parse single string as JSON: {single_str[:100]}...")
            
            # Check if the result is already a list of function calls (JSON format) Most likely case
            if isinstance(result, list) or (isinstance(result, str) and result.strip().startswith('[') and result.strip().endswith(']')):
                logger.info(f"Result is a list or JSON array: {result[:100]}...")
                try:
                    # Try to parse as JSON array if it's a string
                    function_calls = result if isinstance(result, list) else json.loads(result)
                    logger.info(f"Parsed function calls: {function_calls}")
                    
                    if isinstance(function_calls, list):
                        for item in function_calls:
                            # Handle case where the function call is a string-encoded JSON
                            if isinstance(item, str):
                                try:
                                    func = json.loads(item)
                                except json.JSONDecodeError:
                                    logger.warning(f"Failed to parse JSON string: {item}")
                                    continue
                            else:
                                func = item
                                
                            # Process the function call based on its structure
                            if isinstance(func, dict):
                                # Handle nested function structure (OpenAI format)
                                if "type" in func and func["type"] == "function" and "function" in func:
                                    func_data = func["function"]
                                    func_name = func_data.get("name")
                                    func_args = func_data.get("arguments", {})
                                    
                                    # If arguments is a string, try to parse it
                                    if isinstance(func_args, str):
                                        try:
                                            func_args = json.loads(func_args)
                                        except:
                                            logger.warning(f"Failed to parse arguments string: {func_args}")
                                            func_args = {}
                                    
                                    # Add the extracted function call
                                    if func_name:
                                        # Handle wallet address in arguments
                                        if 'wallet_address' in func_args:
                                            if not func_args['wallet_address'] or func_args['wallet_address'] == "USER_ADDRESS" or func_args['wallet_address'] == "0xABCDEF1234567890abcdef1234567890ABCDEF12":
                                                if wallet_address:
                                                    func_args['wallet_address'] = wallet_address
                                                else:
                                                    func_args['wallet_address'] = "0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326"  # Default address
                                        elif wallet_address:
                                            # If no wallet_address in args but we have one, add it
                                            func_args['wallet_address'] = wallet_address
                                            
                                        detected_tools.append({
                                            "name": func_name,
                                            "parameters": func_args
                                        })
                                        logger.info(f"Added tool: {func_name} with params: {func_args}")
                                
                                # Handle direct format with name and arguments
                                elif 'name' in func and 'arguments' in func:
                                    func_name = func['name']
                                    func_args = func['arguments']
                                    
                                    # If arguments is a string, try to parse it
                                    if isinstance(func_args, str):
                                        try:
                                            func_args = json.loads(func_args)
                                        except:
                                            logger.warning(f"Failed to parse arguments string: {func_args}")
                                            func_args = {}
                                    
                                    # Handle wallet address in arguments
                                    if 'wallet_address' in func_args:
                                        if not func_args['wallet_address'] or func_args['wallet_address'] == "USER_ADDRESS":
                                            if wallet_address:
                                                func_args['wallet_address'] = wallet_address
                                            else:
                                                func_args['wallet_address'] = "0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326"  # Default address
                                    elif wallet_address:
                                        # If no wallet_address in args but we have one, add it
                                        func_args['wallet_address'] = wallet_address
                                    
                                    detected_tools.append({
                                        "name": func_name,
                                        "parameters": func_args
                                    })
                                    logger.info(f"Added tool: {func_name} with params: {func_args}")
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse raw JSON result: {result}")
            
            # If array parsing fails, try to find individual function objects
            if not detected_tools and isinstance(result, str):
                logger.info(f"Result is a string, trying to find JSON objects:")
                start_idx = result.find("{")
                end_idx = result.rfind("}")
                
                if start_idx != -1 and end_idx != -1:
                    # Extract and parse JSON
                    json_str = result[start_idx:end_idx+1]
                    try:
                        func_call = json.loads(json_str)
                        
                        # Different possible structures
                        if "function" in func_call:
                            # OpenAI-style format
                            func_name = func_call["function"].get("name")
                            func_args = func_call["function"].get("arguments", {})
                            
                            if isinstance(func_args, str):
                                try:
                                    func_args = json.loads(func_args)
                                except:
                                    func_args = {}
                        else:
                            # Simple format
                            func_name = func_call.get("name")
                            func_args = func_call.get("arguments", func_call.get("parameters", {}))
                        
                        # Handle wallet address
                        if wallet_address:
                            func_args['wallet_address'] = wallet_address
                            
                        if func_name:
                            detected_tools.append({
                                "name": func_name,
                                "parameters": func_args
                            })
                            logger.info(f"Added tool from raw JSON: {func_name} with params: {func_args}")
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse JSON from result: {json_str}")
        
            return detected_tools
        except Exception as e:
            logger.error(f"Error parsing Flock result: {e}", exc_info=True)
            return []

    async def execute_tool_call(self, tool_call: Dict) -> Dict:
        """Execute a tool call and return the result."""
        tool_name = tool_call.get("name")
        parameters = tool_call.get("parameters", {})
        wallet_address = parameters.get("wallet_address", "0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326")
        
        logger.info(f"Executing tool call: {tool_name} with parameters {parameters}")
        
        try:
            if tool_name == "get_wallet_networth":
                result = get_wallet_networth(wallet_address)
                return {
                    "tool": "get_wallet_networth",
                    "result": result
                }
            
            elif tool_name == "get_wallet_age":
                result = get_wallet_age(wallet_address)
                return {
                    "tool": "get_wallet_age",
                    "result": result
                }
            
            elif tool_name == "get_portfolio_holdings":
                result = get_portfolio_holdings(wallet_address)
                return {
                    "tool": "get_portfolio_holdings",
                    "result": result
                }
            
            elif tool_name == "get_pnl":
                result = get_pnl(wallet_address)
                return {
                    "tool": "get_pnl",
                    "result": result
                }
            
            elif tool_name == "get_ens":
                result = get_ens(wallet_address)
                return {
                    "tool": "get_ens",
                    "result": result
                }
            
            return {
                "tool": tool_name,
                "result": {"error": "Unknown tool"}
            }
        except Exception as e:
            logger.error(f"Error executing tool call: {e}")
            return {
                "tool": tool_name,
                "result": {"error": f"Error executing tool: {str(e)}"}
            }

    def format_tool_result_for_prompt(self, tool_result: Dict) -> str:
        """Format tool call result for the prompt."""
        tool_name = tool_result.get("tool")
        result = tool_result.get("result", {})
        
        try:
            if tool_name == "get_wallet_networth":
                if result:
                    return f"Wallet Net Worth: {json.dumps(result, indent=2)}"
                return "I couldn't retrieve the wallet's net worth."
            
            elif tool_name == "get_wallet_age":
                if result:
                    return f"Wallet Age: {result}"
                return "I couldn't determine the wallet's age."
            
            elif tool_name == "get_portfolio_holdings":
                if result and isinstance(result, list) and len(result) > 0:
                    holdings_text = "Portfolio Holdings:\n"
                    for item in result:
                        if isinstance(item, dict):
                            token = item.get("name", "Unknown Token")
                            symbol = item.get("symbol", "??")
                            value = item.get("usd_value", "unknown")
                            percentage = item.get("portfolio_percentage", "0")
                            holdings_text += f"- {token} ({symbol}): ${value} ({percentage}% of portfolio)\n"
                    return holdings_text
                return "I couldn't retrieve the wallet's holdings."
            
            elif tool_name == "get_pnl":
                if result:
                    return f"Profit and Loss Information: {json.dumps(result, indent=2)}"
                return "I couldn't retrieve profit and loss information."
            
            elif tool_name == "get_ens":
                if result:
                    return f"ENS Name: {result}"
                return "This wallet doesn't have an associated ENS name."
            
            return f"Tool Result: {json.dumps(result)}"
        except Exception as e:
            logger.error(f"Error formatting tool result: {e}")
            return f"Tool result available but couldn't be formatted properly."

    async def classify_user_intent(self, message: str, wallet_address: str = None) -> Tuple[str, Dict]:
        """
        Classify user intent and return appropriate action.
        Returns: (intent_type, action_data)
        intent_type: "memory", "rag", "tool_call", or "general"
        """
        message_lower = message.lower()
        
        # Check for tool call intent using Flock IO model
        tool_calls = await self.detect_tool_calls(message, wallet_address)
        if tool_calls:
            return "tool_call", {"tools": tool_calls}
        
        # Check for factual question intent
        factual_question_indicators = ["what is", "how does", "explain", "define", "tell me about"]
        for indicator in factual_question_indicators:
            if indicator in message_lower:
                return "rag", {"query": message}
        
        # Default to general conversation
        return "general", {} 