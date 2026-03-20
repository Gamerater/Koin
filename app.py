from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Hello Guys, this is the basic placeholder for Koin, The development is under progress."

if __name__ == "__main__":
    app.run(debug = True)
