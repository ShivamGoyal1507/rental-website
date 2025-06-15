function togglePassword() {
  let password = document.getElementById("password");
  let icon = document.querySelector("span[onclick='togglePassword()']");

  if (password.type === "password") {
    password.type = "text";
    icon.textContent = "🙈";
  } else {
    password.type = "password";
    icon.textContent = "👁️";
  }
}

function verify() {
  let valid = true;

  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const number = document.getElementById("number");
  const password = document.getElementById("password");

  // Clear previous error messages
  document.querySelectorAll(".error-msg").forEach(el => el.remove());

  const showError = (element, message) => {
    const error = document.createElement("div");
    error.className = "text-red-600 p-0 m-0 text-[10px] error-msg";
    error.innerText = message;
    element.insertAdjacentElement('afterend', error);
    valid = false;
  }

  if (name.value.trim() === "") {
    showError(name, "Name is required");
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.value.trim())) {
    showError(email, "Enter a valid email");
  }

  const phonePattern = /^\d{10}$/;
  if (!phonePattern.test(number.value.trim())) {
    showError(number, "Phone must be 10 digits");
  }

  if (password.value.length < 6) {
    showError(password, "Min 6 characters required");
  }

  return valid;
}

function cheak() {
  let valid = true;
  // Clear previous error messages
  document.querySelectorAll(".error-msg").forEach(el => el.remove());

  const showError = (element, message) => {
    const error = document.createElement("div");
    error.className = "text-red-600 p-0 m-0 text-[10px] error-msg";
    error.innerText = message;
    element.insertAdjacentElement('afterend', error);
    valid = false;
  }
  const number = document.getElementById("number");
  const password = document.getElementById("password");
  const phonePattern = /^\d{10}$/;
  if (!phonePattern.test(number.value.trim())) {
    showError(number, "Phone must be 10 digits");
  }

  if (password.value.length < 6) {
    showError(password, "Min 6 characters required");
  }

  return valid;
}
document.addEventListener("DOMContentLoaded", function () {
  const rzpButton = document.getElementById('rzp-button');
  if (!rzpButton) return;
  const paymentMethod = document.getElementById("paymentMethod").value;
    const form = document.getElementById("payment-form");

    if (paymentMethod === "Cash") {
      // Directly submit the form for cash payment
      form.submit();
    } else {

 

  rzpButton.onclick = function (e) {
    e.preventDefault();
    console.log("Razorpay button clicked");

    // Get all form values
    const amount = document.getElementById('amountPaid').value;
    const userId = document.getElementById('userId').value;
    const billMonth = document.getElementById('billMonth').value;
    const meterStartReading = document.getElementById('meterStartReading').value;
    const meterEndReading = document.getElementById('meterEndReading').value;
    const notes = document.getElementById('notes').value || "";
    const room = document.getElementById('room').value; // Assuming room = req.params.userId
    const paymentMethod = "Razorpay";
    const status = "Paid"; // Razorpay success = mark as Paid

    if (!amount || !userId || !billMonth || !room) {
      alert("Please fill all required fields.");
      return;
    }

    const options = {
      key: "rzp_test_NjK8nFuf6ancCO", // Replace with live key in production
      amount: amount * 100,
      currency: "INR",
      name: "Electricity Bill",
      description: "Monthly Electricity Bill Payment",

      handler: function (response) {
        // Send bill details and Razorpay ID to the backend
        fetch(`/add_bill/${room}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            userId,
            billMonth,
            amountPaid: amount,
            paymentMethod,
            meterStartReading,
            meterEndReading,
            notes,
            status
          })
        })
          .then(res => res.text()) // 👈 because you're receiving HTML
          .then(html => {
            document.open();
            document.write(html);
            document.close();
          })
          .catch(err => {
            console.error("Payment submission failed:", err);
            alert("Error saving payment.");
          });
      },

      prefill: {
        name: "Test User",
        email: "test@example.com",
        contact: "9999999999"
      },
      theme: {
        color: "#3399cc"
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }
  };
});