function updateProfile() {
    const form = document.getElementById("profileForm");
    const formData = new URLSearchParams(new FormData(form)); // Convert FormData to URLSearchParams

    console.log("Form data:", Object.fromEntries(formData.entries())); // Debugging

    fetch('/user/update', {
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