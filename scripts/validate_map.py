import json
import os
import sys

def validate_campus_data():
    """
    Validates the integrity of the campus_points.json data file.
    Checks for:
    1. Valid JSON format
    2. Required fields (id, x, y, z, c)
    3. Data types
    4. Duplicate IDs
    """
    
    file_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'campus_points.json')
    print(f"🔍 Inspecting data file: {file_path}")

    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ Error: campus_points.json not found!")
        sys.exit(1)
    except json.JSONDecodeError:
        print("❌ Error: Invalid JSON format!")
        sys.exit(1)

    print(f"✅ JSON Loaded successfully. Found {len(data)} points.")
    
    existing_ids = set()
    errors = 0

    for index, point in enumerate(data):
        # Check required fields
        required_fields = ['id', 'x', 'y', 'z', 'c']
        for field in required_fields:
            if field not in point:
                print(f"⚠️  Error at index {index}: Missing field '{field}'")
                errors += 1
        
        # Check ID uniqueness
        if 'id' in point:
            if point['id'] in existing_ids:
                print(f"⚠️  Error at index {index}: Duplicate ID detected: {point['id']}")
                errors += 1
            existing_ids.add(point['id'])

        # Check coordinate types
        for coord in ['x', 'y', 'z']:
            if coord in point and not isinstance(point[coord], (int, float)):
                print(f"⚠️  Error at index {index}: '{coord}' must be a number.")
                errors += 1

    if errors == 0:
        print("\n🎉 SUCCESS: Data integrity check passed! The map data is clean.")
        print(f"📊 Stats: {len(data)} Unique Points validated.")
        sys.exit(0)
    else:
        print(f"\n❌ FAILED: Found {errors} errors in the dataset.")
        sys.exit(1)

if __name__ == "__main__":
    print("--- KLE CONNECT DATA VALIDATOR ---\n")
    validate_campus_data()
