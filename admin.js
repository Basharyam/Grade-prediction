// Edit user function
async function editUser(userId, currentName, currentEmail) {
  const newName = prompt('Enter new name:', currentName);
  if (!newName) return; // User clicked Cancel on name prompt
  
  const newEmail = prompt('Enter new email:', currentEmail);
  if (!newEmail) return; // User clicked Cancel on email prompt
  
  try {
    console.log('Sending update request for user:', userId); // Debug log
    console.log('Request data:', { name: newName.trim(), email: newEmail.trim() }); // Debug log
    
    const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
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
      showNotification('User updated successfully!', 'success');
      location.reload();
    } else {
      throw new Error(data.message || 'Failed to update user');
    }
  } catch (error) {
    console.error('Error updating user:', error);
    showNotification(error.message || 'Error updating user. Please try again.', 'error');
  }
}

// Delete user function
async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  
  try {
    const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('User deleted successfully!', 'success');
      location.reload();
    } else {
      alert('Failed to delete user: ' + data.message);
    }
  } catch (error) {
    showNotification('Error deleting user. Please try again.', 'error');
    console.error('Error:', error);
  }
}

// Logout function
function logout() {
  // Clear session storage
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
  
  // Redirect to home page
  window.location.href = 'index-chrom.html';
}

// Notification function
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      color: white;
      font-weight: 600;
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
      background: ${type === 'success' ? 'linear-gradient(135deg, #51cf66, #40c057)' : 
                   type === 'error' ? 'linear-gradient(135deg, #ff6b6b, #fa5252)' : 
                   'linear-gradient(135deg, #74c0fc, #4dabf7)'};
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    ">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
      ${message}
    </div>
  `;

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.getElementById('users-table-body');
  const statsDiv = document.getElementById('admin-stats');
  const adminName = document.getElementById('admin-name');
  
  // Set admin name from session storage if available
  const user = sessionStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    if (userData.name) {
      adminName.textContent = userData.name;
    }
  }

  try {
    // Fetch users and predictions in parallel
    const [usersRes, predsRes] = await Promise.all([
      fetch('http://localhost:5000/api/users'),
      fetch('http://localhost:5000/api/admin/predictions')
    ]);
    const usersData = await usersRes.json();
    const predsData = await predsRes.json();
    const predictions = predsData.success ? predsData.predictions : [];
    window._allPredictions = predictions;

    if (usersData.success) {
      // Show stats
      if (statsDiv) {
        const totalUsers = usersData.users.length - 1; // Exclude admin
        statsDiv.innerHTML = `
          <p><strong>Total Users:</strong> ${totalUsers}</p>
          <p><strong>Total Predictions:</strong> ${predictions.length}</p>
        `;
      }
      tableBody.innerHTML = usersData.users
        .filter(user => user.email.toLowerCase() !== 'admin@gmail.com')
        .map(user => {
          const userPreds = predictions.filter(p => p.user_email === user.email);
          const latestPred = userPreds.length > 0 ? userPreds[userPreds.length - 1] : null;
          let historyHtml = latestPred
            ? `<div><strong>${latestPred.target_subject}:</strong> ${latestPred.predicted_score}</div>`
            : '<div>No predictions</div>';
          return `
            <tr>
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
              <td>${historyHtml}</td>
              <td>
                <button onclick="editUser('${user._id}', '${user.name}', '${user.email}')" class="btn btn-sm btn-primary me-2">
                  <i class="fas fa-edit me-1"></i>Edit
                </button>
                <button onclick="showHistoryModal('${user.email}')" class="btn btn-sm btn-info me-2">
                  <i class="fas fa-history me-1"></i>History
                </button>
                <button onclick="deleteUser('${user._id}')" class="btn btn-sm btn-danger">
                  <i class="fas fa-trash-alt me-1"></i>Delete
                </button>
              </td>
            </tr>
          `;
        }).join('');
    } else {
      tableBody.innerHTML = '<tr><td colspan="5">Failed to load users</td></tr>';
    }
  } catch (err) {
    tableBody.innerHTML = '<tr><td colspan="5">Error loading users</td></tr>';
    console.error('Error fetching data:', err);
  }
});

// Modal logic for prediction history
window.showHistoryModal = function(email) {
  const allPreds = window._allPredictions || [];
  const userPreds = allPreds.filter(p => p.user_email === email);
  const modal = document.getElementById('historyModal');
  const modalBody = document.getElementById('historyModalBody');
  if (userPreds.length === 0) {
    modalBody.innerHTML = '<div>No predictions found for this user.</div>';
  } else {
    modalBody.innerHTML = userPreds.map(pred => `
      <div style="margin-bottom:1rem;">
        <div><strong>Target Subject:</strong> ${pred.target_subject}</div>
        <div><strong>Predicted Score:</strong> ${pred.predicted_score}</div>
        <div><strong>Date:</strong> ${new Date(pred.created_at).toLocaleString()}</div>
      </div>
    `).join('');
  }
  modal.style.display = 'block';
  modal.classList.add('show');
  modal.classList.add('d-block');
};

window.closeHistoryModal = function() {
  const modal = document.getElementById('historyModal');
  modal.style.display = 'none';
  modal.classList.remove('show');
  modal.classList.remove('d-block');
};

window.editUser = editUser;
window.deleteUser = deleteUser;