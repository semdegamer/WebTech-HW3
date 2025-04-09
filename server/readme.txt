Group 46

Fayo Weng - 7485549
Sem Mathan - 2269775
Emma Bout - 2382024

http://webtech.science.uu.nl/group46

Website overview:
Our website is a social network for students, allowing users to register, log in, and interact with other students. 
Users can manage their profiles, browse courses, send friend requests, accept requests, and exchange messages with friends. 
The application uses a client-server architecture with a Node.js backend and an SQLite database.

Application structure:
1. bin/
Contains the startup scripts for the application.(the www file)
2. middleware/
Contains middleware functions for handling specific tasks like authentication, user login and registration and helping the database.
3. private/
Stores private files that should not be publicly accessible.
Includes sensitive data like database connection logic and utility functions for interacting with the database.
4. public/
Contains static assets accessible to the client.
images/: Stores user-uploaded photos and other images used in the application.
javascripts/: Contains client-side JavaScript files for dynamic functionality.
stylesheets/: Includes CSS files for styling the website.
5. routes/
Defines the server-side logic for handling HTTP requests.
auth.js: Handles authentication-related routes (login, logout, registration).
public.js: Handles routes accessible to all users (homepage).
user.js: Handles routes for logged-in users and gets the other user pages.
6. views/
Contains HTML templates (Pug) for rendering dynamic content on the client side.
Templates are organized based on functionality (login page, profile page, course page, messages page).
7. app.js
The main entry point of the application.
Sets up the Express server, middleware, routes, and database connection.
Initializes session handling, logging, and error handling.

Logins and passwords of all registered users:
a@a - a

Database Structure:
The database is implemented using SQLite and consists of the following tables:

Program: Stores information about academic programs.
Course: Stores course details.
Student: Stores user profiles, including personal details and credentials.
CourseEnrollment: Links students to the courses they have taken.
Friendship: Tracks friendships between students.
Friend: Links students to specific friendships.
FriendRequest: Tracks pending friend requests.
Chat: Stores chat sessions between friends.
Message: Stores messages exchanged in chats.
ChatParticipent: Links students to chat sessions.
Session: Tracks user sessions for authentication.

The SQL definition of our database:
CREATE TABLE Program (
  programId INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR NOT NULL,
  description VARCHAR NOT NULL
);

CREATE TABLE Course (
  courseID INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR NOT NULL,
  description VARCHAR NOT NULL,
  code VARCHAR NOT NULL,
  instructor VARCHAR NOT NULL
);

CREATE TABLE Student (
  studentId INTEGER PRIMARY KEY AUTOINCREMENT,
  programId INTEGER,
  firstName VARCHAR NOT NULL,
  lastName VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  password VARCHAR NOT NULL,
  birthDate DATE,
  photoLink VARCHAR,
  hobbies VARCHAR,
  FOREIGN KEY(programId) REFERENCES Program(programId)
);

CREATE TABLE CourseEnrollment (
  studentId INTEGER,
  courseId INTEGER,
  FOREIGN KEY(studentId) REFERENCES Student(studentId),
  FOREIGN KEY(courseId) REFERENCES Course(courseId)
  UNIQUE(studentId, courseId)
);

CREATE TABLE Friendship (
  friendshipId INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL
);

CREATE TABLE Friend (
  friendshipId INTEGER NOT NULL,
  studentId INTEGER NOT NULL,
  PRIMARY KEY(friendshipId, studentId),
  FOREIGN KEY(friendshipId) REFERENCES Friendship(friendshipId),
  FOREIGN KEY(studentId) REFERENCES Student(studentId)
);

CREATE TABLE FriendRequest (
  studentId_sender INTEGER NOT NULL,
  studentId_receiver INTEGER NOT NULL,
  date DATE NOT NULL,
  PRIMARY KEY (studentId_sender, studentId_receiver),
  FOREIGN KEY(studentId_sender) REFERENCES Student(studentId),
  FOREIGN KEY(studentId_receiver) REFERENCES Student(studentId)
);

CREATE TABLE Chat (
  chatId INTEGER PRIMARY KEY AUTOINCREMENT,
  creationDate DATE NOT NULL,
  name VARCHAR NOT NULL
);

CREATE TABLE Message (
  messageId INTEGER PRIMARY KEY AUTOINCREMENT,
  chatId INTEGER NOT NULL,
  studentId_sender INTEGER NOT NULL,
  content VARCHAR NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  FOREIGN KEY(chatId) REFERENCES Chat(chatId),
  FOREIGN KEY(studentId_sender) REFERENCES Student(studentId)
);

CREATE TABLE ChatParticipent (
  chatId INTEGER NOT NULL,
  studentId INTEGER NOT NULL,
  FOREIGN KEY(chatId) REFERENCES Chat(chatId),
  FOREIGN KEY(studentId) REFERENCES Student(studentId)
);

CREATE TABLE Session (
    sessionId TEXT PRIMARY KEY,  
    studentId INTEGER,     
    expiresAt INTEGER,   
    createdAt INTEGER,
    FOREIGN KEY (studentId) REFERENCES Student(studentId)
);
