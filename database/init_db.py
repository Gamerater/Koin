import sqlite3

categories = [
    ("Food & Dining", "🍔", "#FF6B6B"),
    ("Transport", "🚗", "#4ECDC4"),
    ("Shopping", "🛍️", "#45B7D1"),
    ("Entertainment", "🎬", "#96CEB4"),
    ("Health", "💊", "#88D8B0"),
    ("Education", "📚", "#FFEAA7"),
    ("Utilities", "💡", "#DDA0DD"),
    ("Other", "📦", "#B0B0B0"),
]

conn = sqlite3.connect("database/koin.db")
cursor = conn.cursor()
cursor.executemany(
    "INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)", categories
)
conn.commit()
conn.close()
print("Categories added!")