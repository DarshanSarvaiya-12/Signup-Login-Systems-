const API_URL =
  "https://YOUR-RENDER-BACKEND.onrender.com";


// =====================================
// SIGNUP
// =====================================

const signupForm =
  document.getElementById("signupForm");

if (signupForm) {

  signupForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const name =
        document.getElementById("name")
          .value;

      const email =
        document.getElementById("email")
          .value;

      const password =
        document.getElementById("password")
          .value;

      const confirmPassword =
        document
          .getElementById("confirmPassword")
          .value;


      const message =
        document.getElementById("message");

      const button =
        document.getElementById(
          "signupButton"
        );


      button.disabled = true;

      button.textContent =
        "Creating account...";

      message.textContent = "";


      try {

        const response =
          await fetch(
            `${API_URL}/api/auth/signup`,
            {

              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              credentials: "include",

              body: JSON.stringify({

                name,

                email,

                password,

                confirmPassword

              })

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          message.textContent =
            data.message;

          button.disabled = false;

          button.textContent =
            "Create account";

          return;
        }


        message.textContent =
          "Account created. Redirecting...";


        window.location.href =
          "dashboard.html";


      } catch (error) {

        console.error(error);

        message.textContent =
          "Unable to connect to server.";

        button.disabled = false;

        button.textContent =
          "Create account";
      }

    }
  );

}


// =====================================
// LOGIN
// =====================================

const loginForm =
  document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const email =
        document
          .getElementById("loginEmail")
          .value;

      const password =
        document
          .getElementById("loginPassword")
          .value;


      const message =
        document.getElementById("message");

      const button =
        document.getElementById(
          "loginButton"
        );


      button.disabled = true;

      button.textContent =
        "Logging in...";

      message.textContent = "";


      try {

        const response =
          await fetch(
            `${API_URL}/api/auth/login`,
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              credentials: "include",

              body: JSON.stringify({

                email,

                password

              })

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          message.textContent =
            data.message;

          button.disabled = false;

          button.textContent =
            "Login";

          return;
        }


        message.textContent =
          "Login successful...";


        window.location.href =
          "dashboard.html";


      } catch (error) {

        console.error(error);

        message.textContent =
          "Unable to connect to server.";

        button.disabled = false;

        button.textContent =
          "Login";
      }

    }
  );

}