/* =========================================
   KOIN FRONTEND LOGIC
   ========================================= */

// Configuration
// Change this URL when you deploy your Flask app to Render
const API_BASE_URL = ''; 
const USER_ID = 1; // Hardcoded for now, will be dynamic after login implementation

// CSS Theme Colors for Chart.js
const getThemeColor = (variable) => getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

document.addEventListener('DOMContentLoaded', () => {
    // 1. Things that should run on EVERY page (like the theme toggle)
    initThemeToggle();
    
    // 2. The Router: Figure out what page we are on
    const currentPage = document.body.getAttribute('data-page');

    // 3. Only run the code meant for that specific page
    switch (currentPage) {
        case 'dashboard':
            fetchDashboardData();
            break;
            
        case 'add-transaction':
            initAddTransactionPage();
            break;
            
        // You can easily add future pages here!
        // case 'analytics':
        //     initAnalyticsPage();
        //     break;
    }
});

/* =========================================
   THEME TOGGLE (DARK/LIGHT MODE)
   ========================================= */
function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    const icon = themeBtn.querySelector('i');
    
    // Check local storage for saved theme
    const savedTheme = localStorage.getItem('koin-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(icon, savedTheme);

    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('koin-theme', newTheme);
        updateThemeIcon(icon, newTheme);
        
        // Re-render charts to update colors
        fetchDashboardData(); 
    });
}

function updateThemeIcon(iconElement, theme) {
    if (theme === 'dark') {
        iconElement.classList.remove('fa-moon');
        iconElement.classList.add('fa-sun');
    } else {
        iconElement.classList.remove('fa-sun');
        iconElement.classList.add('fa-moon');
    }
}

/* =========================================
   API CALLS TO FLASK BACKEND
   ========================================= */
