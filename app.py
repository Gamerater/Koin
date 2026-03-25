from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
from datetime import date

app = Flask(__name__)
CORS(app)

def get_db():
    conn = sqlite3.connect("database/koin.db")
    conn.row_factory = sqlite3.Row # lets you access columns by names
    return conn

# ==========================================
# PAGE ROUTES (Serves the HTML UI)
# ==========================================

@app.route("/")
def home():
    return render_template("index.html")

# NEW: Added route for the Add Transaction screen
@app.route("/add")
def add_transaction_page():
    return render_template("add.html")


# ==========================================
# API ROUTES (Handles Data)
# ==========================================

# ADD EXPENSE
@app.route("/add-expense", methods = ["POST"])
def add_expense():
    data = request.get_json()
    print("Received data:", data)

    if not data: 
        return jsonify({"error": "No JSON received"}), 400

    title = data.get("title")
    amount = data.get("amount")
    category = data.get("category", "Other")
    note = data.get("note", "")
    date_val = data.get("date", str(date.today()))
    user_id = data.get("user_id", 1) # hardcoded for now, login comes later

    is_recurring = data.get("is_recurring", False)

    if title is None or amount is None:
        return jsonify({"error": "title and amount are required"}), 400

    conn = get_db()
    conn.execute(
        "INSERT INTO expenses (user_id, title, amount, category, date, note, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (user_id, title, amount, category, date_val, note, is_recurring)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Expense added successfully!"}), 201

# GET ALL EXPENSES
@app.route("/get-expenses", methods = ["GET"])
def get_expenses():
    user_id = request.args.get("user_id", 1)
    conn = get_db()
    expenses = conn.execute(
        "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC",
        (user_id,)
    ).fetchall()
    conn.close()

    return jsonify([dict(row) for row in expenses]), 200

# GET CATEGORIES
@app.route("/get-categories" , methods = ["GET"])
def get_categories():
    conn = get_db()
    categories = conn.execute("SELECT * FROM categories").fetchall()
    conn.close()

    return jsonify([dict(row) for row in categories]), 200


if __name__ == "__main__":
    app.run(debug=True)