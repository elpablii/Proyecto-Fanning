import json
import os

manifest_path = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json"

with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

for cat_name, cat_data in manifest.items():
    if "movieList" not in cat_data: continue
    
    movie_list = cat_data["movieList"]
    
    # Buscamos a Kim Possible
    for i, item in enumerate(movie_list):
        if item["title"] == "Kim Possible" and "episodes" in item:
            kp_series = item
            
            # Find the 2019 movie
            movie_2019 = None
            for j, ep in enumerate(kp_series["episodes"]):
                if "2019" in ep["name"]:
                    movie_2019 = kp_series["episodes"].pop(j)
                    break
            
            if movie_2019:
                # Add to movieList as a separate movie
                new_movie_entry = {
                    "title": "Kim Possible (Película 2019)",
                    "count": movie_2019["count"],
                }
                if "dialogues" in movie_2019:
                    new_movie_entry["dialogues"] = movie_2019["dialogues"]
                    
                movie_list.append(new_movie_entry)
                print(f"Moved Kim Possible (Película 2019) to the main list with {new_movie_entry['count']} words.")
            break

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Finished moving the movie.")
