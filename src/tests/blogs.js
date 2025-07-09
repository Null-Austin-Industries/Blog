log = (...args) =>{
    console.log(`[Logging] `,...args);
}

const db = require('../libs/db');

// Test suite for Blogs functionality
console.log('=== BLOGS FUNCTIONALITY TEST SUITE ===\n');

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

// Helper function to create test user
function createTestUser() {
    try {
        // Try to get the test user first
        const existingUser = db.users.getUser('test_blog_user');
        if (existingUser) {
            return existingUser;
        }
        
        // Create a new test user if one doesn't exist
        db.users.createUser(
            'test_blog_user',
            'password123',
            'test_blog@example.com',
            'default.png',
            'Test user for blog tests',
            1,
            ['user'],
            'Blog Test User'
        );
        
        return db.users.getUser('test_blog_user');
    } catch (error) {
        console.error('Failed to create test user:', error);
        throw error;
    }
}

// Test 1: Create a blog post
let testPostId;
runTest('Creating a Blog Post', () => {
    const testUser = createTestUser();
    log(`Creating blog post for user ID: ${testUser.id}`);
    
    db.blogs.createPost(
        testUser.id, 
        'This is a test blog post content with some formatting.\n\nSecond paragraph here.',
        'published'
    );
    
    // Get the created post (assuming it's the latest one for this user)
    const userPosts = db.blogs.getPostsByUser(testUser.id);
    const latestPost = userPosts[userPosts.length - 1];
    
    log(`Created post with ID: ${latestPost.id}`);
    console.log('Post content:', latestPost.content);
    
    // Store the post ID for later tests
    testPostId = latestPost.id;
    
    if (!latestPost || !latestPost.content.includes('test blog post')) {
        throw new Error('Blog post creation failed');
    }
});

// Test 2: Get post by ID
runTest('Getting Post by ID', () => {
    log(`Retrieving post by ID: ${testPostId}`);
    
    const post = db.blogs.getPostById(testPostId);
    console.log('Retrieved post:', post);
    
    if (!post || post.id !== testPostId) {
        throw new Error('Failed to retrieve blog post by ID');
    }
});

// Test 3: Get all posts
runTest('Getting All Posts', () => {
    log('Retrieving all blog posts');
    
    const allPosts = db.blogs.getAllPosts();
    console.log(`Retrieved ${allPosts.length} posts`);
    
    if (!Array.isArray(allPosts)) {
        throw new Error('getAllPosts did not return an array');
    }
});

// Test 4: Get posts by user
runTest('Getting Posts by User', () => {
    const testUser = createTestUser();
    log(`Retrieving posts for user ID: ${testUser.id}`);
    
    const userPosts = db.blogs.getPostsByUser(testUser.id);
    console.log(`Retrieved ${userPosts.length} posts for user`);
    
    if (!Array.isArray(userPosts)) {
        throw new Error('getPostsByUser did not return an array');
    }
    
    // Check if our test post is in the results
    const postExists = userPosts.some(post => post.id === testPostId);
    if (!postExists) {
        throw new Error('Test post not found in user posts');
    }
});

// Test 5: Update a post
runTest('Updating a Blog Post', () => {
    log(`Updating post ID: ${testPostId}`);
    
    const updates = {
        content: 'This is an updated blog post content',
        status: 'draft'
    };
    
    db.blogs.updatePost(testPostId, updates);
    
    // Verify the update
    const updatedPost = db.blogs.getPostById(testPostId);
    console.log('Updated post:', updatedPost);
    
    if (!updatedPost || updatedPost.content !== updates.content || updatedPost.status !== updates.status) {
        throw new Error('Post update failed');
    }
    
    // Check that updated_at timestamp has changed
    const now = new Date();
    const updatedAt = new Date(updatedPost.updated_at);
    const timeDiff = now - updatedAt;
    
    // Check if updated within the last minute (allowing for some execution time)
    if (timeDiff > 60000) {
        throw new Error('updated_at timestamp was not properly updated');
    }
});

// Test 6: Delete a post
runTest('Deleting a Blog Post', () => {
    // First create a post specifically for deletion
    const testUser = createTestUser();
    log(`Creating a temporary post for user ID: ${testUser.id} to test deletion`);
    
    db.blogs.createPost(
        testUser.id, 
        'This post will be deleted',
        'published'
    );
    
    // Get the created post (assuming it's the latest one for this user)
    const userPosts = db.blogs.getPostsByUser(testUser.id);
    const postToDelete = userPosts[userPosts.length - 1];
    const deletePostId = postToDelete.id;
    
    log(`Deleting post ID: ${deletePostId}`);
    db.blogs.deletePost(deletePostId);
    
    // Verify the deletion
    const deletedPost = db.blogs.getPostById(deletePostId);
    console.log('Post after deletion attempt:', deletedPost);
    
    if (deletedPost) {
        throw new Error('Post was not deleted successfully');
    }
});

// Test 7: Create posts with different statuses
runTest('Creating Posts with Different Statuses', () => {
    const testUser = createTestUser();
    
    log(`Creating draft post for user ID: ${testUser.id}`);
    db.blogs.createPost(testUser.id, 'This is a draft post', 'draft');
    
    log(`Creating published post for user ID: ${testUser.id}`);
    db.blogs.createPost(testUser.id, 'This is a published post', 'published');
    
    log(`Creating archived post for user ID: ${testUser.id}`);
    db.blogs.createPost(testUser.id, 'This is an archived post', 'archived');
    
    // Get posts and verify statuses exist
    const userPosts = db.blogs.getPostsByUser(testUser.id);
    
    const hasDraft = userPosts.some(post => post.status === 'draft');
    const hasPublished = userPosts.some(post => post.status === 'published');
    const hasArchived = userPosts.some(post => post.status === 'archived');
    
    if (!hasDraft || !hasPublished || !hasArchived) {
        throw new Error('Failed to create posts with different statuses');
    }
});

// Test 8: Test error handling with invalid post ID
runTest('Error Handling with Invalid Post ID', () => {
    log('Attempting to get post with invalid ID');
    
    const nonExistentPost = db.blogs.getPostById(-999);
    console.log('Result with non-existent ID:', nonExistentPost);
    
    if (nonExistentPost !== undefined) {
        throw new Error('Should return undefined for non-existent post ID');
    }
});

// Test 9: Test error handling with invalid user ID
runTest('Error Handling with Invalid User ID', () => {
    log('Attempting to get posts for invalid user ID');
    
    const nonExistentUserPosts = db.blogs.getPostsByUser(-999);
    console.log('Result with non-existent user ID:', nonExistentUserPosts);
    
    if (!Array.isArray(nonExistentUserPosts) || nonExistentUserPosts.length !== 0) {
        throw new Error('Should return empty array for non-existent user ID');
    }
});

// Test 10: Test performance for retrieving posts
runTest('Performance Test for Retrieving Posts', () => {
    const { performance } = require('perf_hooks');
    
    log('Testing getAllPosts performance');
    const startGetAll = performance.now();
    db.blogs.getAllPosts();
    const endGetAll = performance.now();
    
    log(`getAllPosts execution time: ${(endGetAll - startGetAll).toFixed(2)}ms`);
    
    // Can add more specific performance tests here if needed
});

console.log('\n=== BLOGS TEST SUITE COMPLETED ===');
