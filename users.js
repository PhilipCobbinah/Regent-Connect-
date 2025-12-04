// User management utilities

const Users = (function() {
  'use strict';

  function sendFriendRequest(fromId, toId) {
    if (!fromId || !toId) return { ok: false, msg: 'Invalid user IDs' };
    if (fromId === toId) return { ok: false, msg: 'Cannot send request to yourself' };

    const users = DB.load(KEYS.USERS, []);
    const toUser = users.find(u => u.id === toId);
    
    // Check privacy settings
    if (toUser && toUser.settings && toUser.settings.blockFriendRequests) {
      return { ok: false, msg: 'This user is not accepting friend requests' };
    }

    const requests = DB.load(KEYS.REQUESTS, []);
    
    // Check if already friends
    const fromUser = users.find(u => u.id === fromId);
    if (fromUser && fromUser.friends && fromUser.friends.includes(toId)) {
      return { ok: false, msg: 'Already friends with this user' };
    }
    
    // Check if request already exists
    const existingRequest = requests.find(r => 
      (r.from === fromId && r.to === toId) || (r.from === toId && r.to === fromId)
    );
    
    if (existingRequest) {
      return { ok: false, msg: 'Friend request already sent' };
    }
    
    const request = {
      id: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      from: fromId,
      to: toId,
      timestamp: new Date().toISOString()
    };
    
    requests.push(request);
    DB.save(KEYS.REQUESTS, requests);
    
    return { ok: true, msg: 'Friend request sent successfully!' };
  }

  function acceptFriendRequest(requestId) {
    const requests = DB.load(KEYS.REQUESTS, []);
    const request = requests.find(r => r.id === requestId);
    
    if (!request) return { ok: false, msg: 'Request not found' };
    
    const users = DB.load(KEYS.USERS, []);
    const fromUser = users.find(u => u.id === request.from);
    const toUser = users.find(u => u.id === request.to);
    
    if (!fromUser || !toUser) {
      return { ok: false, msg: 'User not found' };
    }
    
    // Add to friends list
    if (!fromUser.friends) fromUser.friends = [];
    if (!toUser.friends) toUser.friends = [];
    
    if (!fromUser.friends.includes(toUser.id)) {
      fromUser.friends.push(toUser.id);
    }
    if (!toUser.friends.includes(fromUser.id)) {
      toUser.friends.push(fromUser.id);
    }
    
    // Update users
    DB.save(KEYS.USERS, users);
    
    // Remove request
    const updatedRequests = requests.filter(r => r.id !== requestId);
    DB.save(KEYS.REQUESTS, updatedRequests);
    
    // Update current user if needed
    const currentUser = DB.load(KEYS.CURRENT_USER);
    if (currentUser && (currentUser.id === fromUser.id || currentUser.id === toUser.id)) {
      const updated = users.find(u => u.id === currentUser.id);
      DB.save(KEYS.CURRENT_USER, updated);
    }
    
    return { ok: true, msg: 'Friend request accepted!' };
  }

  function rejectFriendRequest(requestId) {
    const requests = DB.load(KEYS.REQUESTS, []);
    const updatedRequests = requests.filter(r => r.id !== requestId);
    DB.save(KEYS.REQUESTS, updatedRequests);
    return { ok: true, msg: 'Friend request rejected' };
  }

  function areFriends(userId1, userId2) {
    const users = DB.load(KEYS.USERS, []);
    const user = users.find(u => u.id === userId1);
    return user && user.friends && user.friends.includes(userId2);
  }

  function getAllUsers() {
    return DB.load(KEYS.USERS, []);
  }

  function updateUserSettings(userId, settings) {
    const users = DB.load(KEYS.USERS, []);
    const user = users.find(u => u.id === userId);
    
    if (!user) return { ok: false, msg: 'User not found' };
    
    user.settings = { ...user.settings, ...settings };
    DB.save(KEYS.USERS, users);
    
    const currentUser = DB.load(KEYS.CURRENT_USER);
    if (currentUser && currentUser.id === userId) {
      DB.save(KEYS.CURRENT_USER, user);
    }
    
    return { ok: true, msg: 'Settings updated successfully!' };
  }

  return {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    areFriends,
    getAllUsers,
    updateUserSettings
  };
})();

// Export
window.users = Users;
