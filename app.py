from flask import Flask, request, jsonify, render_template
import sqlite3
from datetime import date

app = Flask(__name__)

def get_db():
    conn = sqlite3.connect("database/koin.db")
    conn.row_factory = sqlite3.Row #lets you access columns by names
    return conn

# TEST ROUTE
@app.route("/")
def home():
    return render_template("index.html")

# ADD EXPENSE
@app.route("/add-expense", methods = ["POST"])
def add_expense():
    data = request.get_json()
    print("Recieved data:", data)

    if not data: 
        return jsonify({"error": "No JSON recieved"}), 400

    title = data.get("title")
    amount = data.get("amount")
    category = data.get("category", "Other")
    note = data.get("note", "")
    date_val = data.get("date", str(date.today()))
    user_id = data.get("user_id", 1) #hardcoded for now, login comes later

    if title is None or amount is None:
        return jsonify({"error": "title and amount are required"}), 400

    conn = get_db()
    conn.execute(
        "INSERT INTO expenses (user_id, title, amount, category, date, note) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, title, amount, category, date_val, note)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Expenses added successfully!"}), 201

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
