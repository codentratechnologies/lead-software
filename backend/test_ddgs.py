from ddgs import DDGS
import json

def test():
    try:
        results = DDGS().text("software companies in pune", max_results=2)
        print(json.dumps(list(results), indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test()
