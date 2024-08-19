import hashlib
import requests
import json

def calculate_file_hash(file_path):
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256.update(byte_block)
    return sha256.hexdigest()

def fetch_metadata_by_hash(file_hash):
    api_url = f"https://civitai.com/api/v1/model-versions/by-hash/{file_hash}"
    response = requests.get(api_url)
    if response.status_code == 200:
        return response.json()
    else:
        return {'error': 'Model not found or API error'}

if __name__ == "__main__":
    import sys
    file_path = sys.argv[1]
    file_hash = calculate_file_hash(file_path)
    metadata = fetch_metadata_by_hash(file_hash)
    print(json.dumps(metadata))