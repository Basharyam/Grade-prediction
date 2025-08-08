// Edit user function
async function editUser(userId, currentName, currentEmail) {
  const newName = prompt('Enter new name:', currentName);
  if (!newName) return; // User clicked Cancel on name prompt
  
  const newEmail = prompt('Enter new email:', currentEmail);
  if (!newEmail) return; // User clicked Cancel on email prompt
  
  try {
    console.log('Sending update request for user:', userId); // Debug log
    console.log('Request data:', { name: newName.trim(), email: newEmail.trim() }); // Debug log
    
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: newName.trim(),
        email: newEmail.trim()
      })
    });
    
    const rawText = await response.text();
    console.log('Raw server response:', rawText); // Debug log

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      console.error('Server response:', response.status, rawText);
      throw new Error(`Server returned ${response.status}: ${rawText}`);
    }

    if (!data) {
      throw new Error('Invalid JSON response from server');
    }

    if (data.success) {
      alert('User updated successfully!');
      location.reload();
    } else {
      throw new Error(data.message || 'Failed to update user');
    }
  } catch (error) {
    console.error('Error updating user:', error);
    alert(error.message || 'Error updating user. Please try again.');
  }
}

// Delete user function
async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    if (data.success) {
      // Refresh the page to show updated data
      location.reload();
    } else {
      alert('Failed to delete user: ' + data.message);
    }
  } catch (error) {
    alert('Error deleting user');
    console.error('Error:', error);
  }
}

// Logout function
function logout() {
  // Clear session storage
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
  
  // Redirect to home page
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.getElementById('users-table-body');
  const statsDiv = document.getElementById('admin-stats');
  try {
    const res = await fetch('/api/users');
    const data = await res.json();
    if (data.success) {
      // Show stats
      if (statsDiv) {
        const totalUsers = data.users.length-1;
        const recentLogins = data.users
        statsDiv.innerHTML = `
          <p><strong>Total Users:</strong> ${totalUsers}</p>
         
        `;
      }
      tableBody.innerHTML = data.users
        .filter(user => user.email.toLowerCase() !== 'admin@gmail.com')
        .map(user => `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
            <td>
              <button onclick="editUser('${user._id}', '${user.name}', '${user.email}')" class="btn btn-sm btn-primary me-2">
                <i class="fas fa-edit me-1"></i>Edit
              </button>
              <button onclick="deleteUser('${user._id}')" class="btn btn-sm btn-danger">
                <i class="fas fa-trash-alt me-1"></i>Delete
              </button>
            </td>
          </tr>
        `).join('');
    } else {
      tableBody.innerHTML = '<tr><td colspan="3">Failed to load users</td></tr>';
    }
  } catch (err) {
    tableBody.innerHTML = '<tr><td colspan="3">Error loading users</td></tr>';
  }
 
});