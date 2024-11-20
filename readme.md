# **Social Media Platform API - ASSIGNMENT**

This document describes the database schema for a social media platform. It includes three primary collections: **Users**, **Posts**, and **Friend Requests**. These schemas define the relationships and structure of the data in the MongoDB database.

---

## **Database Collections**

### **1. User Schema**
The **Users** collection stores information about the platform's users.

#### **Fields**
- **`username`**: A unique, trimmed string for the user's display name.
- **`email`**: A unique, lowercase string representing the user's email address.
- **`password`**: A securely hashed string for user authentication.
- **`profilePicture`**: (Optional) A string to store the URL of the user's profile picture. Defaults to `/default-profile.png`.
- **`friends`**: An array of references to other users (stored as user IDs).
- **`createdAt`**: The timestamp when the user account was created (default to the current time).

---

### **2. Post Schema**
The **Posts** collection stores all user-generated content on the platform.

#### **Fields**
- **`author`**: A reference to the user who created the post (stored as a user ID).
- **`content`**: A string containing the post's text, limited to 1000 characters.
- **`comments`**: An array of objects, where each object includes:
  - **`author`**: A reference to the user who added the comment (stored as a user ID).
  - **`content`**: A string containing the comment text.
  - **`createdAt`**: The timestamp of when the comment was created.
- **`createdAt`**: The timestamp of when the post was created (default to the current time).

---

### **3. Friend Request Schema**
The **Friend Requests** collection tracks all friend request activities between users.

#### **Fields**
- **`sender`**: A reference to the user who sent the friend request (stored as a user ID).
- **`receiver`**: A reference to the user who received the friend request (stored as a user ID).
- **`status`**: A string indicating the request status. Possible values:
  - **`pending`**
  - **`accepted`**ds
  - **`rejected`**
- **`createdAt`**: The timestamp when the friend request was sent (default to the current time).

---

## **Relationships**

1. **Users and Posts**: Each post is linked to its creator via the `author` field, referencing the `User` collection.
2. **Users and Friends**: The `friends` field in the `User` collection holds references to other user IDs.
3. **Friend Requests**: The `sender` and `receiver` fields link friend requests to users.

---# API Endpoints

## Authentication
- **POST** `/api/auth/register`: Register a new user.
- **POST** `/api/auth/login`: Login a user and receive a JWT token.

## Friends
- **POST** `/api/friends/request`: Send a friend request.
- **PUT** `/api/friends/request/:requestId`: Accept or reject a friend request using status (accepted or rejected).
- **GET** `/api/friends/requests`: Retrieve all pending friend requests for the current user.

## Posts
- **POST** `/api/posts`: Create a new post.
- **GET** `/api/feed`: Retrieve a personalized feed with posts from friends or comments from friends.


