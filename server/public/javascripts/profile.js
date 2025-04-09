/* === Handles profile updates, avatar uploads, course enrollments, and friend request management. === */
function updateProfile() {
    const form = document.getElementById("profileForm");
    const formData = new URLSearchParams(new FormData(form)); // Convert FormData to URLSearchParams

    console.log("Form data:", Object.fromEntries(formData.entries())); // Debugging

    fetch('profile/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // Set the content type to URL-encoded
      },
      body: formData.toString(), // Send data as a URL-encoded string
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Profile updated successfully!');
        } else {
          alert('Error updating profile: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An unexpected error occurred.');
      });
}

function uploadAvatar(input) {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    fetch('profile/upload-avatar', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          //alert('Avatar updated successfully!');
          location.reload(); 
        } else {
          alert('Error updating avatar: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An unexpected error occurred.');
      });
}

// For edit courses: Enroll in a course
async function enrollCourse() {
    const courseId = document.getElementById('availableCourses').value;
    if (courseId) {
      try {
        const response = await fetch('profile/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, action: 'enroll' })
        });
        const result = await response.json();
        if (result.success) {
          alert(result.message);
          location.reload(); // Reload to update the course lists
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('Error enrolling in course:', error);
        alert('An error occurred while enrolling in the course.');
      }
    } else {
      alert('Please select a course to enroll.');
    }
}

// For edit courses: Deselect a course
async function deselectCourse() {
    const courseId = document.getElementById('enrolledCourses').value;
    if (courseId) {
      try {
        const response = await fetch('profile/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, action: 'deselect' })
        });
        const result = await response.json();
        if (result.success) {
          alert(result.message);
          location.reload(); // Reload to update the course lists
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('Error deselecting course:', error);
        alert('An error occurred while deselecting the course.');
      }
    } else {
      alert('Please select a course to deselect.');
    }
}

// For accepting and declining friend requests
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.friend-request-item').forEach(item => {
    const studentIdSender = item.getAttribute('data-student-id-sender');
    const studentIdReceiver = item.getAttribute('data-student-id-receiver');

    const acceptBtn = item.querySelector('.accept');
    const declineBtn = item.querySelector('.decline');

    // Handle accepting the friend request
    if (acceptBtn) {
      acceptBtn.addEventListener('click', event => {
        event.preventDefault();

        fetch('profile/friend-request/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `studentIdSender=${encodeURIComponent(studentIdSender)}&studentIdReceiver=${encodeURIComponent(studentIdReceiver)}`
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            item.remove(); // Remove the friend request from the UI
          } else {
            alert('Error accepting request: ' + data.error);
          }
        })
        .catch(err => {
          console.error('Error accepting friend request:', err);
        });
      });
    }

    // Handle declining the friend request
    if (declineBtn) {
      declineBtn.addEventListener('click', event => {
        event.preventDefault();

        fetch('profile/friend-request/decline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `studentIdSender=${encodeURIComponent(studentIdSender)}&studentIdReceiver=${encodeURIComponent(studentIdReceiver)}`
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            item.remove(); // Remove the declined request from the UI
          } else {
            alert('Error declining request: ' + data.error);
          }
        })
        .catch(err => {
          console.error('Error declining friend request:', err);
        });
      });
    }
  });
});
