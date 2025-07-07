log = (...args) =>{
    console.log(`[Logging] `,...args);
}

const db = require('../libs/db');

// Test suite for Database functionality
console.log('=== DATABASE FUNCTIONALITY TEST SUITE ===\n');

// Helper function to run tests with error handling
function runTest(testName, testFunction) {
    console.log(`\n--- ${testName} ---`);
    try {
        testFunction();
        console.log('✅ Test passed');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Test 1: Create multiple users
runTest('Creating Test Users', () => {
    log('Creating admin user');
    db.users.createUser('admin','admin123','admin@example.com','default.png','super duper cool admin :D',0,['admin','user'],'Admin');
    
    log('Creating regular user');
    db.users.createUser('john_doe','password123','john@example.com','avatar.jpg','Just a regular user',1,['user'],'John Doe');
    
    log('Creating inactive user');
    db.users.createUser('inactive_user','pass456','inactive@example.com','default.png','Inactive account',0,['user'],'Inactive User');
    
    log('Creating moderator user');
    db.users.createUser('moderator','mod123','mod@example.com','mod.png','I moderate things',1,['user','moderator'],'Moderator');
});

// Test 2: Get user by username
runTest('Getting User by Username', () => {
    log('Getting admin user');
    const admin = db.users.getUser('admin');
    console.log('Admin user:', admin);
    
    log('Getting non-existent user');
    const nonExistent = db.users.getUser('nonexistent');
    console.log('Non-existent user:', nonExistent);
    
    if (admin && admin.username === 'admin') {
        log('✅ Admin user retrieved successfully');
    } else {
        throw new Error('Failed to retrieve admin user');
    }
    
    if (nonExistent === undefined) {
        log('✅ Non-existent user correctly returns undefined');
    } else {
        throw new Error('Non-existent user should return undefined');
    }
});

// Test 3: Get user by ID
runTest('Getting User by ID', () => {
    log('Getting user by ID 1');
    const user1 = db.users.getUserById(1);
    console.log('User ID 1:', user1);
    
    log('Getting user by non-existent ID');
    const user999 = db.users.getUserById(999);
    console.log('User ID 999:', user999);
    
    if (user1 && user1.id === 1) {
        log('✅ User retrieved by ID successfully');
    } else {
        throw new Error('Failed to retrieve user by ID');
    }
});

// Test 4: Get all users
runTest('Getting All Users', () => {
    log('Getting all users');
    const allUsers = db.users.getAllUsers();
    console.log(`Total users: ${allUsers.length}`);
    
    allUsers.forEach((user, index) => {
        console.log(`User ${index + 1}: ${user.username} (${user.display_name})`);
    });
    
    if (allUsers.length >= 4) {
        log('✅ All users retrieved successfully');
    } else {
        throw new Error('Expected at least 4 users');
    }
});

// Test 5: User login functionality
runTest('User Login Tests', () => {
    log('Testing successful login');
    const loginResult = db.users.login('admin','admin123');
    console.log('Login result:', loginResult);
    
    if (loginResult && loginResult.token) {
        log('✅ Successful login with token generation');
    } else {
        throw new Error('Login should return user with token');
    }
    
    log('Testing failed login - wrong password');
    const failedLogin = db.users.login('admin','wrongpassword');
    console.log('Failed login result:', failedLogin);
    
    if (failedLogin === null) {
        log('✅ Failed login correctly returns null');
    } else {
        throw new Error('Failed login should return null');
    }
    
    log('Testing failed login - non-existent user');
    const nonExistentLogin = db.users.login('nonexistent','password');
    console.log('Non-existent user login result:', nonExistentLogin);
    
    if (nonExistentLogin === null) {
        log('✅ Non-existent user login correctly returns null');
    } else {
        throw new Error('Non-existent user login should return null');
    }
});

// Test 6: User modification
runTest('User Modification Tests', () => {
    log('Modifying user bio and email');
    const userToModify = db.users.getUser('john_doe');
    
    if (userToModify) {
        const updates = {
            bio: 'Updated bio for John Doe',
            email: 'newemail@example.com',
            is_active: 1
        };
        
        db.users.modifyUser(userToModify.id, updates);
        
        const modifiedUser = db.users.getUserById(userToModify.id);
        console.log('Modified user:', modifiedUser);
        
        if (modifiedUser.bio === updates.bio && modifiedUser.email === updates.email) {
            log('✅ User modification successful');
        } else {
            throw new Error('User modification failed');
        }
    } else {
        throw new Error('User to modify not found');
    }
});

// Test 7: User blacklisting
runTest('User Blacklisting Tests', () => {
    log('Blacklisting inactive user');
    const userToBlacklist = db.users.getUser('inactive_user');
    
    if (userToBlacklist) {
        db.users.blacklistUser(userToBlacklist.id, 'Suspicious activity detected');
        
        const blacklistedUser = db.users.getUserById(userToBlacklist.id);
        console.log('Blacklisted user:', blacklistedUser);
        
        if (blacklistedUser.status === 'blacklisted' && blacklistedUser.status_reason === 'Suspicious activity detected') {
            log('✅ User blacklisting successful');
        } else {
            throw new Error('User blacklisting failed');
        }
    } else {
        throw new Error('User to blacklist not found');
    }
});

// Test 8: Token generation
runTest('Token Generation Tests', () => {
    log('Testing token generation');
    const token1 = db.users.randomToken();
    const token2 = db.users.randomToken(64);
    const token3 = db.users.randomToken(32);
    
    console.log('Token 1 (default length):', token1);
    console.log('Token 2 (64 bytes):', token2);
    console.log('Token 3 (32 bytes):', token3);
    
    if (token1 && token1.length === 256 && // 128 bytes * 2 (hex)
        token2 && token2.length === 128 && // 64 bytes * 2 (hex)
        token3 && token3.length === 64) {   // 32 bytes * 2 (hex)
        log('✅ Token generation working correctly');
    } else {
        throw new Error('Token generation failed');
    }
    
    // Test token uniqueness
    if (token1 !== token2 && token2 !== token3 && token1 !== token3) {
        log('✅ Tokens are unique');
    } else {
        throw new Error('Tokens should be unique');
    }
});

// Test 9: Edge cases and error handling
runTest('Edge Cases and Error Handling', () => {
    log('Testing empty username');
    try {
        db.users.createUser('','password','test@example.com');
        // If we get here, the empty username was allowed
        log('⚠️ Empty username was allowed (database constraint may be missing)');
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed') || 
            error.message.includes('NOT NULL constraint failed') ||
            error.message.includes('constraint')) {
            log('✅ Empty username properly rejected');
        } else {
            throw error;
        }
    }
    
    log('Testing duplicate username');
    try {
        db.users.createUser('admin','newpassword','duplicate@example.com');
        throw new Error('Should not allow duplicate username');
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            log('✅ Duplicate username properly rejected');
        } else {
            throw error;
        }
    }
    
    log('Testing modification of non-existent user');
    try {
        db.users.modifyUser(999, { bio: 'test' });
        log('✅ Modification of non-existent user handled gracefully');
    } catch (error) {
        console.log('Note: Modification of non-existent user threw error:', error.message);
    }
    
    log('Testing blacklisting non-existent user');
    try {
        db.users.blacklistUser(999, 'test reason');
        log('✅ Blacklisting non-existent user handled gracefully');
    } catch (error) {
        console.log('Note: Blacklisting non-existent user threw error:', error.message);
    }
});

