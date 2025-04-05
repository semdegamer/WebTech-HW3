const sqlite3 = require("sqlite3").verbose(); // verbose for better error logging
const fs = require("fs");
const fsPromises = require("fs/promises");
const bcrypt = require('bcrypt'); // Library for hashing passwords securely

// the db variable, no value yet because for now the db first needs to be deleted, which is asynchronous
var dbpath = "private/my.db";
var db;

// fills the db with the tables and some dummy data.
const filldb = () => {
  // Initialize database and create necessary tables synchronously
  db = new sqlite3.Database(dbpath);

  return fsPromises.readFile("private/dbdef.txt")
    .then((sql) => execute(sql.toString()))
    .then(() => bcrypt.hash("a", 10))
    .then((passwordHash) => 
      runSql("INSERT INTO Student(firstName, lastName, email, password) VALUES(?, ?, ?, ?);", ["sem", "mathan", "a@a", passwordHash])
    )
    .then(() => {
      // Insert dummy courses into the Course table
      const courses = [
        { name: "Computer Architecture and Networks", description: "Learn about computer hardware and networking.", code: "INFONW", instructor: "Lennart Herlaar" },
        { name: "Imperial Programming", description: "Learn basic programming concepts.", code: "INFOIMP", instructor: "Jeroen Fokker" },
        { name: "Game Programming", description: "Introduction to game development and programming.", code: "INFOB1GP", instructor: "Angelos Chatzimparmpas" },
        { name: "Logic for Computer Science", description: "Learn logic foundations for computing.", code: "INFOB1LI", instructor: "Wouter Swierstra" },
        { name: "Computer Science Introduction Project", description: "A project-based introduction to computer science.", code: "INFOB1PICA", instructor: "Jelle Oostveen" },
        { name: "Game Technology Introduction Project", description: "Project-based learning about game technology.", code: "INFOB1PGT", instructor: "Simon van Wageningen" },
        { name: "Databases", description: "Introduction to relational databases and SQL.", code: "INFODB", instructor: "Hans Philippi" },
        { name: "Game Design", description: "The principles of designing games.", code: "INFOB2GO", instructor: "Sander Bakkes" },
        { name: "Web Technology", description: "Introduction to web development and technologies.", code: "INFOB2WT", instructor: "Sergey Sosnovsky" },
      ];

      // Insert courses into the database
      return Promise.all(courses.map(course => 
        runSql("INSERT INTO Course(name, description, code, instructor) VALUES(?, ?, ?, ?);", 
          [course.name, course.description, course.code, course.instructor])
      ));
    })
    .then(() => {
      // Insert additional dummy students
      const additionalStudents = [
        { firstName: "Alice", lastName: "Smith", email: "alice@example.com", password: "a" },
        { firstName: "Bob", lastName: "Jones", email: "bob@example.com", password: "a" },
        { firstName: "Charlie", lastName: "Brown", email: "charlie@example.com", password: "a" }
      ];
      return Promise.all(additionalStudents.map(student =>
        bcrypt.hash(student.password, 10).then(hash =>
          runSql("INSERT INTO Student(firstName, lastName, email, password) VALUES(?, ?, ?, ?);", 
            [student.firstName, student.lastName, student.email, hash])
        )
      ));
    })
    .then(() => {
      // Retrieve the specific courseID for "Computer Architecture and Networks"
      return allSql("SELECT courseID FROM Course WHERE name = ?;", ["Computer Architecture and Networks"]);
    })
    .then((courseRows) => {
      if (!courseRows || courseRows.length === 0) {
        throw new Error("Computer Architecture and Networks course not found");
      }
      const archCourseId = courseRows[0].courseID;
      // Retrieve additional students
      return allSql("SELECT studentId FROM Student WHERE email != ?;", ["a@a"])
        .then((students) => ({ archCourseId, students }));
    })
    .then(({ archCourseId, students }) => {
      // Enroll each additional student in "Computer Architecture and Networks"
      const enrollmentPromises = students.map(student =>
        runSql("INSERT INTO CourseEnrollment(studentId, courseId) VALUES(?, ?);", 
          [student.studentId, archCourseId])
      );
      return Promise.all(enrollmentPromises);
    })
    .then(() => console.log("Database populated: courses added, additional students inserted and enrolled in Computer Architecture and Networks."))
    .catch(err => console.error("Error filling the database:", err));
};


// deletes the db if it exists, and then calls fillDb
if (fs.existsSync(dbpath)) {
  fsPromises.unlink(dbpath)
  .then(() => filldb())
  .catch((err) => console.log(err));
} else {
  filldb()
  .catch((err) => console.log(err));
}

// for simply executing a sql queries without params
const execute = async (sql, localDb) => {
  if (!localDb)
    localDb = db;
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

// for executing a single sql query with params and no result
const runSql = (sql, params = [], localDb) => new Promise((res, rej) => {
  if (!localDb)
    localDb = db;
  db.run(sql, params, function (err, result) {
    if (err)
      rej(err);
    else
      res({lastID: this.lastID, changes: this.changes});
  });
});

// for executing a single sql query with params and returns a single result
const getSql = (sql, params = [], localDb) => new Promise((res, rej) => {
  if (!localDb)
    localDb = db;
  db.get(sql, params, function (err, result) {
    if (err)
      rej(err);
    else
      res(result, {lastID: this.lastID, changes: this.changes});
  });
});

// for executing a single sql query with params and returns the results
const allSql = (sql, params = [], localDb) => new Promise((res, rej) => {
  if (!localDb)
    localDb = db;
  db.all(sql, params, function (err, result) {
    if (err)
      rej(err);
    else
      res(result, {lastID: this.lastID, changes: this.changes});
  });
});

// the module function that adds the usefull db functions and the db itself to the req object, for easy access by other middleware
function dbHelper(req, res, next) {
  req.db = {
    baseDb: db,
    runSql: runSql,
    getSql: getSql,
    allSql: allSql
  };
  next();
}

module.exports = dbHelper;