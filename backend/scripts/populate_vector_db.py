"""
Script to populate the blockchain_knowledge table with embeddings.
This should be run after creating the database schema.

Usage:
    python populate_vector_db.py

Requirements:
    - Supabase credentials in .env file
    - An embedding model (this example uses OpenAI's API)
"""

import os
import json
import numpy as np
from typing import List, Dict
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
if os.path.isfile('.env'):
    load_dotenv()
elif os.path.isfile('../.env'):
    load_dotenv('../.env')

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Check if OpenAI API key is set (if using OpenAI's embeddings)
openai_api_key = os.environ.get("OPENAI_API_KEY")
use_openai = openai_api_key is not None

if use_openai:
    import openai
    openai.api_key = openai_api_key

# Sample blockchain knowledge to populate
SAMPLE_KNOWLEDGE = [
    {
        "title": "What is a DAO?",
        "content": "A DAO (Decentralized Autonomous Organization) is an organization represented by rules encoded as a computer program that is transparent, controlled by organization members and not influenced by a central government. DAOs are a form of investor-directed venture capital fund, with no key decision makers and a fully transparent and verifiable set of rules.",
        "category": "concepts",
        "source": "Ethereum Foundation"
    },
    {
        "title": "What is a Smart Contract?",
        "content": "A smart contract is a self-executing contract with the terms of the agreement between buyer and seller being directly written into lines of code. The code and the agreements contained therein exist across a distributed, decentralized blockchain network.",
        "category": "concepts",
        "source": "Ethereum Foundation"
    },
    {
        "title": "What is Gas?",
        "content": "Gas is the fee required to successfully conduct a transaction or execute a contract on the Ethereum blockchain. Gas fees are paid in ETH and are used to compensate miners for the computational resources they use to process and validate transactions.",
        "category": "concepts",
        "source": "Ethereum Foundation"
    },
    {
        "title": "What is a Wallet?",
        "content": "A cryptocurrency wallet is a digital wallet that stores the information needed to transact bitcoins and other cryptocurrencies. A wallet contains a pair of cryptographic keys: a public key, which is shared with others to receive funds, and a private key, which must be kept secret and is used to sign transactions.",
        "category": "concepts",
        "source": "Ethereum Foundation"
    },
    {
        "title": "What is Mining?",
        "content": "Mining is the process of creating new bitcoins and validating transactions on the blockchain. Miners use specialized hardware to solve complex mathematical puzzles, and the first miner to solve the puzzle gets to add the next block to the blockchain and receive a reward.",
        "category": "concepts",
        "source": "Ethereum Foundation"
    },
    {
        "title": "What is a Blockchain?",
        "content": "A blockchain is a distributed digital ledger that records transactions across many computers so that the record cannot be altered retroactively without the alteration of all subsequent blocks. This allows the participants to verify and audit transactions independently and relatively inexpensively.",
        "category": "concepts",
        "source": "Ethereum Foundation"
    },
    {
        "title": "What is a Token?",
        "content": "A token is a digital asset created on a blockchain that represents a particular fungible or non-fungible asset. Tokens can represent essentially any assets that are fungible and tradeable, from commodities to loyalty points to even other cryptocurrencies.",
        "category": "concepts",
        "source": "Ethereum Foundation"
    },
    {
        "title": "What is Staking?",
        "content": "Staking is the process of actively participating in transaction validation (similar to mining) on a proof-of-stake (PoS) blockchain. On these blockchains, anyone with a minimum-required balance of a specific cryptocurrency can validate transactions and earn staking rewards.",
        "category": "concepts",
        "source": "Ethereum Foundation"
    },
    {
        "title": "What is DeFi?",
        "content": "DeFi, or Decentralized Finance, refers to an ecosystem of financial applications built on blockchain networks. DeFi aims to create an open-source, permissionless, and transparent financial service ecosystem that is available to everyone and operates without any central authority.",
        "category": "concepts",
        "source": "Ethereum Foundation"
    },
    {
        "title": "What is an NFT?",
        "content": "NFT stands for Non-Fungible Token. It's a special type of cryptographic token which represents something unique; non-fungible tokens are thus not mutually interchangeable. This is in contrast to cryptocurrencies like Bitcoin, and many network or utility tokens that are fungible in nature.",
        "category": "concepts",
        "source": "Ethereum Foundation"
    }
]

def get_embedding_openai(text: str) -> List[float]:
    """Get embedding for a text using OpenAI's API."""
    try:
        response = openai.Embedding.create(
            model="text-embedding-ada-002",
            input=text
        )
        return response['data'][0]['embedding']
    except Exception as e:
        print(f"Error getting OpenAI embedding: {e}")
        # Return a random embedding as a fallback
        return np.random.rand(1536).tolist()

def get_embedding_mock() -> List[float]:
    """Get a mock embedding (random vector)."""
    return np.random.rand(1536).tolist()

def get_embedding(text: str) -> List[float]:
    """Get embedding for a text using available method."""
    if use_openai:
        return get_embedding_openai(text)
    else:
        return get_embedding_mock()

def populate_database():
    """Populate the database with sample blockchain knowledge and embeddings."""
    print("Starting to populate vector database...")
    
    # Check if the database already has data
    response = supabase.table('blockchain_knowledge').select('count').execute()
    count = response.data[0]['count'] if response.data else 0
    
    if count > 0:
        print(f"Database already has {count} entries. Skipping population.")
        return
    
    for item in SAMPLE_KNOWLEDGE:
        try:
            # Get embedding for the content
            content_text = f"{item['title']} {item['content']}"
            embedding = get_embedding(content_text)
            
            # Insert into database
            supabase.table('blockchain_knowledge').insert({
                'title': item['title'],
                'content': item['content'],
                'embedding': embedding,
                'category': item['category'],
                'source': item['source']
            }).execute()
            
            print(f"Added entry: {item['title']}")
        except Exception as e:
            print(f"Error adding entry {item['title']}: {e}")
    
    print("Database population completed.")

if __name__ == "__main__":
    populate_database() 