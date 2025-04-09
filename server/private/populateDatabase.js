/* === Populates the database with fake students, programs, courses, enrollments, and friendships using Faker and SQLite. === */
const fs = require('fs');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');
const fsPromises = require('fs/promises');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Number of students to generate
const numberOfStudents = 50;

// Path to the database
const dbPath = path.join(__dirname, 'my.db')

// Open the database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to the database.');
});

// Function to hash the password
const hashPassword = (password) => {
  return bcrypt.hash(password, 10);
};

// Function to generate random student data
const generateRandomStudentData = async () => {
  const students = [];

  for (let i = 0; i < numberOfStudents; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

    console.log(`Generated email for ${firstName} ${lastName}: ${email}`); // Log the email

    const birthDate = faker.date.between({
      from: new Date(new Date().setFullYear(new Date().getFullYear() - 25)),
      to: new Date(new Date().setFullYear(new Date().getFullYear() - 17))
    }).toISOString().split('T')[0];
    const photoLink = `https://randomuser.me/api/portraits/men/${i}.jpg`; // Random user photo link
    const hobbiesList = ["Reading", "Gaming", "Traveling", "Cooking", "Swimming", "Cycling", "Coding", "Football"];
    const randomHobby = hobbiesList[Math.floor(Math.random() * hobbiesList.length)];

    // Hash the password 'a'
    const passwordHash = await hashPassword("a");

    students.push({
      firstName,
      lastName,
      email,
      passwordHash,
      birthDate,
      photoLink,
      hobbies: randomHobby,
    });
  }

  return students;
};

// Function to generate programs data
const generateProgramsData = () => {
  return [{
      name: "Computer Science",
      description: "Study of computer systems, software, and data processing."
    },
    {
      name: "Information Technology",
      description: "The study of how information is stored, processed, and retrieved."
    },
    {
      name: "Artificial Intelligence",
      description: "Exploring machines that can perform tasks that typically require human intelligence."
    },
  ];
};

// Function to generate courses data
const generateCoursesData = () => {
  return [{
      name: "Computer Architecture and Networks",
      description: "Learn about computer hardware and networking.",
      code: "INFONW",
      instructor: "Lennart Herlaar"
    },
    {
      name: "Imperial Programming",
      description: "Learn basic programming concepts.",
      code: "INFOIMP",
      instructor: "Jeroen Fokker"
    },
    {
      name: "Game Programming",
      description: "Introduction to game development and programming.",
      code: "INFOB1GP",
      instructor: "Angelos Chatzimparmpas"
    },
    {
      name: "Logic for Computer Science",
      description: "Learn logic foundations for computing.",
      code: "INFOB1LI",
      instructor: "Wouter Swierstra"
    },
    {
      name: "Computer Science Introduction Project",
      description: "A project-based introduction to computer science.",
      code: "INFOB1PICA",
      instructor: "Jelle Oostveen"
    },
    {
      name: "Game Technology Introduction Project",
      description: "Project-based learning about game technology.",
      code: "INFOB1PGT",
      instructor: "Simon van Wageningen"
    },
    {
      name: "Databases",
      description: "Introduction to relational databases and SQL.",
      code: "INFODB",
      instructor: "Hans Philippi"
    },
    {
      name: "Game Design",
      description: "The principles of designing games.",
      code: "INFOB2GO",
      instructor: "Sander Bakkes"
    },
    {
      name: "Web Technology",
      description: "Introduction to web development and technologies.",
      code: "INFOB2WT",
      instructor: "Sergey Sosnovsky"
    },
    {
      name: "Machine learning",
      description: "An advanced course about machine learning",
      code: "INFOB3ML",
      instructor: "Thijs van Ommen"
    },
  ];
};

