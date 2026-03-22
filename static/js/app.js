const API = "http://localhost:5000";

// Load categories into dropdown
async function loadCategories() {
    const res = await fetch(`${API}/get-categories`);
    const categories = await res.json();
    const select = document.getElementById("category");
    select.innerHTML = "";
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.name;
        option.textContent = `${cat.icon} ${cat.name}`;
        select.appendChild(option);
    });
}

// Load and display expenses
async function loadExpenses() {
    const res = await fetch(`${API}/get-expenses?user_id=1`);
    const expenses = await res.json();
    const list = document.getElementById("expense-list");

    if (expenses.length === 0) {
        list.innerHTML = "<p style='color:#aaa; text-align:center;'>No expenses yet!</p>";
        return;
    }

    list.innerHTML = expenses.map(exp => `
        <div class="expense-item">
            <div>
                <div class="expense-title">${exp.title}</div>
                <div class="expense-category">${exp.category} • ${exp.date}</div>
            </div>
            <div class="expense-amount">₹${exp.amount}</div>
        </div>
    `).join("");
}

// Add a new expense
async function addExpense() {
    const title    = document.getElementById("title").value.trim();
    const amount   = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const note     = document.getElementById("note").value.trim();
    const message  = document.getElementById("message");

    if (!title || !amount) {
        message.style.color = "red";
        message.textContent = "Please fill in title and amount!";
        return;
    }

    const res = await fetch(`${API}/add-expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount, category, note, user_id: 1 })
    });

    const data = await res.json();

    if (res.ok) {
        message.style.color = "green";
        message.textContent = "✅ Expense added!";
        document.getElementById("title").value = "";
        document.getElementById("amount").value = "";
        document.getElementById("note").value = "";
        loadExpenses();
        setTimeout(() => message.textContent = "", 3000);
    } else {
        message.style.color = "red";
        message.textContent = "❌ Error: " + data.error;
    }
}

// Run on page load
loadCategories();
loadExpenses();