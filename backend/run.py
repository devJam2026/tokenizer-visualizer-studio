import uvicorn
import os

if __name__ == "__main__":
    # Start the server on port 8000
    print("Launching Tokenizer Visualizer Studio API Server...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
