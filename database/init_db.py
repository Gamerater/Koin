import sqlite3
import os

# Connect to the database
conn = sqlite3.connect("database/koin.db")
cursor = conn.cursor()

print("1. Reading schema.sql...")
# Open and run your schema file to create the tables
with open('database/schema.sql', 'r') as f:
    cursor.executescript(f.read())
print("   Tables created successfully!")

print("2. Inserting default categories...")
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

# Using "INSERT OR IGNORE" prevents crashes if you run this script multiple times!
cursor.executemany(
    "INSERT OR IGNORE INTO categories (name, icon, color) VALUES (?, ?, ?)", categories
)

print("3. Inserting dummy user...")
# Insert a dummy user so your hardcoded user_id=1 doesn't fail foreign key constraints
cursor.execute(
    "INSERT OR IGNORE INTO users (id, name, email, password) VALUES (1, 'Test User', 'test@koin.com', 'password123')"
)

conn.commit()
conn.close()

print("✅ Database successfully built and ready to go!")