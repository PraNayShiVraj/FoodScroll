from typing import List, Set

def calculate_feasibility(user_pantry: List[str], search_input: List[str], recipe_ingredients: List[str]):
    """
    Implements Section 7: Matching & Search Logic [cite: 34, 35, 36]
    """
    available = set(user_pantry) | set(search_input)
    required = set(recipe_ingredients)
    
    missing = required - available
    missing_count = len(missing)
    
    # Internal ranking score [cite: 37, 64]
    match_percentage = (len(required - missing) / len(required)) * 100
    
    return {
        "can_cook": missing_count <= 1, # 'Cookable' feed threshold [cite: 44]
        "missing_ingredients": list(missing),
        "missing_count": missing_count,
        "match_score": round(match_percentage, 2)
    }