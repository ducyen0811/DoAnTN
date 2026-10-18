# Calorie conversation data

calorie_conversations.jsonl contains 5 synthetic label-arithmetic examples covering the personal goals. This is starter data, not verified food composition or an accuracy benchmark.

The risk classifier is not a calorie model. The current Ollama calorie mode uses prompt instructions; weights have not been fine-tuned. Food input is text, not images.

Before fine-tuning, collect verified food composition from https://fdc.nal.usda.gov/faq/ or product labels. Record source, food ID, date, kcal/100g, edible grams, raw/cooked preparation and oil/sauce. Add Vietnamese recipes and ambiguous portions. Split by food/recipe and evaluate arithmetic, assumptions and goal-specific responses on held-out examples. Do not mix this data into health_dataset.csv.
