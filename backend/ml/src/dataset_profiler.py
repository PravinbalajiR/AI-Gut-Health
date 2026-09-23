import pandas as pd
import pdfplumber
import os

def profile_usda():
    print("--- Profiling USDA FoodData Central ---")
    usda_dir = "../datasets/USDA/FoodData_Central_csv_2026-04-30"
    
    # Read a small chunk of the huge food.csv
    food_df = pd.read_csv(os.path.join(usda_dir, "food.csv"), nrows=1000)
    print("food.csv (first 1000 rows):")
    print(food_df.info())
    
    branded_df = pd.read_csv(os.path.join(usda_dir, "branded_food.csv"), nrows=1000)
    print("\nbranded_food.csv (first 1000 rows):")
    print(branded_df.info())
    
    nutrient_df = pd.read_csv(os.path.join(usda_dir, "nutrient.csv"))
    print("\nnutrient.csv:")
    print(nutrient_df.head(10)[['id', 'name', 'unit_name']])

def profile_ifct():
    print("\n--- Profiling IFCT 2017 ---")
    pdf_path = "../IFCT2017_16122024.pdf"
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"IFCT PDF has {len(pdf.pages)} pages.")
            # Extract text from a page that likely has data (e.g., page 50)
            if len(pdf.pages) > 50:
                page = pdf.pages[50]
                text = page.extract_text()
                print("Sample text from page 50:")
                print(text[:500] + "...")
    except Exception as e:
        print(f"Error reading PDF: {e}")

if __name__ == "__main__":
    profile_usda()
    profile_ifct()
