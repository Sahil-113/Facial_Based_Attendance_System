// attendance.js
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

let attStream = null;
let attBlob = null;

function startAttCamera(videoId) {
  const video = document.getElementById(videoId);
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Camera API not supported");
    return;
  }
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      attStream = stream;
      video.srcObject = stream;
      video.play();
    })
    .catch((err) => {
      alert("Unable to access camera: " + err);
    });
}

function captureAttFrame(videoId, canvasId) {
  const video = document.getElementById(videoId);
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(
    function (blob) {
      attBlob = blob;
      alert("Image captured");
    },
    "image/jpeg",
    0.9
  );
}

function submitAttendance(formId) {
  const form = document.getElementById(formId);
  const userid = form.querySelector('[name="userid"]').value.trim();
  if (!userid) {
    alert("Please enter userid");
    return;
  }
  if (!attBlob) {
    alert("Please capture face first");
    return;
  }
  const fd = new FormData();
  fd.append("userid", userid);
  fd.append("image", attBlob, "capture_att.jpg");

  fetch("/attendance/submit/", {
    method: "POST",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: fd,
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.status === "success") {
        alert(data.message || "Attendance recorded");
        // stop camera
        if (attStream) {
          attStream.getTracks().forEach((t) => t.stop());
          attStream = null;
        }
        attBlob = null;
      } else {
        alert(data.message || "Attendance failed");
      }
    })
    .catch((err) => {
      alert("Request error: " + err);
    });
}