async function fetchDashboardData() {
    try {
        // Run both fetches simultaneously for speed
        const [expensesRes, categoriesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/get-expenses?user_id=${USER_ID}`).catch(() => null),
            fetch(`${API_BASE_URL}/get-categories`).catch(() => null)
        ]);

        let expenses = [];
        let categories = [];

        // Check if Flask is running and returned OK
        if (expensesRes && expensesRes.ok) {
            expenses = await expensesRes.json();
        } else {
            console.warn("Flask backend not reachable or returned an error. Using dummy data for development.");
            expenses = getDummyExpenses();
        }

        if (categoriesRes && categoriesRes.ok) {
            categories = await categoriesRes.json();
        } else {
            categories = getDummyCategories();
        }

        updateUI(expenses, categories);

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

/* =========================================
   UI UPDATES & CHART RENDERING
   ========================================= */
function updateUI(expenses, categories) {
    // 1. Calculate Total Spend
    const totalSpend = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('display-total-amount').innerText = `$${totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2})}`;

    // 2. Render Category Mix
    renderCategoryList(expenses, categories);

    // 3. Render Charts
    renderLineChart(expenses);
    renderDonutChart(totalSpend, 4000); // Assuming 4000 is a hardcoded monthly budget for now
}

function renderCategoryList(expenses, categories) {
    const listContainer = document.getElementById('category-list');
    listContainer.innerHTML = ''; // Clear loading text

    // Group expenses by category
    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    // Create DOM elements
    categories.forEach(cat => {
        const total = categoryTotals[cat.name] || 0;
        if (total === 0) return; // Skip empty categories

        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = `
            <div class="cat-left">
                <div class="cat-dot" style="background-color: ${cat.color}"></div>
                <span>${cat.name}</span>
            </div>
            <div class="cat-right">$${total.toLocaleString()}</div>
        `;
        listContainer.appendChild(item);
    });
}

// Chart.js Instances (Stored globally to destroy them before re-rendering)
let mainChartInstance = null;
let budgetChartInstance = null;

function renderLineChart(expenses) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    if (mainChartInstance) mainChartInstance.destroy();

    // Chart.js styling variables based on current theme
    const textColor = getThemeColor('--text-muted');
    const gridColor = getThemeColor('--border-color');
    const primaryNavy = '#1A3C5E';

    // Simple grouping by day (Mon-Sun) for demo purposes
    // In production, you would parse the 'date' field from your expenses table
    const data = [1200, 1500, 1400, 2840, 2100, 1800, 2400]; 

    mainChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
            datasets: [{
                label: 'Spend',
                data: data,
                borderColor: primaryNavy,
                backgroundColor: 'rgba(26, 60, 94, 0.1)',
                borderWidth: 3,
                tension: 0.4, // smooth curves
                fill: true,
                pointBackgroundColor: primaryNavy,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: primaryNavy,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10, family: 'Inter' } } },
                y: { display: false, min: 0 } // Hide Y axis like the design
            }
        }
    });
}

function renderDonutChart(spent, budget) {
    const ctx = document.getElementById('budgetChart').getContext('2d');
    
    if (budgetChartInstance) budgetChartInstance.destroy();

    const percentage = Math.min(Math.round((spent / budget) * 100), 100);
    document.getElementById('budget-percentage').innerText = `${percentage}%`;

    const remaining = budget - spent;
    const isOverBudget = spent > budget;
    
    // Update status text
    const statusText = document.querySelector('.budget-status-text');
    if (isOverBudget) {
        statusText.innerHTML = `You are <strong>over budget</strong> by $${Math.abs(remaining).toLocaleString()} this month.`;
    } else {
        statusText.innerHTML = `You are <strong>under budget</strong> by $${remaining.toLocaleString()} this month. Keep it up!`;
    }

    const primaryNavy = '#1A3C5E';
    const bgColor = getThemeColor('--border-color');

    budgetChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Utilized', 'Remaining'],
            datasets: [{
                data: [spent, Math.max(remaining, 0)],
                backgroundColor: [primaryNavy, bgColor],
                borderWidth: 0,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            animation: { animateScale: true }
        }
    });
}

/* =========================================
   DUMMY DATA (Fallback if Flask is off)
   ========================================= */
function getDummyExpenses() {
    return [
        { id: 1, category: 'Dining & Living', amount: 1420, date: '2023-10-25' },
        { id: 2, category: 'Transport', amount: 640, date: '2023-10-24' },
        { id: 3, category: 'Leisure', amount: 310, date: '2023-10-23' },
        { id: 4, category: 'Other', amount: 185, date: '2023-10-22' }
    ];
}

function getDummyCategories() {
    return [
        { id: 1, name: 'Dining & Living', color: '#EF4444' }, // Red
        { id: 2, name: 'Transport', color: '#06B6D4' },       // Cyan
        { id: 3, name: 'Leisure', color: '#F5A623' },         // Gold
        { id: 4, name: 'Other', color: '#6B7280' }            // Gray
    ];
}

/* =========================================
   ADD TRANSACTION PAGE LOGIC
   ========================================= */

// Check if we are on the Add Transaction page before running this code
document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    
    if (transactionForm) {
        initAddTransactionPage();
    }
});

async function initAddTransactionPage() {
    // 1. Set today's date as default
    document.getElementById('date').valueAsDate = new Date();

    // 2. Fetch categories for the dropdown
    populateCategoryDropdown();

    // 3. Handle Form Submission
    const form = document.getElementById('transaction-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent page reload
        
        const submitBtn = document.getElementById('submit-btn');
        const messageEl = document.getElementById('form-message');
        
        // UI Loading State
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        messageEl.innerText = '';

        // Gather Data matching your backend SQLite schema
        const expenseData = {
            user_id: USER_ID,
            title: document.getElementById('title').value,
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            note: document.getElementById('note').value,
            is_recurring: document.getElementById('is_recurring').Checked
        };

        try {
            // POST to your Flask backend
            const response = await fetch(`${API_BASE_URL}/add-expense`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(expenseData)
            });

            if (response.ok) {
                // Success!
                messageEl.style.color = 'var(--success-color)';
                messageEl.innerText = 'Transaction added successfully!';
                form.reset();
                document.getElementById('date').valueAsDate = new Date(); // Reset date to today
                
                // Optional: redirect back to dashboard after 1.5s
                setTimeout(() => window.location.href = '/', 1500);
            } else {
                throw new Error("Server returned an error.");
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
            messageEl.style.color = 'var(--danger-color)';
            messageEl.innerText = 'Failed to add transaction. Please try again.';
        } finally {
            // Reset Button State
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Add Transaction';
        }
    });
}

async function populateCategoryDropdown() {
    const categorySelect = document.getElementById('category');
    
    try {
        let categories = [];
        const res = await fetch(`${API_BASE_URL}/get-categories`).catch(() => null);
        
        if (res && res.ok) {
            categories = await res.json();
        } else {
            // Fallback to dummy data if Flask isn't ready
            categories = getDummyCategories();
        }

        // Add options to dropdown
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error loading categories:", error);
    }
}