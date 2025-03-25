from moralis import evm_api
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables from .env file
# First check if .env exists in the current directory
if os.path.isfile('.env'):
    load_dotenv()
# Also check if it exists in the parent directory (project root)
elif os.path.isfile('../.env'):
    load_dotenv('../.env')
else:
    print("WARNING: No .env file found in current or parent directory.")

# Get API key from environment variables
API_KEY = os.environ.get("MORALIS_API_KEY")

# Check if API key exists
if not API_KEY:
    print("WARNING: MORALIS_API_KEY environment variable not set.")
    print("Please create a .env file with: MORALIS_API_KEY=your_api_key")

def get_wallet_summary(address):
    try:
        params = {
            "chain": "eth",
            "order": "DESC",
            "address": address
        }

        raw_results = evm_api.wallets.get_wallet_history(
            api_key=API_KEY,
            params=params,
        )
        results = raw_results["result"]
        results = list(map(lambda x: x["summary"], results))
        print("===Wallet Summary===")
        print(results)
        return results
    except Exception as e:
        print(f"Error in get_wallet_summary: {e}")
        return None

def get_portfolio_holdings(address):
    try:
        params = {
            "chain": "eth",
            "address": address,
            "exclude_spam": True,
            "exclude_unverified_contracts": True,
        }

        raw_results = evm_api.wallets.get_wallet_token_balances_price(
            api_key=API_KEY,
            params=params,
        )
        results = raw_results["result"]
        new_results = [{} for _ in range(len(results))]

        
        for index, result in enumerate(results):
            new_results[index]["portfolio_percentage"] = result["portfolio_percentage"]
            new_results[index]["usd_value"] = result["usd_value"]
            new_results[index]["token_address"] = result["token_address"]
            new_results[index]["symbol"] = result["symbol"]
            new_results[index]["name"] = result["name"]
        # sort by portfolio percentage
        new_results = sorted(new_results, key=lambda x: x["portfolio_percentage"], reverse=True)
        # filter top 5 only
        new_results = new_results[:5]

        print("===Portfolio Holdings===")
        print(new_results)
        return new_results
    except Exception as e:
        print(f"Error in get_portfolio_holdings: {e}")
        return None

def get_wallet_networth(address):
    try:
        params = {
            "chain": "eth",
            "address": address,
            "exclude_spam": True,
            "exclude_unverified_contracts": True,
        }

        result = evm_api.wallets.get_wallet_net_worth(
            api_key=API_KEY,
            params=params,
        )
        print("===Wallet Networth===")
        print(result)
        return result
    except Exception as e:
        print(f"Error in get_wallet_networth: {e}")
        return None

# Result
def get_wallet_age(address):
    try:
        params = {
            "address": address,
            "chains": ["eth","base","optimism"]
        }
        
        result = evm_api.wallets.get_wallet_active_chains(
            api_key=API_KEY,
            params=params
        )

        first_transaction = None
        last_transaction = None
        wallet_age = None
        for chain in result['active_chains']:
            if chain['first_transaction'] is not None:
                if first_transaction is None:
                    first_transaction = chain['first_transaction']['block_timestamp']
                else:
                    first_transaction = min(chain['first_transaction']['block_timestamp'], first_transaction)
            if chain['last_transaction'] is not None:
                if last_transaction is None:
                    last_transaction = chain['last_transaction']['block_timestamp']
                else:
                    last_transaction = max(chain['last_transaction']['block_timestamp'], last_transaction)
        if (first_transaction is not None) and (last_transaction is not None):
            # convert to datetime and calculate wallet age
            first_transaction = datetime.fromisoformat(first_transaction.replace('Z', '+00:00'))
            last_transaction = datetime.fromisoformat(last_transaction.replace('Z', '+00:00'))
            wallet_age = last_transaction - first_transaction

        print("===Wallet Age===")   
        print(wallet_age)
        return str(wallet_age)
    except Exception as e:
        print(f"Error in get_chain_activity: {e}")
        return None

def get_pnl(address):
    try:
        params = {
            "chain": "eth",
            "address": address
        }

        result = evm_api.wallets.get_wallet_profitability_summary(
            api_key=API_KEY,
            params=params,
        )
        print("===PnL===")
        print(result)
        return result
    except Exception as e:
        print(f"Error in get_pnl: {e}")
        return None

def get_ens(address):
    try:
        params = {
        "address": address
        }

        ens = evm_api.resolve.resolve_address(
        api_key=API_KEY,
        params=params,
        )
        return ens

    except Exception as e:
        print(f"Error in get_ens: {e}")
        return None
    


def get_wallet_information(address):
    """Retrieve and display comprehensive wallet information"""
    print(f"\nGetting wallet information for: {address}\n")
    
    # First check if API key is set
    if not API_KEY:
        print("ERROR: Cannot fetch wallet information. MORALIS_API_KEY is not set.")
        return None
    
    results = {}
    results["ens"] = get_ens(address)
    results["wallet_age"] = get_wallet_age(address)
    # results["wallet_summary"] = get_wallet_summary(address)
    results["portfolio_holdings"] = get_portfolio_holdings(address)
    results["wallet_networth"] = get_wallet_networth(address)
    results["pnl"] = get_pnl(address)
    
    return results

# Only run if this script is executed directly
if __name__ == "__main__":
    test_address = "0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326"
    results = get_wallet_information(test_address)
    print(results)