// Test 10: Data integrity and JSON fields
runTest('Data Integrity and JSON Fields', () => {
    log('Testing JSON field parsing');
    const user = db.users.getUser('admin');
    
    if (user) {
        console.log('User permissions (raw):', user.permissions);
        console.log('User posts (raw):', user.posts);
        console.log('User followers (raw):', user.followers);
        console.log('User following (raw):', user.following);
        console.log('User settings (raw):', user.settings);
        console.log('User notifications (raw):', user.notifications);
        
        // Test JSON parsing
        try {
            const permissions = JSON.parse(user.permissions);
            const posts = JSON.parse(user.posts);
            const followers = JSON.parse(user.followers);
            const following = JSON.parse(user.following);
            const settings = JSON.parse(user.settings);
            const notifications = JSON.parse(user.notifications);
            
            console.log('Parsed permissions:', permissions);
            console.log('Parsed posts:', posts);
            console.log('Parsed followers:', followers);
            console.log('Parsed following:', following);
            console.log('Parsed settings:', settings);
            console.log('Parsed notifications:', notifications);
            
            if (Array.isArray(permissions) && Array.isArray(posts)) {
                log('✅ JSON fields are properly formatted');
            } else {
                throw new Error('JSON fields not properly formatted');
            }
        } catch (error) {
            throw new Error('JSON parsing failed: ' + error.message);
        }
    } else {
        throw new Error('Admin user not found for JSON field testing');
    }
});

console.log('\n=== TEST SUITE COMPLETED ===');

// Final summary
console.log('\n=== FINAL DATABASE STATE ===');
console.log('All users in database:');
const finalUsers = db.users.getAllUsers();
finalUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.username} (${user.display_name}) - Status: ${user.status} - Active: ${user.is_active ? 'Yes' : 'No'}`);
});

console.log('\n=== ADDITIONAL FUNCTIONALITY TESTS ===');

// Test password security (note: in production, passwords should be hashed)
runTest('Password Security Check', () => {
    log('Checking if passwords are stored in plain text (this should be improved for production)');
    const user = db.users.getUser('admin');
    if (user && user.password === 'admin123') {
        log('⚠️ WARNING: Passwords are stored in plain text! Consider implementing hashing.');
    }
    log('✅ Password storage format identified');
});

// Test multiple login attempts
runTest('Multiple Login Attempts', () => {
    log('Testing multiple login attempts with different credentials');
    
    // Test successful login with different user
    const moderatorLogin = db.users.login('moderator', 'mod123');
    if (moderatorLogin && moderatorLogin.token) {
        log('✅ Moderator login successful');
    }
    
    // Test multiple failed attempts
    for (let i = 1; i <= 3; i++) {
        const failedAttempt = db.users.login('admin', `wrongpass${i}`);
        if (failedAttempt === null) {
            log(`✅ Failed attempt ${i} correctly rejected`);
        }
    }
});

// Test user data completeness
runTest('User Data Completeness', () => {
    log('Checking data completeness for all users');
    const users = db.users.getAllUsers();
    
    users.forEach(user => {
        const requiredFields = ['id', 'username', 'password', 'created_at', 'permissions'];
        const missingFields = requiredFields.filter(field => !user[field]);
        
        if (missingFields.length === 0) {
            log(`✅ User ${user.username} has all required fields`);
        } else {
            log(`⚠️ User ${user.username} missing fields: ${missingFields.join(', ')}`);
        }
    });
});

console.log('\nCheck the results above to see which tests passed or failed.');
console.log('For production use, consider implementing:');
console.log('- Password hashing (bcrypt, scrypt, or similar)');
console.log('- Input validation and sanitization');
console.log('- Rate limiting for login attempts');
console.log('- SQL injection protection (better prepared statements)');
console.log('- Token expiration and refresh mechanisms');