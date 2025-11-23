// registration.js
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

let regStream = null;
let regBlob = null;

function startRegCamera(videoId) {
  const video = document.getElementById(videoId);
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Camera API not supported");
    return;
  }
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      regStream = stream;
      video.srcObject = stream;
      video.play();
    })
    .catch((err) => {
      alert("Unable to access camera: " + err);
    });
}

function captureRegFrame(videoId, canvasId) {
  const video = document.getElementById(videoId);
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(
    function (blob) {
      regBlob = blob;
      alert("Image captured");
    },
    "image/jpeg",
    0.9
  );
}

function submitRegistration(formId) {
  const form = document.getElementById(formId);
  const userid = form.querySelector('[name="userid"]').value.trim();
  const name = form.querySelector('[name="name"]').value.trim();
  if (!userid || !name) {
    alert("Please enter userid and name");
    return;
  }
  if (!regBlob) {
    alert("Please capture face first");
    return;
  }
  const fd = new FormData();
  fd.append("userid", userid);
  fd.append("name", name);
  fd.append("image", regBlob, "capture.jpg");

  fetch("/register/submit/", {
    method: "POST",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: fd,
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.status === "success") {
        alert(data.message || "Registration Successful");
        // stop camera
        if (regStream) {
          regStream.getTracks().forEach((t) => t.stop());
          regStream = null;
        }
        regBlob = null;
      } else {
        alert(data.message || "Registration failed");
      }
    })
    .catch((err) => {
      alert("Request error: " + err);
    });
}
