-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
-- Create blockchain knowledge table with vector embeddings
CREATE TABLE IF NOT EXISTS blockchain_knowledge (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    category TEXT,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Create function to match documents based on embedding similarity
CREATE
OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
) RETURNS TABLE (
    id bigint,
    title text,
    content text,
    similarity float
) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT blockchain_knowledge.id,
    blockchain_knowledge.title,
    blockchain_knowledge.content,
    1 - (
        blockchain_knowledge.embedding <=> query_embedding
    ) as similarity
FROM blockchain_knowledge
WHERE 1 - (
        blockchain_knowledge.embedding <=> query_embedding
    ) > match_threshold
ORDER BY blockchain_knowledge.embedding <=> query_embedding
LIMIT match_count;
END;
$$;
-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_blockchain_knowledge_embedding ON blockchain_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- Insert some sample blockchain knowledge
INSERT INTO blockchain_knowledge (title, content, category, source)
VALUES (
        'What is a DAO?',
        'A DAO (Decentralized Autonomous Organization) is an organization represented by rules encoded as a computer program that is transparent, controlled by organization members and not influenced by a central government. DAOs are a form of investor-directed venture capital fund, with no key decision makers and a fully transparent and verifiable set of rules.',
        'concepts',
        'Ethereum Foundation'
    ),
    (
        'What is a Smart Contract?',
        'A smart contract is a self-executing contract with the terms of the agreement between buyer and seller being directly written into lines of code. The code and the agreements contained therein exist across a distributed, decentralized blockchain network.',
        'concepts',
        'Ethereum Foundation'
    ),
    (
        'What is Gas?',
        'Gas is the fee required to successfully conduct a transaction or execute a contract on the Ethereum blockchain. Gas fees are paid in ETH and are used to compensate miners for the computational resources they use to process and validate transactions.',
        'concepts',
        'Ethereum Foundation'
    ),
    (
        'What is a Wallet?',
        'A cryptocurrency wallet is a digital wallet that stores the information needed to transact bitcoins and other cryptocurrencies. A wallet contains a pair of cryptographic keys: a public key, which is shared with others to receive funds, and a private key, which must be kept secret and is used to sign transactions.',
        'concepts',
        'Ethereum Foundation'
    ),
    (
        'What is Mining?',
        'Mining is the process of creating new bitcoins and validating transactions on the blockchain. Miners use specialized hardware to solve complex mathematical puzzles, and the first miner to solve the puzzle gets to add the next block to the blockchain and receive a reward.',
        'concepts',
        'Ethereum Foundation'
    );