// Function to insert data into the database
const insertDataIntoDb = async () => {
  try {
    const programs = generateProgramsData();
    const courses = generateCoursesData();
    const students = await generateRandomStudentData();

    // Insert programs into the Program table
    const programInsertPromises = programs.map((program) => {
      return new Promise((resolve, reject) => {
        db.run("INSERT INTO Program(name, description) VALUES (?, ?)",
          [program.name, program.description],
          function (err) {
            if (err) {
              reject('Error inserting program:', err);
            }
            resolve({
              programId: this.lastID,
              name: program.name
            }); // Capture the inserted program ID
          });
      });
    });

    // Wait for programs to be inserted
    const insertedPrograms = await Promise.all(programInsertPromises);

    // Insert courses into the Course table
    const courseInsertPromises = courses.map((course) => {
      return new Promise((resolve, reject) => {
        db.run("INSERT INTO Course(name, description, code, instructor) VALUES (?, ?, ?, ?)",
          [course.name, course.description, course.code, course.instructor],
          function (err) {
            if (err) {
              reject('Error inserting course:', err);
            }
            resolve({
              courseId: this.lastID,
              code: course.code
            }); // Capture the inserted course ID
          });
      });
    });

    // Wait for courses to be inserted
    const insertedCourses = await Promise.all(courseInsertPromises);

    // Insert students into the Student table and assign them a random programId
    const studentInsertPromises = students.map((student) => {
      const randomProgram = insertedPrograms[Math.floor(Math.random() * insertedPrograms.length)];
      return new Promise((resolve, reject) => {
        db.run("INSERT INTO Student(programId, firstName, lastName, email, password, birthDate, photoLink, hobbies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [randomProgram.programId, student.firstName, student.lastName, student.email, student.passwordHash, student.birthDate, student.photoLink, student.hobbies],
          function (err) {
            if (err) {
              reject('Error inserting student:', err);
            }
            resolve({
              studentId: this.lastID,
              programId: randomProgram.programId
            });
          });
      });
    });

    // Wait for students to be inserted
    const insertedStudents = await Promise.all(studentInsertPromises);

    // Enroll students in a random set of courses (2-4 courses each)
    const studentCourseInsertPromises = insertedStudents.map((student) => {
      // Randomly select 2-4 courses for each student
      const selectedCourses = [];
      const numCourses = Math.floor(Math.random() * 3) + 2; // Randomly select 2 to 4 courses
      while (selectedCourses.length < numCourses) {
        const randomCourse = insertedCourses[Math.floor(Math.random() * insertedCourses.length)];
        if (!selectedCourses.includes(randomCourse.courseId)) {
          selectedCourses.push(randomCourse.courseId);
        }
      }

      // Insert each student's course enrollments into CourseEnrollment table
      return new Promise((resolve, reject) => {
        const coursePromises = selectedCourses.map((courseId) => {
          console.log(`Enrolling student ${student.studentId} in course ${courseId}`); // Debug log
          return new Promise((resolveCourse, rejectCourse) => {
            db.run("INSERT INTO CourseEnrollment(studentId, courseId) VALUES (?, ?)",
              [student.studentId, courseId], (err) => {
                if (err) {
                  console.error('Error enrolling student in course:', err);
                  rejectCourse('Error enrolling student in course:', err);
                }
                resolveCourse();
              });
          });
        });

        // Wait for all course enrollments for this student to finish
        Promise.all(coursePromises)
          .then(() => resolve())
          .catch((err) => reject(err));
      });
    });

    // Wait for all students to be enrolled in courses
    await Promise.all(studentCourseInsertPromises);

    // Generate random friendships
    const generateFriendships = async () => {
      const friendships = new Set();
      const numberOfFriendships = Math.floor(students.length * 1.5); // Around 1.5x friendships per student

      while (friendships.size < numberOfFriendships) {
        const s1 = insertedStudents[Math.floor(Math.random() * insertedStudents.length)];
        const s2 = insertedStudents[Math.floor(Math.random() * insertedStudents.length)];

        if (s1.studentId !== s2.studentId) {
          const key = [s1.studentId, s2.studentId].sort().join('-');
          if (!friendships.has(key)) {
            friendships.add(key);
          }
        }
      }

      const friendshipInsertPromises = [...friendships].map((key) => {
        const [id1, id2] = key.split('-').map(Number);
        const date = faker.date.past({
          years: 1
        }).toISOString().split('T')[0];

        return new Promise((resolve, reject) => {
          db.run("INSERT INTO Friendship(date) VALUES (?)", [date], function (err) {
            if (err) return reject(err);
            const friendshipId = this.lastID;

            db.run("INSERT INTO Friend(friendshipId, studentId) VALUES (?, ?)", [friendshipId, id1], (err1) => {
              if (err1) return reject(err1);
              db.run("INSERT INTO Friend(friendshipId, studentId) VALUES (?, ?)", [friendshipId, id2], (err2) => {
                if (err2) return reject(err2);
                resolve();
              });
            });
          });
        });
      });

      await Promise.all(friendshipInsertPromises);
    };

    await generateFriendships();
    console.log("Friendships have been generated and inserted.");


    console.log('Data has been inserted into the database, and students are enrolled in programs and courses.');
  } catch (error) {
    console.error('Error inserting data:', error);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
      console.log('Database connection closed.');
    });
  }
};

module.exports = insertDataIntoDb;