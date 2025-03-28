import os
from supabase import create_client, Client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def upload_image(temp_filename):
    try:
        with open((temp_filename), "rb") as f:
            response = (
                supabase.storage
                .from_("aetheria")
                .upload(
                    file=f,
                    path=temp_filename,
                    file_options={"cache-control": "3600", "upsert": "false"}
                )
            )
            image_url = response["url"]
    except Exception as e:
        raise e
    # finally:
    #     # Clean up temporary file
    #     if os.path.exists(temp_filename):
    #         os.remove(temp_filename)
    return image_url